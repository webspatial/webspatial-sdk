import Foundation

/// JSB command for Static3D root transform motion (timeline + segment).
struct AnimateSpatializedStatic3DElementCommand: CommandDataProtocol {
    static let commandType: String = "AnimateSpatializedStatic3DElement"

    let animationId: String
    let type: String

    let elementId: String?
    let to: SpatialDivAnimationTarget?
    let from: SpatialDivAnimationTarget?
    let duration: Double?
    let timingFunction: String?
    let delay: Double?
    let playbackRate: Double?
    let loop: SpatialDivLoopConfig?
    let timeline: SpatialDivMotionTimelinePayload?
}
