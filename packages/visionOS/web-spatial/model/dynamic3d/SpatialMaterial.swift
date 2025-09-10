import SwiftUI
import RealityKit

@Observable
class SpatialMaterial: SpatialObject {
    let type: SpatialMaterialType
    
    internal var _resource:RealityKit.Material? = nil
    var resource:RealityKit.Material? {
        _resource
    }
    
    init(_ _type:SpatialMaterialType){
        type = _type
        super.init()
    }
}

@Observable
class SpatialUnlitMaterial: SpatialMaterial{
    let color:UIColor
    
    init(_ color:String, _ texture:TextureResource? = nil, _ transparent:Bool = true, _ opacity:Float = 1){
        self.color = UIColor.init(Color(hex: color))
        super.init(.UnlitMaterial)
        var mat = UnlitMaterial()
        mat.color = .init(tint:UIColor(Color.init(hex: color)), texture: texture != nil ? .init(texture!) : nil)
        mat.blending = transparent ? .transparent(opacity: .init(scale: opacity)) : .opaque
        _resource = mat
    }
}

enum SpatialMaterialType: String{
    case UnlitMaterial = "UnlitMaterial"
}
