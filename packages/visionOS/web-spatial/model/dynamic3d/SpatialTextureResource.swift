import RealityKit

class SpatialTextureResource:Resource3D {
    internal var _resource:TextureResource? = nil
    var resource:TextureResource? {
        _resource
    }
    
    init(_ url:String){
        super.init()
    }
}
