import Foundation
import Spatial

/// Adapts where spatialized element motion samples are read/written.
enum SpatializedElementMotionTransformAdapter {
    /// `Spatialized2DElement` / `SpatializedDynamic3DElement` root — `element.transform` + opacity.
    case elementTransform
    /// `SpatializedStatic3DElement` — `modelTransform` (opacity not driven on Model root).
    case modelTransform

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
}
