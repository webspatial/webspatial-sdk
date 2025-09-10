import SwiftUI
import RealityKit

@Observable
class SpatialModelResource:SpatialObject {
    internal var _resource:Entity? = nil
    var resource:Entity? {
        _resource
    }
    
    override init(_ url:String){
        super.init()
    }
}
