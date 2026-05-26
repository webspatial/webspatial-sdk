import Foundation

/// JSB command for Dynamic3D container transform motion (timeline + segment).
struct AnimateSpatializedDynamic3DElementCommand: CommandDataProtocol {
    static let commandType: String = "AnimateSpatializedDynamic3DElement"

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
