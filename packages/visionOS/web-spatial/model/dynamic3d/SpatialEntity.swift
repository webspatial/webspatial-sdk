import SwiftUI
import RealityKit

@Observable
class SpatialEntity: Entity, SpatialObjectProtocol, EventEmitterProtocol {
    let spatialId: String
    
    private var _isDestroyed: Bool = false
    var isDestroyed: Bool {
        return _isDestroyed
    }
    internal var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]
    
    private var isEnableTap: Bool = false
    private var isEnableRotate: Bool = false
    private var isEnableDrag: Bool = false
    private var isEnableScale: Bool = false
    private var rotation: simd_quatd = simd_quatd()
    private var childList: [String:SpatialEntity] = [:]
    
    required init() {
        self.spatialId = UUID().uuidString
        super.init()
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }
    
    init(_ _name:String){
        self.spatialId = UUID().uuidString
        super.init()
        self.name = _name
        SpatialObject.objects[spatialId] = self
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
        
    }
    
    func addChild(entity:SpatialEntity){
        childList[entity.spatialId] = entity
        super.addChild(entity)
    }
    
    func removeChild(id:String){
        if let entity = childList[id]{
            super.removeChild(entity)
            childList.removeValue(forKey: id)
        }
        else {
            print("no child found")
        }
    }
    
    public func addComponent<T: Component>(_ comp: T) {
        if(self.components.has(T.self)){
            return
        }
        self.components.set(comp)
    }
    
    public func removeComponent<T: Component>(type: T.Type) {
        self.components.remove(type)
    }
    
    public func setRotation(_ rotation: simd_quatd) {
        self.rotation = rotation
        self.transform.rotation = simd_quatf(ix: Float(rotation.imag.x), iy: Float(rotation.imag.y), iz: Float(rotation.imag.z), r: Float(rotation.real))
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
    static func == (lhs: SpatialEntity, rhs: SpatialEntity) -> Bool {
        return lhs.spatialId == rhs.spatialId
    }
    
    // Destroy
    enum Events: String {
        case BeforeDestroyed = "SpatialEntity::BeforeDestroyed"
        case Destroyed = "SpatialEntity::Destroyed"
    }
    
    func destroy() {
        if _isDestroyed {
            print("SpatialEntity already destroyed \(self)")
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
