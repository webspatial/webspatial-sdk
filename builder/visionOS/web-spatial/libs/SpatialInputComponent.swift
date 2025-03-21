import Combine
import Foundation
import RealityKit

@Observable
class SpatialInputComponent: SpatialComponent {
    // @todo: ref to wv is a bad desgin, should refactor later
    weak var wv: SpatialWindowComponent?
    var itc = InputTargetComponent()

    var isDragging = false
    var trackedPosition: SIMD3<Float> = .zero

    override func onAddToEntity() {
        let e = entity!
        e.modelEntity.generateCollisionShapes(recursive: false)
        e.modelEntity.components.set(itc)
    }
}
