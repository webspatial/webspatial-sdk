
import Foundation

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String = ""

    enum CodingKeys: String, CodingKey {
        case modelURL, type
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(modelURL, forKey: .modelURL)
        try container.encode(SpatializedElementType.SpatializedStatic3DElement, forKey: .type)
    }
}
