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
    /// Single RealityKit unlit instance we mutate in place; avoids allocating a new `UnlitMaterial()` on every property update.
    private var _mat: UnlitMaterial
    private(set) var currentColor: UIColor
    private(set) var currentTexture: TextureResource?
    private(set) var currentTransparent: Bool
    private(set) var currentOpacity: Float

    init(_ color: String, _ texture: TextureResource? = nil, _ transparent: Bool = true, _ opacity: Float = 1) {
        currentColor = UIColor(Color(hex: color))
        currentTexture = texture
        currentTransparent = transparent
        currentOpacity = opacity
        _mat = UnlitMaterial()
        super.init(.UnlitMaterial)
        applyProperties()
    }

    /// Pushes `currentColor` / `currentTexture` / blending into `_mat` and exposes it as `resource`.
    /// ModelComponent still holds its own copy, so callers must `refreshMaterials()` on affected components after this.
    private func applyProperties() {
        _mat.color = .init(
            tint: currentColor,
            texture: currentTexture.map { .init($0) }
        )
        _mat.blending = currentTransparent
            ? .transparent(opacity: .init(scale: currentOpacity))
            : .opaque
        _resource = _mat
    }

    func updateProperties(color: String?, texture: TextureResource?? = nil, transparent: Bool?, opacity: Float?) {
        if let color = color {
            currentColor = UIColor(Color(hex: color))
        }
        if let tex = texture {
            currentTexture = tex
        }
        if let transparent = transparent {
            currentTransparent = transparent
        }
        if let opacity = opacity {
            currentOpacity = opacity
        }
        applyProperties()
    }
}

enum SpatialMaterialType: String {
    case UnlitMaterial
}
