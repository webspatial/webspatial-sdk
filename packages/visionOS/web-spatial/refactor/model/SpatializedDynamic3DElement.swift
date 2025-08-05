import Foundation

@Observable
class SpatializedDynamic3DElement: SpatializedElement {
    enum CodingKeys: String, CodingKey {
        case type
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(SpatializedElementType.SpatializedDynamic3DElement, forKey: .type)
    }
}
