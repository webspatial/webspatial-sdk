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
    var depth: Double = 0.0
    var backOffset: Double = 0.0
    var transform: Transform = .init()
    var rotationAnchor: UnitPoint3D = .center
    var opacity: Double = 1.0
    var visible = true
    var scrollWithParent = true
    var zIndex: Double = 0
    
    // whether require clip action
    var clip = true
    
    var enableGesture: Bool = false

    enum CodingKeys: String, CodingKey {
        case width, height, depth, backOffset, transform, rotationAnchor, opacity, visible, scrollWithParent, zIndex, parent, enableGesture
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(width, forKey: .width)
        try container.encode(height, forKey: .height)
        try container.encode(depth, forKey: .depth)
        try container.encode(backOffset, forKey: .backOffset)
        try container.encode(transform, forKey: .transform)
        try container.encode(rotationAnchor, forKey: .rotationAnchor)
        try container.encode(opacity, forKey: .opacity)
        try container.encode(visible, forKey: .visible)
        try container.encode(scrollWithParent, forKey: .scrollWithParent)
        try container.encode(zIndex, forKey: .zIndex)
        try container.encode(parent?.id, forKey: .parent)
        try container.encode(enableGesture, forKey: .enableGesture)
    }

    private(set) var parent: ScrollAbleSpatialElementContainer?

    func setParent(_ parent: ScrollAbleSpatialElementContainer?) {
        if self.parent?.id == parent?.id {
            return
        }

        if let prevParent = self.parent {
            prevParent.removeChild(self)
        }

        parent?.addChild(self)
        self.parent = parent
    }

    func getParent() -> ScrollAbleSpatialElementContainer? {
        return parent
    }

    override func onDestroy() {
        setParent(nil)
    }
}
