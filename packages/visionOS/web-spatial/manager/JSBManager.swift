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

    /// WebKit delivers script messages on the main thread, so envelope
    /// splitting and JSON decoding are moved here: a large command payload no
    /// longer blocks rendering or input while it is being parsed. The queue is
    /// serial, so commands stay in the order the web layer sent them, and it is
    /// per manager so one webview's payload never delays another's.
    private let commandQueue = DispatchQueue(label: "com.xrsdk.jsbManagerQueue")

    /// Guards the registration tables below. They are written from the main
    /// thread (scene setup/teardown) and read from `commandQueue` for every
    /// incoming message.
    private let registryLock = NSLock()

    private var typeMap = [String: CommandDataProtocol.Type]()
    private var actionWithDataMap: [String: (_ data: CommandDataProtocol, _ event: @escaping ResolveHandler<Encodable>) -> Void] = [:]
    private var actionWithoutDataMap: [String: (@escaping ResolveHandler<Encodable>) -> Void] = [:]

    func register<T: CommandDataProtocol>(_ type: T.Type) {
        registryLock.lock()
        defer { registryLock.unlock() }
        typeMap[T.commandType] = type
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (T, @escaping ResolveHandler<Encodable>) -> Void) {
        registryLock.lock()
        defer { registryLock.unlock() }
        typeMap[T.commandType] = type
        actionWithDataMap[T.commandType] = { data, result in
            event(data as! T, result)
        }
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (@escaping ResolveHandler<Encodable>) -> Void) {
        registryLock.lock()
        defer { registryLock.unlock() }
        typeMap[T.commandType] = type
        actionWithoutDataMap[T.commandType] = event
    }

    func remove<T: CommandDataProtocol>(_ type: T.Type) {
        registryLock.lock()
        defer { registryLock.unlock() }
        typeMap.removeValue(forKey: T.commandType)
        actionWithDataMap.removeValue(forKey: T.commandType)
        actionWithoutDataMap.removeValue(forKey: T.commandType)
    }

    func clear() {
        registryLock.lock()
        defer { registryLock.unlock() }
        typeMap = [String: CommandDataProtocol.Type]()
        actionWithDataMap = [:]
        actionWithoutDataMap = [:]
    }

    /// Accepts one JSB message and returns immediately.
    ///
    /// Parsing and decoding run on `commandQueue`; the registered action still
    /// runs on the main actor, and every reply is delivered on the main thread
    /// because that is where WebKit expects its reply handlers to run.
    func handlerMessage(_ message: String, _ replyHandler: ((Any?, String?) -> Void)? = nil) {
        commandQueue.async {
            self.decodeMessage(message, replyHandler)
        }
    }

    /// Parses one JSB envelope off the main thread and hands the decoded
    /// command to its registered action.
    private func decodeMessage(_ message: String, _ replyHandler: ((Any?, String?) -> Void)?) {
        let actionKey = message.components(separatedBy: "::").first ?? ""
        do {
            let jsbInfo = message.components(separatedBy: "::")
            let hasData = jsbInfo.count == 2 && jsbInfo[1] != ""
            let requiresEntityPayload = actionKey == CreateEntityAnimationCommand.commandType
                || actionKey == UpdateEntityAnimationCommand.commandType
                || actionKey == ControlEntityAnimationCommand.commandType
                || actionKey == SetEntityAnimationCommand.commandType
            if requiresEntityPayload, !hasData {
                throw DecodingError.dataCorrupted(
                    .init(
                        codingPath: [],
                        debugDescription: "Entity command payload is required."
                    )
                )
            }

            if hasData {
                let data = try deserialize(cmdType: actionKey, cmdContent: jsbInfo[1])
                if let action = actionWithData(for: actionKey) {
                    handleAction(action: { callback in
                        action(data!, callback)
                    }, replyHandler: replyHandler)
                } else {
                    print("Invalid JSB!!!", message)
                    reply(replyHandler, nil, "Invalid JSB!!! \(message)")
                }
            } else {
                if let action = actionWithoutData(for: actionKey) {
                    handleAction(action: action, replyHandler: replyHandler)
                } else {
                    print("Invalid JSB!!!", message)
                    reply(replyHandler, nil, "Invalid JSB!!! \(message)")
                }
            }
        } catch {
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
            let resultString = parseData(
                JsbErrorData(code: code, message: "Invalid command payload.")
            )
            reply(replyHandler, nil, resultString)
        }
    }

    private func handleAction(action: @escaping (@escaping ResolveHandler<Encodable>) -> Void,
                              replyHandler: ((Any?, String?) -> Void)?)
    {
        Task { @MainActor in
            action { result in
                switch result {
                case let .success(data):
                    if data == nil {
                        self.reply(replyHandler, "", nil)
                    } else {
                        self.reply(replyHandler, (try? data?.toDictionary() ?? ""), nil)
                    }

                case let .failure(error):
                    let resultString = self.parseData(JsbErrorData(
                        code: error.code,
                        message: error.message
                    ))
                    self.reply(replyHandler, nil, resultString)
                }
            }
        }
    }

    /// Delivers a JSB reply on the main thread. Replies now originate either
    /// from `commandQueue` (payload errors) or from a handler that may resolve
    /// on any thread, and WebKit's reply handlers must be called on the main
    /// thread. Already-main callers keep their previous synchronous timing.
    private func reply(_ replyHandler: ((Any?, String?) -> Void)?,
                       _ result: Any?,
                       _ error: String?)
    {
        guard let replyHandler else { return }
        if Thread.isMainThread {
            replyHandler(result, error)
        } else {
            DispatchQueue.main.async {
                replyHandler(result, error)
            }
        }
    }

    private func deserialize(cmdType: String, cmdContent: String?) throws -> CommandDataProtocol? {
        let decoder = JSONDecoder()

        guard let type = typeof(for: cmdType) else {
            print("unknownType")
            return nil
        }
        if cmdContent == nil {
            return nil
        }
        return try decoder.decode(type.self, from: cmdContent!.data(using: .utf8)!)
    }

    private func typeof(for key: String) -> CommandDataProtocol.Type? {
        registryLock.lock()
        defer { registryLock.unlock() }
        return typeMap[key]
    }

    private func actionWithData(for key: String) -> ((CommandDataProtocol, @escaping ResolveHandler<Encodable>) -> Void)? {
        registryLock.lock()
        defer { registryLock.unlock() }
        return actionWithDataMap[key]
    }

    private func actionWithoutData(for key: String) -> ((@escaping ResolveHandler<Encodable>) -> Void)? {
        registryLock.lock()
        defer { registryLock.unlock() }
        return actionWithoutDataMap[key]
    }

    private func parseData(_ data: Encodable) -> String? {
        // Encoding now happens on both `commandQueue` and the main actor, so the
        // encoder is created per call instead of shared as mutable state.
        let encoder = JSONEncoder()
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
