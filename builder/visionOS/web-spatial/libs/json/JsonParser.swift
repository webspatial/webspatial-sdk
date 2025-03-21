import Foundation

class JsonParser {
    var json: [String: AnyObject]?
    init(str: String?) {
        if let toParse = str {
            if let data = toParse.data(using: .utf8) {
                do {
                    json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: AnyObject]
                } catch {}
            }
        }
    }

    func getValue<T>(lookup: [String]) -> T? {
        if var anyObj = json as? AnyObject {
            for (index, str) in lookup.enumerated() {
                if index == lookup.count - 1 {
                    return anyObj[str] as? T
                }
                if let o = (anyObj as? [String: AnyObject]),
                   let x = o[str]
                {
                    anyObj = x
                } else {
                    return nil
                }
            }
        }
        return nil
    }

    // Convert the instance to a JSON string
    static func serialize<T: Encodable>(_ data: T) -> String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted // Makes the JSON output more readable
        do {
            let jsonData = try encoder.encode(data)
            return String(data: jsonData, encoding: .utf8) // Convert Data to String
        } catch {
            logger.error("Failed to encode WindowContainerOptions to JSON: \(error)")
            return nil
        }
    }
}
