import Foundation
import Spatial

struct SpatializedElementAnimationWriteAdapter {
    func currentAffineTransform(for element: SpatializedElement) -> AffineTransform3D {
        element.transform
    }

    func applyAffine(_ affine: AffineTransform3D, to element: SpatializedElement) {
        element.transform = affine
    }

    func baselineOpacity(for element: SpatializedElement) -> Double {
        element.opacity
    }

    func applyOpacity(_ opacity: Double, to element: SpatializedElement) {
        element.opacity = opacity
    }

    func acquireMask(on element: SpatializedElement, animationId: String, animatesTransform: Bool, animatesOpacity: Bool) -> Bool {
        guard canAcquireMask(on: element, animationId: animationId, animatesTransform: animatesTransform, animatesOpacity: animatesOpacity) else {
            return false
        }

        if animatesTransform {
            element.animatingMask.acquire(transform: animationId)
        }
        if animatesOpacity {
            element.animatingMask.acquire(opacity: animationId)
        }
        return true
    }

    /// Checks whether all requested animated fields are free or already owned by this animation.
    private func canAcquireMask(on element: SpatializedElement, animationId: String, animatesTransform: Bool, animatesOpacity: Bool) -> Bool {
        if animatesTransform,
           let owner = element.animatingMask.transformAnimationId,
           owner != animationId
        {
            return false
        }

        if animatesOpacity,
           let owner = element.animatingMask.opacityAnimationId,
           owner != animationId
        {
            return false
        }

        return true
    }

    func releaseMaskAndApplyPending(on element: SpatializedElement, animationId: String) {
        element.animatingMask.release(animationId: animationId)
    }

    func shouldAllowTransformWrite(on element: SpatializedElement, animationId: String) -> Bool {
        element.animatingMask.transformAnimationId == nil || element.animatingMask.transformAnimationId == animationId
    }

    func shouldAllowOpacityWrite(on element: SpatializedElement, animationId: String) -> Bool {
        element.animatingMask.opacityAnimationId == nil || element.animatingMask.opacityAnimationId == animationId
    }
}
