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
    var clientX: Double = 0.0
    var clientY: Double = 0.0
    var width: Double = 0.0
    var height: Double = 0.0
    var depth: Double = 0.0
    var backOffset: Double = 0.0
    var transform: AffineTransform3D = .identity
    var rotationAnchor: UnitPoint3D = .center
    var opacity: Double = 1.0
    var visible = true
    var scrollWithParent = true
    var zIndex: Double = 0

    var enableDragStartGesture: Bool = false
    var enableDragGesture: Bool = false
    var enableDragEndGesture: Bool = false
    var enableRotateGesture: Bool = false
    var enableRotateEndGesture: Bool = false
    var enableMagnifyGesture: Bool = false
    var enableMagnifyEndGesture: Bool = false
    var enableTapGesture: Bool = false

    var defaultAlignment: DepthAlignment = .back

    var enableGesture: Bool {
        return enableDragStartGesture || enableDragGesture || enableDragEndGesture || enableRotateGesture || enableRotateEndGesture || enableMagnifyGesture || enableMagnifyEndGesture || enableTapGesture
    }

    enum CodingKeys: String, CodingKey {
        case clientX, clientY, width, height, depth, backOffset, transform, rotationAnchor, opacity, visible, scrollWithParent, zIndex, parent, enableGesture, enableTapGesture, enableDragStartGesture, enableDragGesture, enableDragEndGesture, enableRotateGesture, enableRotateEndGesture, enableMagnifyGesture, enableMagnifyEndGesture
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(clientX, forKey: .clientX)
        try container.encode(clientY, forKey: .clientY)
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
        try container.encode(enableTapGesture, forKey: .enableTapGesture)
        try container.encode(enableDragStartGesture, forKey: .enableDragStartGesture)
        try container.encode(enableDragGesture, forKey: .enableDragGesture)
        try container.encode(enableDragEndGesture, forKey: .enableDragEndGesture)
        try container.encode(enableRotateGesture, forKey: .enableRotateGesture)
        try container.encode(enableRotateEndGesture, forKey: .enableRotateEndGesture)
        try container.encode(enableMagnifyGesture, forKey: .enableMagnifyGesture)
        try container.encode(enableMagnifyEndGesture, forKey: .enableMagnifyEndGesture)
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
