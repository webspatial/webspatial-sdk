import Foundation
import SwiftUI

@Observable
class SpatialModel3DComponent: SpatialComponent {
    var resolutionX: Double = 0
    var resolutionY: Double = 0
    var modelURL: String = ""
    var opacity: Double = 1.0
    var rotationAnchor: UnitPoint3D = .center
    var scrollWithParent = true
    var contentMode: ContentMode = .fit

    public func setURL(_ url: String) {
        modelURL = url
    }

    override func inspect() -> [String: Any] {
        var inspectInfo: [String: Any] = [
            "scrollWithParent": scrollWithParent,
            "resolutionX": resolutionX,
            "resolutionY": resolutionY,
            "modelURL": modelURL,
            "opacity": opacity,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}
