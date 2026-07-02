import Foundation

// MARK: - Timeline wire types (matches JS SpatializedMotionTimeline)

struct SpatializedMotionKeyframePayload: Decodable {
    let at: Double
    let value: Double
    let timingFunction: String?
}

struct SpatializedMotionTrackPayload: Decodable {
    let property: String
    let keyframes: [SpatializedMotionKeyframePayload]
    let timingFunction: String?
}

struct SpatializedMotionTimelinePayload: Decodable {
    let duration: Double
    let delay: Double?
    let playbackRate: Double?
    let loop: SpatializedMotionLoopConfig?
    let tracks: [SpatializedMotionTrackPayload]
}

// MARK: - Event Payloads

/// Payload structure matching the JS-side spatialized motion values.
struct SpatializedMotionValuesPayload: Encodable {
    let transform: SpatializedMotionTransformPayload?
    let opacity: Double?
}

struct SpatializedMotionTransformPayload: Encodable {
    let translate: Vec3Payload?
    let rotate: Vec3Payload?
    let scale: Vec3Payload?
}

struct Vec3Payload: Encodable {
    let x: Double?
    let y: Double?
    let z: Double?
}
