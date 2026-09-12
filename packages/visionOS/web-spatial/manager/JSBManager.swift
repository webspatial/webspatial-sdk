import Foundation

protocol CommandDataProtocol: Decodable {
    static var commandType: String { get }
}

protocol ReplyDataProtocol: Encodable {
    static var dataType: String { get }
}

struct JsbErrorData: Encodable {
    var code: ReplyCode?
    var message: String?
}

enum ReplyCode: String, Encodable {
    case TypeError
    case CommandError
    case InvalidSpatialObject
    case InvalidMatrix
    /// Entity target does not exist.
    case TARGET_NOT_FOUND
    /// Entity target cannot run motion.
    case UNSUPPORTED_TARGET
    /// Animation object does not exist.
    case ANIMATION_NOT_FOUND
    /// Entity-motion timeline is invalid.
    case INVALID_TIMELINE
    /// Native animation compilation failed.
    case COMPILATION_FAILED
    /// Control operation is invalid for the current state.
    case INVALID_CONTROL_STATE
    /// Sparse transform values are invalid.
    case INVALID_SET_VALUES

    /// Maps the closed entity-motion error set into synchronous JSB reply codes.
    init(entityMotion code: EntityMotionErrorCode) {
        self = ReplyCode(rawValue: code.rawValue)!
    }

    /// Encodes entity-motion codes as strings while preserving legacy reply JSON.
    func encode(to encoder: Encoder) throws {
        switch self {
        case .TypeError, .CommandError, .InvalidSpatialObject, .InvalidMatrix:
            try [rawValue: [String: String]()].encode(to: encoder)
        default:
            var container = encoder.singleValueContainer()
            try container.encode(rawValue)
        }
    }
}

struct JsbError: Error, Encodable {
    let code: ReplyCode
    let message: String
}

class JSBManager {
    typealias ResolveHandler<T> = (Result<T?, JsbError>) -> Void

    private var typeMap = [String: CommandDataProtocol.Type]()
    private var actionWithDataMap: [String: (_ data: CommandDataProtocol, _ event: @escaping ResolveHandler<Encodable>) -> Void] = [:]
    private var actionWithoutDataMap: [String: (@escaping ResolveHandler<Encodable>) -> Void] = [:]

    /// Shared encoder for reply payloads. Confined to the main thread, which is
    /// where every reply is serialized.
    private let encoder = JSONEncoder()

    /// Serial queue that moves payload decoding off the main thread.
    ///
    /// WebKit delivers script messages to the handler in the order JavaScript
    /// sent them, and command sequences rely on it: `play()`/`pause()` and the
    /// other `control` calls return a promise without any JS-side queue, so an
    /// app that does not await them puts several commands in flight at once. A
    /// serial queue feeding a single main-queue hop keeps that arrival order,
    /// which a concurrent queue would not: a small `ControlEntityAnimation`
    /// payload would otherwise overtake a large `CreateEntityAnimation`
    /// timeline still being decoded.
    private let decodeQueue = DispatchQueue(
        label: "com.webspatial.jsb.decode",
        qos: .userInitiated
    )

    /// Reused across commands to avoid a per-message allocation. Only ever
    /// touched on `decodeQueue`, which is serial.
    private let decoder = JSONDecoder()

    func register<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap[T.commandType] = type
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (T, @escaping ResolveHandler<Encodable>) -> Void) {
        typeMap[T.commandType] = type
        actionWithDataMap[T.commandType] = { data, result in
            event(data as! T, result)
        }
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (@escaping ResolveHandler<Encodable>) -> Void) {
        typeMap[T.commandType] = type
        actionWithoutDataMap[T.commandType] = event
    }

    func remove<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap.removeValue(forKey: T.commandType)
        actionWithDataMap.removeValue(forKey: T.commandType)
        actionWithoutDataMap.removeValue(forKey: T.commandType)
    }

    func clear() {
        typeMap = [String: CommandDataProtocol.Type]()
        actionWithDataMap = [:]
        actionWithoutDataMap = [:]
    }

    /// Dispatches one JSB message, decoding its payload off the main thread.
    ///
    /// Runs a cheap prologue on the calling (main) thread: it splits the
    /// command key from the payload and resolves the registered handler. That
    /// keeps the registration maps main-thread-only, so no lock is needed. Only
    /// the payload-sized work — the UTF-8 conversion and JSON decode — is
    /// handed to `decodeQueue`, and the handler itself runs back on the main
    /// actor in arrival order.
    func handlerMessage(_ message: String, _ replyHandler: ((Any?, String?) -> Void)? = nil) {
        // Split on the first separator only. The command key never contains
        // "::", but an encoded payload can, and splitting the whole string
        // would both mis-parse those and allocate a copy of every payload.
        let actionKey: String
        let payloadStart: String.Index?
        if let separator = message.range(of: "::") {
            actionKey = String(message[message.startIndex ..< separator.lowerBound])
            payloadStart = separator.upperBound < message.endIndex ? separator.upperBound : nil
        } else {
            actionKey = message
            payloadStart = nil
        }

        guard let payloadStart else {
            if commandRequiresPayload(actionKey) {
                replyHandler?(nil, payloadErrorReply(for: actionKey))
                return
            }
            guard let action = actionWithoutDataMap[actionKey] else {
                reportInvalidJSB(message, replyHandler)
                return
            }
            // Still routed through the queue so a payload-free command keeps
            // its place behind a command that is still decoding.
            // `self` is captured strongly on purpose: the closure is released
            // as soon as it runs, so there is no cycle, and a teardown must not
            // drop the reply and leave the JS promise pending forever.
            decodeQueue.async {
                self.runOnMain(action, replyHandler)
            }
            return
        }

        // Registration maps are only read here, on the main thread, so
        // `register`/`remove`/`clear` never race with the decode queue. The
        // action is looked up now but resolved after decoding: a type can be
        // registered without a handler, and such a command must still report a
        // malformed payload rather than an unknown command.
        guard let type = typeMap[actionKey] else {
            reportInvalidJSB(message, replyHandler)
            return
        }
        let action = actionWithDataMap[actionKey]

        // `message` is captured by value; Swift strings are copy-on-write, so
        // the payload bytes are converted on the queue rather than here.
        decodeQueue.async {
            let data: CommandDataProtocol
            do {
                data = try self.decoder.decode(
                    type.self,
                    from: Data(message[payloadStart...].utf8)
                )
            } catch {
                DispatchQueue.main.async {
                    replyHandler?(nil, self.payloadErrorReply(for: actionKey))
                }
                return
            }
            guard let action else {
                DispatchQueue.main.async {
                    self.reportInvalidJSB(message, replyHandler)
                }
                return
            }
            self.runOnMain({ callback in action(data, callback) }, replyHandler)
        }
    }

    /// Runs a resolved action on the main actor, preserving the order in which
    /// `decodeQueue` hands work over.
    ///
    /// Uses the main queue rather than an unstructured `Task`: tasks carry no
    /// ordering guarantee between each other, so two commands enqueued back to
    /// back could run out of order.
    private func runOnMain(_ action: @escaping (@escaping ResolveHandler<Encodable>) -> Void,
                           _ replyHandler: ((Any?, String?) -> Void)?)
    {
        DispatchQueue.main.async {
            MainActor.assumeIsolated {
                action { result in
                    switch result {
                    case let .success(data):
                        if data == nil {
                            replyHandler?("", nil)
                        } else {
                            replyHandler?(try? data?.toDictionary() ?? "", nil)
                        }

                    case let .failure(error):
                        let resultString = self.parseData(JsbErrorData(
                            code: error.code,
                            message: error.message
                        ))
                        replyHandler?(nil, resultString)
                    }
                }
            }
        }
    }

    /// Entity commands carry a mandatory payload and report a dedicated code
    /// when it is missing.
    private func commandRequiresPayload(_ actionKey: String) -> Bool {
        switch actionKey {
        case CreateEntityAnimationCommand.commandType,
             UpdateEntityAnimationCommand.commandType,
             ControlEntityAnimationCommand.commandType,
             SetEntityAnimationCommand.commandType:
            return true
        default:
            return false
        }
    }

    /// Builds the reply for a missing or undecodable payload. Must be called on
    /// the main thread: it uses the shared `encoder`.
    private func payloadErrorReply(for actionKey: String) -> String? {
        let code: ReplyCode
        switch actionKey {
        case CreateEntityAnimationCommand.commandType,
             UpdateEntityAnimationCommand.commandType:
            code = .INVALID_TIMELINE
        case ControlEntityAnimationCommand.commandType:
            code = .INVALID_CONTROL_STATE
        case SetEntityAnimationCommand.commandType:
            code = .INVALID_SET_VALUES
        default:
            code = .TypeError
        }
        return parseData(JsbErrorData(code: code, message: "Invalid command payload."))
    }

    private func reportInvalidJSB(_ message: String, _ replyHandler: ((Any?, String?) -> Void)?) {
        print("Invalid JSB!!!", message)
        replyHandler?(nil, "Invalid JSB!!! \(message)")
    }

    private func parseData(_ data: Encodable) -> String? {
        if let jsonData = try? encoder.encode(data) {
            let jsonString = String(data: jsonData, encoding: .utf8)
            return jsonString!
        }
        return nil
    }
}

extension Encodable {
    func toDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        return try JSONSerialization.jsonObject(with: data, options: .allowFragments) as! [String: Any]
    }
}
