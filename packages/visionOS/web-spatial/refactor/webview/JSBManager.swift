import Foundation

protocol CommandDataProtocol: Codable {
    static var commandType: String { get }
}

class JSBManager {
    private var typeMap = [String: CommandDataProtocol.Type]()

    func register<T: CommandDataProtocol>(_ type: T.Type) {
        typeMap[T.commandType] = type
    }

    func typeof(for key: String) -> CommandDataProtocol.Type? {
        return typeMap[key]
    }

    func deserialize(cmdType: String, cmdContent: String) throws -> CommandDataProtocol {
        let decoder = JSONDecoder()

        guard let type = typeof(for: cmdType) else {
            print("unknownType")
            throw SerializationError.unknownType
        }
        let concreteData = try decoder.decode(type.self, from: cmdContent.data(using: .utf8)!)
        return concreteData
    }

    enum SerializationError: Error {
        case unknownType
        case invalidFormat
    }
}
