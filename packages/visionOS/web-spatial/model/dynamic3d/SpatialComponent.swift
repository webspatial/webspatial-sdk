import RealityKit
import SwiftUI

@Observable
class SpatialComponent: SpatialObject {
    let type: SpatialComponentType

    var _resource: Component?
    var resource: Component? {
        _resource
    }

    var _entity: SpatialEntity?
    var entity: SpatialEntity? {
        _entity
    }

    init(_ _type: SpatialComponentType) {
        type = _type
        super.init()
    }

    func addToEntity(entity: SpatialEntity) {
        if _entity != nil {
            print("This component has already been added to another entity")
            return
        }
        if let component = resource {
            _entity = entity
            entity.components.set(component)
        }
    }

    func removeFromEntity(entity: SpatialEntity) {
        if let component = resource,
           self.entity == entity
        {
            entity.components.remove(Swift.type(of: component))
            _entity = nil
        }
    }
}

@Observable
class SpatialModelComponent: SpatialComponent {
    private(set) var spatialMaterials: [SpatialMaterial] = []
    private(set) var mesh: Geometry?

    init(mesh: Geometry, mats: [SpatialMaterial]) {
        spatialMaterials = mats
        self.mesh = mesh
        super.init(.ModelComponent)
        var materials: [any RealityKit.Material] = []
        for item in mats {
            materials.append(item.resource!)
        }
        _resource = ModelComponent(mesh: mesh.resource!, materials: materials)
    }

    /// Rebuild the ModelComponent with current material resources (called after material properties change)
    func refreshMaterials() {
        guard let mesh = mesh else { return }
        var materials: [any RealityKit.Material] = []
        for item in spatialMaterials {
            if let res = item.resource {
                materials.append(res)
            }
        }
        _resource = ModelComponent(mesh: mesh.resource!, materials: materials)
        if let entity = _entity {
            entity.components.set(_resource!)
            entity.generateCollisionShapes(recursive: true)
        }
    }

    /// Check if this component uses the given material
    func usesMaterial(_ materialId: String) -> Bool {
        return spatialMaterials.contains { $0.id == materialId }
    }

    override func addToEntity(entity: SpatialEntity) {
        super.addToEntity(entity: entity)
        entity.generateCollisionShapes(recursive: true)
    }

    override func removeFromEntity(entity: SpatialEntity) {
        super.removeFromEntity(entity: entity)
        entity.generateCollisionShapes(recursive: true)
    }

    override func onDestroy() {
        // TODO(P2): `mesh` is a registered `Geometry` spatial object; clearing the reference does not
        // run `Geometry.destroy()`, so dynamic mesh rebuilds can leak mesh/registry entries until the
        // scene ends. Call `mesh?.destroy()` (or equivalent) before nil-ing when ownership is exclusive.
        _resource = nil
        spatialMaterials = []
        mesh = nil
    }
}

enum SpatialComponentType: String {
    case ModelComponent
}
