import Foundation

// MARK: - Transform Components

/// Fully resolved transform components used for interpolation and composition.
struct SpatializedMotionTransformComponents {
    var translateX: Double
    var translateY: Double
    var translateZ: Double
    var rotateX: Double // degrees
    var rotateY: Double // degrees
    var rotateZ: Double // degrees
    var scaleX: Double
    var scaleY: Double
    var scaleZ: Double

    static let identity = SpatializedMotionTransformComponents(
        translateX: 0, translateY: 0, translateZ: 0,
        rotateX: 0, rotateY: 0, rotateZ: 0,
        scaleX: 1, scaleY: 1, scaleZ: 1
    )
}
