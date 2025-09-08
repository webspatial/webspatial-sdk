import Foundation

@Observable
class SpatializedDynamic3DElement: SpatializedElement {
    private var rootEntity = SpatialEntity()
    
    func addEntity(_ entity:SpatialEntity){
        rootEntity.addChild(entity)
    }
    
    func removeEntity(_ id:String){
        
    }
    
    enum CodingKeys: String, CodingKey {
        case type
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(SpatializedElementType.SpatializedDynamic3DElement, forKey: .type)
    }
}
