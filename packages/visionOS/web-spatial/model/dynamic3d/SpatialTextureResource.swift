import SwiftUI
import RealityKit

@Observable
class SpatialTextureResource:SpatialObject {
    internal var _resource:TextureResource? = nil
    var resource:TextureResource? {
        _resource
    }
    
    override init(_ url:String){
        super.init()
    }
    
    override internal func onDestroy() {
        _resource = nil
    }
}
