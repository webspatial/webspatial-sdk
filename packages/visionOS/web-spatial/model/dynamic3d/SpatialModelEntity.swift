import SwiftUI
import RealityKit

@Observable
class SpatialModelEntity: SpatialEntity{
    required init(_ modelResource:SpatialModelResource, _ _name:String = ""){
        super.init(_name)
        addChild(modelResource.resource!)
    }
    
    required init() {
        super.init()
    }
}
