import Foundation

protocol CommandDataProtocol: Codable {
    static var commandType: String { get }
}

struct JsbReplyData: Codable {
    let success: Bool
    var code: ReplyCode?
    var data: String?
    var message: String?
}

enum ReplyCode: Codable {
    case TypeError
    case CommandError
    case InvalidSpatialObject
}

struct JsbError: Error, Codable {
    let code: ReplyCode
    let message: String
}

class JSBManager {
    typealias ResolveHandler<T> = (Result<T?, JsbError>) -> Void

    private var typeMap = [String: CommandDataProtocol.Type]()
    private var actionWithDataMap: [String: (_ data: CommandDataProtocol, _ event: @escaping ResolveHandler<Codable>) -> Void] = [:]
    private var actionWithoutDataMap: [String: (@escaping ResolveHandler<Codable>) -> Void] = [:]
    private let encoder = JSONEncoder()

    func register<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap[T.commandType] = type
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (T, @escaping ResolveHandler<Codable>) -> Void) {
        typeMap[T.commandType] = type
        actionWithDataMap[T.commandType] = { data, result in
            event(data as! T, result)
        }
    }

    func register<T: CommandDataProtocol>(_ type: T.Type, _ event: @escaping (@escaping ResolveHandler<Codable>) -> Void) {
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

    func handlerMessage(_ message: String, _ replyHandler: ((String?, String?) -> Void)? = nil) {
        do {
            let jsbInfo = message.components(separatedBy: "::")
            let actionKey = jsbInfo[0]
            let hasData = jsbInfo.count == 2 && jsbInfo[1] != ""

            if hasData {
                let data = try deserialize(cmdType: actionKey, cmdContent: jsbInfo[1])
                if let action = actionWithDataMap[actionKey] {
                    handleAction(action: { callback in
                        action(data!, callback)
                    }, replyHandler: replyHandler)
                }
            } else {
                if let action = actionWithoutDataMap[actionKey] {
                    handleAction(action: action, replyHandler: replyHandler)
                }
            }
        } catch {}
    }

    private func handleAction(action: @escaping (@escaping ResolveHandler<Codable>) -> Void,
                              replyHandler: ((String?, String?) -> Void)?)
    {
        Task { @MainActor in
            action { result in
                switch result {
                case let .success(data):
                    let resultData = data == nil ? "" : self.parseData(data!)
                    let resultString = self.parseData(JsbReplyData(
                        success: true,
                        data: ""
                    ))?.replacingOccurrences(of: "\"\"", with: resultData!)
                    replyHandler?(resultString, nil)
                case let .failure(error):
                    let resultString = self.parseData(JsbReplyData(
                        success: false,
                        code: error.code,
                        message: error.message
                    ))
                    replyHandler?(nil, resultString)
                }
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
        let concreteData = try decoder.decode(type.self, from: cmdContent!.data(using: .utf8)!)
        return concreteData
    }

    private func typeof(for key: String) -> CommandDataProtocol.Type? {
        return typeMap[key]
    }

    private func parseData(_ data: Codable) -> String? {
        if let jsonData = try? encoder.encode(data) {
            let jsonString = String(data: jsonData, encoding: .utf8)
            return jsonString!
        }
        return nil
    }
}
