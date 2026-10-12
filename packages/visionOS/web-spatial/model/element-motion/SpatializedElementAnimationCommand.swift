import Foundation

struct CreateSpatializedElementAnimationCommand: CommandDataProtocol {
    static let commandType: String = "CreateSpatializedElementAnimation"

    let elementId: String
    let timeline: SpatializedMotionTimelinePayload
}

struct ControlSpatializedElementAnimationCommand: CommandDataProtocol {
    static let commandType: String = "ControlSpatializedElementAnimation"

    let animationId: String
    let type: String
}
