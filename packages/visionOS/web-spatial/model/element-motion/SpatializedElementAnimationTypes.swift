import Foundation

enum SpatializedElementAnimationTargetKind: String, Codable {
    case spatialized2d
    case static3d
    case dynamic3d
}

enum SpatializedElementAnimationPlayState: String, Codable {
    case idle
    case running
    case paused
    case finished
}

struct SpatializedElementAnimationErrorPayload: Codable {
    let code: String
    let message: String
}

struct SpatialAnimationStateChanged: Encodable {
    let type: SpatialWebMsgType = .animationstatechange
    let animationId: String
    let action: String
    let playState: SpatializedElementAnimationPlayState
    let finished: Bool
    let values: SpatializedMotionValuesPayload?
    let error: SpatializedElementAnimationErrorPayload?

    init(
        animationId: String,
        action: String,
        playState: SpatializedElementAnimationPlayState,
        finished: Bool,
        values: SpatializedMotionValuesPayload? = nil,
        error: SpatializedElementAnimationErrorPayload? = nil
    ) {
        self.animationId = animationId
        self.action = action
        self.playState = playState
        self.finished = finished
        self.values = values
        self.error = error
    }
}
