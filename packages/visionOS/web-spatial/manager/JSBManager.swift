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

    private let encoder = JSONEncoder()

    /// Serial so decode order - and therefore command execution order - still
    /// matches the order messages arrived from the web view.
    private let decodeQueue = DispatchQueue(
        label: "com.xrsdk.jsbDecodeQueue",
        qos: .userInitiated
    )

    /// Bounds the separator scan. Command keys are 43 characters at most, so a
    /// multi-megabyte blob chunk is never walked on the main thread.
    private static let maxCommandKeyLength = 128

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

    func handlerMessage(_ message: String, _ replyHandler: ((Any?, String?) -> Void)? = nil) {
        let header = message.prefix(Self.maxCommandKeyLength)
        let separator = header.range(of: "::")
        let actionKey = String(header[header.startIndex ..< (separator?.lowerBound ?? header.endIndex)])
        let payloadStart = separator?.upperBound

        let requiresEntityPayload = actionKey == CreateEntityAnimationCommand.commandType
            || actionKey == UpdateEntityAnimationCommand.commandType
            || actionKey == ControlEntityAnimationCommand.commandType
            || actionKey == SetEntityAnimationCommand.commandType

        // Resolved here so the registration maps stay confined to the main thread.
        let type = typeMap[actionKey]
        let dataAction = actionWithDataMap[actionKey]
        let voidAction = actionWithoutDataMap[actionKey]

        // Decoding a blob chunk means parsing megabytes of Base64. Keeping it off
        // the main thread stops model transfers from dropping scroll frames.
        decodeQueue.async {
            // First separator only: JSON payloads may legitimately contain "::".
            let payload = payloadStart.map { message[$0...] } ?? ""

            if payload.isEmpty {
                if requiresEntityPayload {
                    self.replyInvalidPayload(actionKey: actionKey, replyHandler: replyHandler)
                } else if let voidAction {
                    self.handleAction(action: voidAction, replyHandler: replyHandler)
                } else {
                    self.replyInvalidCommand(actionKey: actionKey, replyHandler: replyHandler)
                }
                return
            }

            guard let type, let dataAction else {
                self.replyInvalidCommand(actionKey: actionKey, replyHandler: replyHandler)
                return
            }
            do {
                let data = try JSONDecoder().decode(type.self, from: Data(payload.utf8))
                self.handleAction(action: { callback in
                    dataAction(data, callback)
                }, replyHandler: replyHandler)
            } catch {
                self.replyInvalidPayload(actionKey: actionKey, replyHandler: replyHandler)
            }
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

    /// Both reply helpers hop to main: WebKit expects reply handlers there, and
    /// `parseData` shares one encoder with the `handleAction` path.
    private func replyInvalidPayload(actionKey: String, replyHandler: ((Any?, String?) -> Void)?) {
        DispatchQueue.main.async {
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
            replyHandler?(nil, self.parseData(
                JsbErrorData(code: code, message: "Invalid command payload.")
            ))
        }
    }

    private func replyInvalidCommand(actionKey: String, replyHandler: ((Any?, String?) -> Void)?) {
        DispatchQueue.main.async {
            // Logs the key only - a blob chunk message is megabytes long.
            print("Invalid JSB!!!", actionKey)
            replyHandler?(nil, "Invalid JSB!!! \(actionKey)")
        }
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
