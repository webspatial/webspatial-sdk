import Combine
import Foundation
import RealityKit

@Observable
class SpatialModelComponent: SpatialComponent {
    var modelComponent: ModelComponent

    init(_ modelComponent: ModelComponent) {
        self.modelComponent = modelComponent

        super.init()
    }

    override func onAddToEntity() {
        entity?.modelEntity.model = modelComponent
    }

    // Since modelComponent is a struct instead of a class, we must sync it to the entity its attached to
    func onUpdate() {
        if entity != nil {
            entity?.modelEntity.model = modelComponent
        }
    }
}
