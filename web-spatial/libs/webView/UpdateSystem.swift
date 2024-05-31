//
//  UpdateSystem.swift
//  web-spatial
//
//  Created by ByteDance on 5/21/24.
//

import Foundation
import RealityKit

struct UpdateWebViewComponent: Component {
    var webView: SpatialWebView?
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
            // print("update x")
            // print("a")
            pos += context.deltaTime
//            entity.position.x = Float(sin(pos)) * 0.3
//            entity.position.z = 0.2

            // entity.setPosition([Float(sin(pos)) * 0.3, 0, 0.2], relativeTo: nil)

            var x = Transform()
            x.translation.x = Float(sin(pos)) * 0.3
            x.translation.z = 0.2
            entity.move(to: x, relativeTo: nil)
            // print(context.deltaTime)

//            entity.components[UpdateWebViewComponent]?.webView?.webView.webViewHolder.gWebView?.evaluateJavaScript("window._magicUpdate()") { result, error in
//                if error == nil {
//                    // print((result! as! NSNumber).floatValue)
//                    var x = result! as? NSNumber
//                    var f = x?.floatValue
//                    let g = f!
//                    // print(g)
//                    entity.position.x = g
//                    entity.position.z = 0.2
//                }
//            }
            // print("b")
        }
    }
}
