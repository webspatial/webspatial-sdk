import Foundation
import RealityKit
import SwiftUI

enum SpatializedElementType: String, Codable {
    case Spatialized2DElement
    case SpatializedStatic3DElement
    case SpatializedDynamic3DElement
}

@Observable
class SpatializedElement: SpatialObject {
    var width: Double = 0.0
    var height: Double = 0.0
    var backOffset: Double = 0.0
    var transform: Transform = .init()
    var rotationAnchor: UnitPoint3D = .center
    var opacity: Double = 1.0
    var visible = true
    var scrollWithParent = true
    var zIndex: Double = 0

    private(set) var parent: ScrollAbleSpatialElementContainer?

    func setParent(_ parent: ScrollAbleSpatialElementContainer?) {
        if let prevParent = self.parent {
            prevParent.removeChild(self)
        }
        self.parent = parent
    }

    func getParent() -> ScrollAbleSpatialElementContainer? {
        return parent
    }

    override func onDestroy() {
        if let prevParent = parent {
            prevParent.removeChild(self)
        }
    }

    override func inspect() -> [String: Any] {
        var inspectInfo: [String: Any] = [
            "width": width,
            "height": height,
            "backOffset": backOffset,
            "transform": transform,
            "rotationAnchor": rotationAnchor,
            "opacity": opacity,
            "visible": visible,
            "parent": parent?.id ?? "",
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}
