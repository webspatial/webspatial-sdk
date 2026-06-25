import Foundation
import Spatial

enum SpatializedElementAnimationWriteAdapter {
    case elementTransform
    case modelTransform

    var targetKind: SpatializedElementAnimationTargetKind {
        switch self {
        case .elementTransform:
            return .spatialized2d
        case .modelTransform:
            return .static3d
        }
    }

    static func adapter(for targetKind: SpatializedElementAnimationTargetKind) -> SpatializedElementAnimationWriteAdapter {
        switch targetKind {
        case .spatialized2d, .dynamic3d:
            return .elementTransform
        case .static3d:
            return .modelTransform
        }
    }

    func currentAffineTransform(for element: SpatializedElement) -> AffineTransform3D {
        switch self {
        case .elementTransform:
            return element.transform
        case .modelTransform:
            guard let static3d = element as? SpatializedStatic3DElement else {
                return element.transform
            }
            return static3d.modelTransform
        }
    }

    func applyAffine(_ affine: AffineTransform3D, to element: SpatializedElement) {
        switch self {
        case .elementTransform:
            element.transform = affine
        case .modelTransform:
            if let static3d = element as? SpatializedStatic3DElement {
                static3d.modelTransform = affine
            } else {
                element.transform = affine
            }
        }
    }

    func baselineOpacity(for element: SpatializedElement) -> Double {
        switch self {
        case .elementTransform:
            return element.opacity
        case .modelTransform:
            return 1.0
        }
    }

    func applyOpacity(_ opacity: Double, to element: SpatializedElement) {
        switch self {
        case .elementTransform:
            element.opacity = opacity
        case .modelTransform:
            break
        }
    }

    func acquireMask(on element: SpatializedElement, animationId: String, animatesTransform: Bool, animatesOpacity: Bool) {
        switch self {
        case .elementTransform:
            if animatesTransform {
                element.animatingMask.acquire(transform: animationId)
            }
            if animatesOpacity {
                element.animatingMask.acquire(opacity: animationId)
            }
        case .modelTransform:
            if animatesTransform {
                element.animatingMask.acquire(transform: animationId)
            }
        }
    }

    func releaseMaskAndApplyPending(on element: SpatializedElement, animationId: String) {
        element.animatingMask.release(animationId: animationId)
    }

    func shouldAllowTransformWrite(on element: SpatializedElement, animationId: String) -> Bool {
        element.animatingMask.transformAnimationId == nil || element.animatingMask.transformAnimationId == animationId
    }

    func shouldAllowOpacityWrite(on element: SpatializedElement, animationId: String) -> Bool {
        switch self {
        case .elementTransform:
            return element.animatingMask.opacityAnimationId == nil || element.animatingMask.opacityAnimationId == animationId
        case .modelTransform:
            return false
        }
    }
}
