import Foundation
import RealityKit
import SwiftUI

/// zIndex() have some bug, so use zOrderBias to simulate zIndex effect
let zOrderBias = 0.001

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

    /// When non-nil and non-zero length, rotate gesture is constrained to this axis (world space).
    var rotateConstrainedToAxis: Vec3?

    var defaultAlignment: DepthAlignment = .back

    /// Raw layout→scene transform from onGeometryChange3D proxy.
    /// Does NOT include backOffset or zIndex offset.
    /// Updated by SpatializedElementView whenever layout changes.
    var proxySceneTransform: AffineTransform3D = .identity

    /// Full local→scene transform accounting for --xr-back and zIndex.
    /// Computed on-the-fly so backOffset/zIndex changes are always reflected.
    var sceneTransform: AffineTransform3D {
        let frameZ = (zIndex * zOrderBias) + backOffset
        let localZ = AffineTransform3D(translation: Vector3D(x: 0, y: 0, z: frameZ))
        return proxySceneTransform.concatenating(localZ)
    }

    /// Converts a point from this element's local coordinate system to scene space.
    func convertToScene(_ localPoint: SIMD3<Double>) -> SIMD3<Double> {
        let p = SIMD4<Double>(localPoint.x, localPoint.y, localPoint.z, 1.0)
        let scene = sceneTransform.matrix * p
        return SIMD3<Double>(scene.x, scene.y, scene.z)
    }

    /// Converts a point from scene space to this element's local coordinate system.
    func convertFromScene(_ scenePoint: SIMD3<Double>) -> SIMD3<Double> {
        let inv = sceneTransform.inverse!
        let p = SIMD4<Double>(scenePoint.x, scenePoint.y, scenePoint.z, 1.0)
        let local = inv.matrix * p
        return SIMD3<Double>(local.x, local.y, local.z)
    }

    /// Converts a point from this element's local space to another element's local space.
    func convert(_ localPoint: SIMD3<Double>, to target: SpatializedElement) -> SIMD3<Double> {
        let scenePoint = convertToScene(localPoint)
        return target.convertFromScene(scenePoint)
    }

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
