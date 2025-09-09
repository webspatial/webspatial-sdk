import SwiftUI
import RealityKit

@Observable
class Resource3D: SpatialObjectProtocol, EventEmitterProtocol {
    let spatialId: String
    var name:String = ""
    let id: String
    
    private var _isDestroyed: Bool = false
    var isDestroyed: Bool {
        return _isDestroyed
    }
    internal var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]
    
    init(){
        spatialId = UUID().uuidString
        id = spatialId
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }
    
    // Encodable
    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
    }
    
    // Equatable
    static func == (lhs: Resource3D, rhs: Resource3D) -> Bool {
        return lhs.spatialId == rhs.spatialId
    }
    
    // Destroy
    enum Events: String {
        case BeforeDestroyed = "SpatialMaterial::BeforeDestroyed"
        case Destroyed = "SpatialMaterial::Destroyed"
    }
    
    func destroy() {
        if _isDestroyed {
            print("SpatialMaterial already destroyed \(self)")
            return
        }
        emit(event: Events.BeforeDestroyed.rawValue, data: ["object": self])
        onDestroy()
        _isDestroyed = true

        emit(event: Events.Destroyed.rawValue, data: ["object": self])
        listeners = [:]
        
    }
    
    func onDestroy() {
        
    }
}
