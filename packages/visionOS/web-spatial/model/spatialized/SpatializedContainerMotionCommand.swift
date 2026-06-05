import Foundation

/// Shared JSB payload for spatialized element motion (2D / Static3D / Dynamic3D).
protocol SpatializedContainerMotionCommand {
    var animationId: String { get }
    var type: String { get }
    var elementId: String? { get }
    var timeline: SpatialDivMotionTimelinePayload? { get }
}

/// Unified element motion command (`targetKind` selects native manager + transform sink).
struct AnimateSpatializedElementMotionCommand: CommandDataProtocol, SpatializedContainerMotionCommand {
    static let commandType: String = "AnimateSpatializedElementMotion"

    let animationId: String
    let type: String
    /// `spatialized2d` | `static3d` | `dynamic3d`
    let targetKind: String

    let elementId: String?
    let timeline: SpatialDivMotionTimelinePayload?

    var transformSink: SpatializedMotionTransformSink {
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
