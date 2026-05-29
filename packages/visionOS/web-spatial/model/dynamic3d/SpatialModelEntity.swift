import RealityKit
import SwiftUI

@Observable
class SpatialModelEntity: SpatialEntity {
    private var modelEntity: Entity?
    /// Retained so `UpdateUnlitMaterialProperties` can re-apply current `SpatialMaterial.resource` after native material updates.
    private(set) var overrideSpatialMaterials: [SpatialMaterial] = []

    required init(_ modelResource: SpatialModelResource, _ _name: String = "") {
        super.init(_name)
        modelEntity = modelResource.resource
        addChild(modelEntity!)
        generateCollisionShapes(recursive: true)
    }

    required init() {
        super.init()
    }

    func setMaterials(_ materials: [SpatialMaterial]) {
        overrideSpatialMaterials = materials
        applyOverrideMaterials()
    }

    /// Re-apply stored override materials using each `SpatialMaterial`'s current `resource` (e.g. after unlit property updates).
    func refreshMaterials() {
        applyOverrideMaterials()
    }

    func usesMaterial(_ materialId: String) -> Bool {
        overrideSpatialMaterials.contains { $0.id == materialId }
    }

    private func applyOverrideMaterials() {
        guard let modelEntity = modelEntity else { return }
        // TODO(P1): Clearing overrides (`setMaterials([])`) assigns an empty material list here; there is
        // no baseline of the model asset’s authored materials to restore. Persist per-component defaults
        // at load (or skip writing when overrides are empty) so clears return to the authored look.
        func applyMaterials(to entity: Entity) {
            if var modelComp = entity.components[ModelComponent.self] {
                modelComp.materials = overrideSpatialMaterials.compactMap { $0.resource }
                entity.components.set(modelComp)
            }
            for child in entity.children {
                applyMaterials(to: child)
            }
        }
        applyMaterials(to: modelEntity)
    }

    override func onDestroy() {
        super.onDestroy()
        if let modelEntity = modelEntity {
            removeChild(modelEntity)
        }
        modelEntity = nil
        overrideSpatialMaterials = []
    }

    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed, children, components, model
    }

    override func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
        try container.encode(spatialChildren, forKey: .children)
        try container.encode(spatialComponents, forKey: .components)
        try container.encode(modelEntity?.id, forKey: .model)
    }
}
