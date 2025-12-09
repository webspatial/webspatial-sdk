import SwiftUI
import RealityKit

@Observable
class SpatialComponent: SpatialObject {
    let type: SpatialComponentType
    
    
    internal var _resource:Component? = nil
    var resource:Component? {
        _resource
    }
    
    internal var _entity:SpatialEntity? = nil
    var entity:SpatialEntity? {
        _entity
    }
    
    init(_ _type:SpatialComponentType){
        type = _type
        super.init()
    }
    
    func addToEntity(entity:SpatialEntity){
        if _entity != nil {
            print("This component has already been added to another entity")
            return
        }
        if let component = resource{
            _entity = entity
            entity.components.set(component)
        }
    }
    
    func removeFromEntity(entity:SpatialEntity){
        if let component = resource,
           self.entity == entity{
            entity.components.remove(Swift.type(of: component))
            _entity = nil
        }
    }
}

@Observable
class SpatialModelComponent: SpatialComponent {
    init(mesh:Geometry, mats:[SpatialMaterial]){
        super.init(.ModelComponent)
        var materials:[any RealityKit.Material] = []
        mats.forEach{ item in
            materials.append(item.resource!)
        }
        _resource = ModelComponent(mesh: mesh.resource!, materials: materials)
    }
    
    override func addToEntity(entity:SpatialEntity){
        super.addToEntity(entity: entity)
        entity.generateCollisionShapes(recursive: true)
    }
    
    override func removeFromEntity(entity:SpatialEntity){
        super.removeFromEntity(entity: entity)
        entity.generateCollisionShapes(recursive: true)
    }
    
    override internal func onDestroy() {
        _resource = nil
    }
}

enum SpatialComponentType:String {
    case ModelComponent = "ModelComponent"
}
