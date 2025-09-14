import SwiftUI
import RealityKit

@Observable
class SpatialEntity: Entity, SpatialObjectProtocol {
    
    let spatialId: String
    
    private var _isDestroyed: Bool = false
    var isDestroyed: Bool {
        return _isDestroyed
    }
    internal var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]
    
    var enableTap: Bool {
        return _enableTap
    }
    var enableRotate: Bool {
        return _enableRotate
    }
    var enableDrag: Bool {
        return _enableDrag
    }
    var enableScale: Bool {
        return _enableScale
    }
    
    
    private var _enableTap: Bool = false
    private var _enableRotate: Bool = false
    private var _enableDrag: Bool = false
    private var _enableScale: Bool = false
    private var rotation: simd_quatd = simd_quatd()
    private var spatialChildren: [String:SpatialEntity] = [:]
    private var spatialComponents: [SpatialComponentType: SpatialComponent] = [:]
    
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
        spatialChildren[entity.spatialId] = entity
        super.addChild(entity)
    }
    
    func removeChild(id:String){
        if let entity = spatialChildren[id]{
            super.removeChild(entity)
            spatialChildren.removeValue(forKey: id)
        }
        else {
            print("no child found")
        }
    }
    
    public func addComponent(_ comp: SpatialComponent) {
        spatialComponents[comp.type] = comp
        components.set(comp.resource!)
    }
    
    public func removeComponent(_ comp: SpatialComponent) {
        if spatialComponents[comp.type] != nil {
            spatialComponents.removeValue(forKey: comp.type)
            components.remove(type(of: comp.resource!))
        }
    }
    
    public func updateTransform(_ matrix:[String:Float]){
        transform.matrix = float4x4([matrix["0"]!, matrix["1"]!, matrix["2"]!, matrix["3"]!], [matrix["4"]!, matrix["5"]!, matrix["6"]!, matrix["7"]!], [matrix["8"]!, matrix["9"]!, matrix["10"]!, matrix["11"]!], [matrix["12"]!, matrix["13"]!, matrix["14"]!, matrix["15"]!])
    }
    
    public func updateGesture(_ type:String, _ isEable:Bool){
        switch SpatialEntityGestureType(rawValue: type){
        case .Tap:
            _enableTap = isEable
        case .Rotate:
            _enableRotate = isEable
        case .Drag:
            _enableDrag = isEable
        case .Scale:
            _enableScale = isEable
        default:
            return
        }
        
        if !(_enableTap || _enableRotate || _enableDrag || _enableScale){
            components.remove(CollisionComponent.self)
        }
        else if !components.has(CollisionComponent.self){
            generateCollisionShapes(recursive: true)
        }
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
        SpatialObject.objects.removeValue(forKey: spatialId)
    }
    
    func onDestroy() {
        if(parent != nil){
            removeFromParent()
        }
        components.removeAll()
        spatialChildren.forEach { id, child in
            child.destroy()
        }
        spatialChildren = [:]
        spatialComponents.forEach { id, components in
            components.destroy()
        }
        spatialChildren = [:]
    }
}

enum SpatialEntityGestureType: String{
    case Tap = "tap"
    case Rotate = "rotate"
    case Drag = "drag"
    case Scale = "scale"
}
