import RealityKit
import SwiftUI

@Observable
class SpatialMaterial: SpatialObject {
    let type: SpatialMaterialType

    var _resource: RealityKit.Material?
    var resource: RealityKit.Material? {
        _resource
    }

    init(_ _type: SpatialMaterialType) {
        type = _type
        super.init()
    }

    override func onDestroy() {
        _resource = nil
    }
}

@Observable
class SpatialUnlitMaterial: SpatialMaterial {
    let color: UIColor

    init(_ color: String, _ texture: TextureResource? = nil, _ transparent: Bool = true, _ opacity: Float = 1) {
        self.color = UIColor(Color(hex: color))
        super.init(.UnlitMaterial)
        var mat = UnlitMaterial()
        mat.color = .init(tint: UIColor(Color(hex: color)), texture: texture != nil ? .init(texture!) : nil)
        mat.blending = transparent ? .transparent(opacity: .init(scale: opacity)) : .opaque
        _resource = mat
    }
}

enum SpatialMaterialType: String {
    case UnlitMaterial
}
