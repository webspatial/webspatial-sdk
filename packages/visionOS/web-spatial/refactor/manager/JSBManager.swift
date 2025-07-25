import Foundation

protocol CommandDataProtocol: Codable {
    static var commandType: String { get }
}

class JSBManager {
    private var typeMap = [String: CommandDataProtocol.Type]()

    func register<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap[T.commandType] = type
    }

    func remove<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap.removeValue(forKey: T.commandType)
    }

    func clear() {
        typeMap = [String: CommandDataProtocol.Type]()
    }

    func typeof(for key: String) -> CommandDataProtocol.Type? {
        return typeMap[key]
    }

    func deserialize(cmdType: String, cmdContent: String?) throws -> CommandDataProtocol? {
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

    enum SerializationError: Error {
        case unknownType
        case invalidFormat
    }

    class Promise {
        var replyHandler: ((Any?, String?) -> Void)?
        let encode = JSONEncoder()

        init(_ callback: @escaping (Any?, String?) -> Void) {
            replyHandler = callback
            encode.outputFormatting = .prettyPrinted
        }

        func resolve(_ data: ReplyData? = nil) {
            Task { @MainActor in
                if data == nil {
                    replyHandler?("", nil)
                    return
                }
                if let res = parseResult(data!) {
                    replyHandler?(res, nil)
                    return
                }
                replyHandler?(nil, "error")
            }
        }

        func reject(_ data: ReplyData? = nil) {
            Task { @MainActor in
                if data == nil {
                    replyHandler?(nil, "error")
                    return
                }
                if let res = parseResult(data!) {
                    replyHandler?(nil, res)
                }
                replyHandler?(nil, "error")
            }
        }

        func parseResult(_ data: ReplyData) -> String? {
            if let jsonData = try? encode.encode(data) {
                let jsonString = String(data: jsonData, encoding: .utf8)
                return jsonString!
            }
            return nil
        }
    }
}

struct ReplyData: Codable {
    var success: Bool
    var message: String
}
