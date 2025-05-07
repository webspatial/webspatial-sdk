import Foundation
import RealityKit

struct UpdateWebViewComponent: Component {
    var webView: SpatialWindowComponent?
    init() {}
}

class UpdateWebViewSystem: System {
    static let query = EntityQuery(where: .has(UpdateWebViewComponent.self))
    required init(scene: RealityKit.Scene) {
        // Perform required initialization or setup.
    }

    var pos = 0.0
    func update(context: SceneUpdateContext) {
        for entity in context.entities(matching: Self.query, updatingSystemWhen: .rendering) {
            pos += context.deltaTime

            var x = Transform()
            x.translation.x = Float(sin(pos)) * 0.3
            x.translation.z = 0.2
            entity.move(to: x, relativeTo: nil)
        }
    }
}
