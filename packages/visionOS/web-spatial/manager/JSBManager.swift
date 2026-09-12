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

/// Bridges JavaScript commands to their native handlers.
///
/// Commands flow through a two-stage structured pipeline. `handlerMessage` runs
/// a cheap prologue on the main thread and yields into the decode stage, which a
/// single detached consumer drains off the main actor; that stage hands finished
/// work to a `@MainActor` consumer which invokes the handler and serializes the
/// reply.
///
/// Each stage is one sequential `for await` loop, which is what preserves order.
/// WebKit delivers script messages in the order JavaScript sent them and command
/// sequences rely on it: `play()`/`pause()` and the other `control` calls return
/// a promise with no JS-side queue, so an app that does not await them puts
/// several commands in flight at once, and the SDK itself sends some commands
/// fire-and-forget. Neither unstructured `Task`s nor an actor would do: tasks
/// carry no ordering guarantee between each other, and an actor executes jobs
/// from separate tasks in an unspecified order. Two sequential stages also let
/// the next payload decode overlap the current handler running on main.
class JSBManager {
    typealias ResolveHandler<T> = (Result<T?, JsbError>) -> Void

    private typealias ReplyHandler = (Any?, String?) -> Void

    /// A command entering the decode stage.
    ///
    /// `@unchecked Sendable`: it carries the registered handler and WebKit's
    /// reply closure, neither of which is `Sendable`, but the pipeline hands
    /// each value to exactly one executor at a time — the decode stage, then the
    /// main actor — so they are never touched concurrently.
    private enum PendingCommand: @unchecked Sendable {
        /// Needs its payload decoded before a handler can run.
        case decode(
            actionKey: String,
            message: String,
            payloadStart: String.Index,
            type: CommandDataProtocol.Type,
            action: ((CommandDataProtocol, @escaping ResolveHandler<Encodable>) -> Void)?,
            reply: ReplyHandler?
        )
        /// Already resolved. Passes through the decode stage anyway so it keeps
        /// its place behind a command that is still being decoded.
        case ready(MainWork)
    }

    /// Work for the main-actor stage, delivered in arrival order.
    private enum MainWork: @unchecked Sendable {
        /// Invoke a resolved handler and serialize whatever it resolves to.
        case run((@escaping ResolveHandler<Encodable>) -> Void, ReplyHandler?)
        /// The payload was missing or could not be decoded.
        case payloadError(actionKey: String, ReplyHandler?)
        /// No handler is registered for the command.
        case invalidJSB(message: String, ReplyHandler?)
    }

    private var typeMap = [String: CommandDataProtocol.Type]()
    private var actionWithDataMap: [String: (_ data: CommandDataProtocol, _ event: @escaping ResolveHandler<Encodable>) -> Void] = [:]
    private var actionWithoutDataMap: [String: (@escaping ResolveHandler<Encodable>) -> Void] = [:]

    /// Encoder for the replies built in the main-thread prologue. The pipeline's
    /// main stage owns a separate one, so neither is ever shared across
    /// executors.
    private let encoder = JSONEncoder()

    /// Entrance to the decode stage. Yielding is non-blocking and thread-safe,
    /// so the prologue never waits.
    private let pipeline: AsyncStream<PendingCommand>.Continuation

    init() {
        let (commands, commandInput) = AsyncStream<PendingCommand>.makeStream(
            // Never drop a command: a dropped one leaves its JS promise pending
            // forever.
            bufferingPolicy: .unbounded
        )
        let (mainWork, mainInput) = AsyncStream<MainWork>.makeStream(
            bufferingPolicy: .unbounded
        )
        pipeline = commandInput

        // Neither stage captures `self`. Each owns the coder it needs, so the
        // pipeline cannot retain the manager into a cycle, and a teardown
        // drains the buffered commands instead of dropping their replies.
        //
        // Detached on purpose: a plain `Task` would inherit the enclosing actor
        // and could put decoding back on the main actor.
        Task.detached(priority: .userInitiated) {
            let decoder = JSONDecoder()
            for await command in commands {
                mainInput.yield(JSBManager.resolve(command, using: decoder))
            }
            // Ordered shutdown: the first stage closes the second only once it
            // has drained.
            mainInput.finish()
        }

        Task { @MainActor in
            let encoder = JSONEncoder()
            for await work in mainWork {
                JSBManager.perform(work, using: encoder)
            }
        }
    }

    deinit {
        // Finishing only the entrance drains the pipeline in order; each stage
        // then closes the next.
        pipeline.finish()
    }

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

    /// Dispatches one JSB message, decoding its payload off the main actor.
    ///
    /// Must be called on the main thread, which is where WebKit delivers script
    /// messages. Only the registration lookups happen here, so the maps stay
    /// main-thread-only and need no lock; the payload-sized work — the UTF-8
    /// conversion and JSON decode — belongs to the decode stage.
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
            // Replies that invoke no handler are sent straight back: they carry
            // no ordering relationship to commands still in the pipeline.
            if JSBManager.commandRequiresPayload(actionKey) {
                replyHandler?(nil, JSBManager.payloadErrorReply(for: actionKey, using: encoder))
                return
            }
            guard let action = actionWithoutDataMap[actionKey] else {
                JSBManager.reportInvalidJSB(message, replyHandler)
                return
            }
            pipeline.yield(.ready(.run(action, replyHandler)))
            return
        }

        // The action is looked up here but resolved only after decoding: a type
        // can be registered without a handler, and such a command must still
        // report a malformed payload rather than an unknown command.
        guard let type = typeMap[actionKey] else {
            JSBManager.reportInvalidJSB(message, replyHandler)
            return
        }

        // `message` is passed by value; Swift strings are copy-on-write, so the
        // payload bytes are converted on the decode stage rather than here.
        pipeline.yield(.decode(
            actionKey: actionKey,
            message: message,
            payloadStart: payloadStart,
            type: type,
            action: actionWithDataMap[actionKey],
            reply: replyHandler
        ))
    }

    /// Decode stage: turns a pending command into main-actor work. Runs off the
    /// main actor, one command at a time.
    private static func resolve(
        _ command: PendingCommand,
        using decoder: JSONDecoder
    ) -> MainWork {
        switch command {
        case let .ready(work):
            return work

        case let .decode(actionKey, message, payloadStart, type, action, reply):
            let data: CommandDataProtocol
            do {
                data = try decoder.decode(
                    type.self,
                    from: Data(message[payloadStart...].utf8)
                )
            } catch {
                return .payloadError(actionKey: actionKey, reply)
            }
            guard let action else {
                return .invalidJSB(message: message, reply)
            }
            return .run({ callback in action(data, callback) }, reply)
        }
    }

    /// Main stage: invokes the handler and serializes its reply.
    @MainActor
    private static func perform(_ work: MainWork, using encoder: JSONEncoder) {
        switch work {
        case let .run(action, replyHandler):
            action { result in
                switch result {
                case let .success(data):
                    if data == nil {
                        replyHandler?("", nil)
                    } else {
                        replyHandler?(try? data?.toDictionary() ?? "", nil)
                    }

                case let .failure(error):
                    let resultString = encodeReply(
                        JsbErrorData(code: error.code, message: error.message),
                        using: encoder
                    )
                    replyHandler?(nil, resultString)
                }
            }

        case let .payloadError(actionKey, replyHandler):
            replyHandler?(nil, payloadErrorReply(for: actionKey, using: encoder))

        case let .invalidJSB(message, replyHandler):
            reportInvalidJSB(message, replyHandler)
        }
    }

    /// Entity commands carry a mandatory payload and report a dedicated code
    /// when it is missing.
    private static func commandRequiresPayload(_ actionKey: String) -> Bool {
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

    /// Builds the reply for a missing or undecodable payload.
    private static func payloadErrorReply(
        for actionKey: String,
        using encoder: JSONEncoder
    ) -> String? {
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
        return encodeReply(
            JsbErrorData(code: code, message: "Invalid command payload."),
            using: encoder
        )
    }

    private static func reportInvalidJSB(_ message: String, _ replyHandler: ReplyHandler?) {
        print("Invalid JSB!!!", message)
        replyHandler?(nil, "Invalid JSB!!! \(message)")
    }

    private static func encodeReply(_ data: Encodable, using encoder: JSONEncoder) -> String? {
        guard let jsonData = try? encoder.encode(data) else { return nil }
        return String(data: jsonData, encoding: .utf8)
    }
}

extension Encodable {
    func toDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        return try JSONSerialization.jsonObject(with: data, options: .allowFragments) as! [String: Any]
    }
}
