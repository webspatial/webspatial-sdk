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
    /// Spatial id of the bound `SpatialTextureResource`, when this material displays a texture. Used to push `TextureResource` updates after `UpdateTextureProperties`.
    var textureSpatialId: String?

    init(_ color: String, _ texture: TextureResource? = nil, _ transparent: Bool = true, _ opacity: Float = 1, textureSpatialId: String? = nil) {
        currentColor = UIColor(Color(hex: color))
        currentTexture = texture
        currentTransparent = transparent
        currentOpacity = opacity
        self.textureSpatialId = textureSpatialId
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

@Observable
class SpatialPBRMaterial: SpatialMaterial {
    /// Single RealityKit `PhysicallyBasedMaterial` mutated in place. RealityKit's
    /// blending mode is set at construction, so flipping `transparent` requires
    /// rebuilding `_mat`.
    private var _mat: PhysicallyBasedMaterial
    private(set) var currentColor: UIColor
    private(set) var currentTexture: TextureResource?
    private(set) var currentMetalness: Float
    private(set) var currentRoughness: Float
    private(set) var currentEmissiveColor: UIColor
    private(set) var currentEmissiveIntensity: Float
    private(set) var currentTransparent: Bool
    private(set) var currentOpacity: Float
    /// Spatial id of the bound `SpatialTextureResource`, when this material displays a base-color texture.
    var textureSpatialId: String?

    init(
        _ color: String,
        _ texture: TextureResource? = nil,
        _ metalness: Float = 0,
        _ roughness: Float = 0.5,
        _ emissiveColor: String = "#000000",
        _ emissiveIntensity: Float = 0,
        _ transparent: Bool = false,
        _ opacity: Float = 1,
        textureSpatialId: String? = nil
    ) {
        currentColor = UIColor(Color(hex: color))
        currentTexture = texture
        currentMetalness = metalness
        currentRoughness = roughness
        currentEmissiveColor = UIColor(Color(hex: emissiveColor))
        currentEmissiveIntensity = emissiveIntensity
        currentTransparent = transparent
        currentOpacity = opacity
        self.textureSpatialId = textureSpatialId
        _mat = PhysicallyBasedMaterial()
        super.init(.PBRMaterial)
        applyProperties()
    }

    /// Pushes the current property snapshot into `_mat` and exposes it as `resource`.
    /// ModelComponent still holds its own copy, so callers must `refreshMaterials()` on affected components after this.
    private func applyProperties() {
        _mat.baseColor = .init(
            tint: currentColor,
            texture: currentTexture.map { .init($0) }
        )
        _mat.metallic = .init(floatLiteral: currentMetalness)
        _mat.roughness = .init(floatLiteral: currentRoughness)
        _mat.emissiveColor = .init(color: currentEmissiveColor)
        _mat.emissiveIntensity = currentEmissiveIntensity
        _mat.blending = currentTransparent
            ? .transparent(opacity: .init(floatLiteral: currentOpacity))
            : .opaque
        _resource = _mat
    }

    func updateProperties(
        color: String?,
        texture: TextureResource?? = nil,
        metalness: Float?,
        roughness: Float?,
        emissiveColor: String?,
        emissiveIntensity: Float?,
        transparent: Bool?,
        opacity: Float?
    ) {
        if let color = color {
            currentColor = UIColor(Color(hex: color))
        }
        if let tex = texture {
            currentTexture = tex
        }
        if let metalness = metalness {
            currentMetalness = metalness
        }
        if let roughness = roughness {
            currentRoughness = roughness
        }
        if let emissiveColor = emissiveColor {
            currentEmissiveColor = UIColor(Color(hex: emissiveColor))
        }
        if let emissiveIntensity = emissiveIntensity {
            currentEmissiveIntensity = emissiveIntensity
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
    case PBRMaterial
}
