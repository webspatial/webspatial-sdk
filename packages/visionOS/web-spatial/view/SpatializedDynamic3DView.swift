import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    
    private func createCube() -> Entity {

        let entity = Entity()
        entity.components.set([
            ModelComponent(
                mesh: .generateBox(size: 0.1, cornerRadius: 0.01),
                materials: [SimpleMaterial()]),
            InputTargetComponent(allowedInputTypes: .indirect),
            CollisionComponent(shapes: [
                ShapeResource.generateBox(size: [0.1, 0.1, 0.1])
            ])
        ])
        
        return entity
    }
    
    var body: some View {
        RealityView { content in
            let cube = createCube()
            cube.position.x = 0
            cube.position.y = 0
            cube.position.z = 0
            content.add(cube)
        }
    }
}
