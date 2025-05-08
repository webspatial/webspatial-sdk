import Foundation
import SwiftUI

@Observable
class SpatialModel3DComponent: SpatialComponent {
    var resolutionX: Double = 0
    var resolutionY: Double = 0
    var modelURL: String = ""
    var opacity: Double = 1.0
    var rotationAnchor: UnitPoint3D = .center
    var scrollWithParent = false
    var contentMode: ContentMode = .fit
    var resizable: Bool = true
    var aspectRatio: Double? = nil

    var enableTapEvent = false
    var enableDoubleTapEvent = false
    var enableLongPressEvent = false
    var enableDragEvent = false

    // SpatialModel3DView should not have dependency on SpatialWindowComponent.
    // It just need some JSB communication channel. This need to be refactor in future
    weak var wv: SpatialWindowComponent?

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
            "resizable": resizable,
            "aspectRatio": aspectRatio != nil ? String(describing: aspectRatio!) : "nil",
            "contentMode": contentMode == .fill ? "fill" : "fit",
            "enableTapEvent": enableTapEvent,
            "enableDoubleTapEvent": enableDoubleTapEvent,
            "enableLongPressEvent": enableLongPressEvent,
            "enableDragEvent": enableDragEvent,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}
