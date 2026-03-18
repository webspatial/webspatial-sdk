import RealityKit
import SwiftUI

@Observable
class SpatialModelEntity: SpatialEntity {
    private var modelEntity: Entity?
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
        func applyMaterials(to entity: Entity) {
            if var modelComp = entity.components[ModelComponent.self] {
                modelComp.materials = materials.compactMap { $0.resource }
                entity.components.set(modelComp)
            }
            for child in entity.children {
                applyMaterials(to: child)
            }
        }
        if let modelEntity = modelEntity {
            applyMaterials(to: modelEntity)
        }
    }

    override func onDestroy() {
        super.onDestroy()
        if let modelEntity = modelEntity {
            removeChild(modelEntity)
        }
        modelEntity = nil
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
