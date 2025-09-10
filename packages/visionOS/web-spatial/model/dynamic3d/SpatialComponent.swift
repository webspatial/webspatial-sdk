import SwiftUI
import RealityKit

@Observable
class SpatialComponent: SpatialObject {
    let type: SpatialComponentType
    
    internal var _resource:Component? = nil
    var resource:Component? {
        _resource
    }
    
    init(_ _type:SpatialComponentType){
        type = _type
        super.init()
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
}

enum SpatialComponentType:String {
    case ModelComponent = "ModelComponent"
}
