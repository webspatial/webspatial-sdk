import Foundation

/// Unified element motion command (`targetKind` selects native manager + transform adapter).
struct AnimateSpatializedElementMotionCommand: CommandDataProtocol {
    static let commandType: String = "AnimateSpatializedElementMotion"

    let animationId: String
    let type: String
    /// `spatialized2d` | `static3d` | `dynamic3d`
    let targetKind: String

    let elementId: String?
    let timeline: SpatializedMotionTimelinePayload?

    var transformAdapter: SpatializedElementMotionTransformAdapter {
        switch targetKind {
        case "static3d":
            return .modelTransform
        case "spatialized2d", "dynamic3d":
            return .elementTransform
        default:
            return .elementTransform
        }
    }
}
