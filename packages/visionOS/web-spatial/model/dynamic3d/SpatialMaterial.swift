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
    private(set) var currentColor: UIColor
    private(set) var currentTexture: TextureResource?
    private(set) var currentTransparent: Bool
    private(set) var currentOpacity: Float

    init(_ color: String, _ texture: TextureResource? = nil, _ transparent: Bool = true, _ opacity: Float = 1) {
        currentColor = UIColor(Color(hex: color))
        currentTexture = texture
        currentTransparent = transparent
        currentOpacity = opacity
        super.init(.UnlitMaterial)
        var mat = UnlitMaterial()
        mat.color = .init(tint: currentColor, texture: texture != nil ? .init(texture!) : nil)
        mat.blending = transparent ? .transparent(opacity: .init(scale: opacity)) : .opaque
        _resource = mat
    }

    func updateProperties(color: String?, transparent: Bool?, opacity: Float?) {
        if let color = color {
            currentColor = UIColor(Color(hex: color))
        }
        if let transparent = transparent {
            currentTransparent = transparent
        }
        if let opacity = opacity {
            currentOpacity = opacity
        }
        var mat = UnlitMaterial()
        mat.color = .init(tint: currentColor, texture: currentTexture != nil ? .init(currentTexture!) : nil)
        mat.blending = currentTransparent ? .transparent(opacity: .init(scale: currentOpacity)) : .opaque
        _resource = mat
    }
}

enum SpatialMaterialType: String {
    case UnlitMaterial
}
