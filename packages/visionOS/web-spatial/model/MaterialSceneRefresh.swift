import Foundation

/// Scene-level helpers for keeping RealityKit model components in sync after material / texture changes.
/// Per-material mutation lives on `SpatialUnlitMaterial` in `dynamic3d/SpatialMaterial.swift`; this type only
/// orchestrates lookups across `spatialObjects`.
enum MaterialSceneRefresh {
    /// After `SpatialUnlitMaterial.updateProperties`, `ModelComponent` may still hold a stale material copy —
    /// refresh every component and entity that references `materialId`.
    static func refreshComponentsUsingMaterial(
        _ materialId: String,
        spatialObjects: [String: any SpatialObjectProtocol]
    ) {
        for (_, obj) in spatialObjects {
            if let comp = obj as? SpatialModelComponent, comp.usesMaterial(materialId) {
                comp.refreshMaterials()
            }
        }
        for (_, obj) in spatialObjects {
            if let entity = obj as? SpatialModelEntity, entity.usesMaterial(materialId) {
                entity.refreshMaterials()
            }
        }
    }

    /// After `SpatialTextureResource` reloads from a new URL, push `texture.resource` into every bound unlit material and return their ids for `refreshComponentsUsingMaterial`.
    static func pushReloadedTextureToBoundUnlitMaterials(
        texture: SpatialTextureResource,
        textureSpatialId: String,
        spatialObjects: [String: any SpatialObjectProtocol]
    ) -> Set<String> {
        var refreshedMaterialIds = Set<String>()
        for (_, obj) in spatialObjects {
            guard let material = obj as? SpatialUnlitMaterial,
                  material.textureSpatialId == textureSpatialId
            else { continue }
            material.updateProperties(color: nil, texture: .some(texture.resource), transparent: nil, opacity: nil)
            refreshedMaterialIds.insert(material.spatialId)
        }
        return refreshedMaterialIds
    }
}
