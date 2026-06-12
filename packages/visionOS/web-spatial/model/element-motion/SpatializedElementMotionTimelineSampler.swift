import Foundation

// MARK: - Timeline sampler (parity with Web evaluateMotionTimeline)

/// Per-track timeline sampling for native spatialized element motion.
final class SpatializedElementMotionTimelineSampler {
    let duration: Double
    private let tracks: [SpatializedMotionTrackPayload]
    private let baselineTransform: SpatializedMotionTransformComponents
    private let baselineOpacity: Double

    private(set) var animatesTransform = false
    private(set) var animatesOpacity = false

    init(timeline: SpatializedMotionTimelinePayload, baselineTransform: SpatializedMotionTransformComponents, baselineOpacity: Double) {
        duration = timeline.duration
        tracks = timeline.tracks
        self.baselineTransform = baselineTransform
        self.baselineOpacity = baselineOpacity
        for track in tracks {
            if track.property == "opacity" {
                animatesOpacity = true
            }
            if track.property.hasPrefix("transform.") {
                animatesTransform = true
            }
        }
    }

    func sampleTransformAndOpacity(at timeSec: Double) -> (transform: SpatializedMotionTransformComponents, opacity: Double) {
        let t = min(max(timeSec, 0), duration)
        var transform = baselineTransform
        var opacity = baselineOpacity

        for track in tracks {
            let value = sampleTrack(track, at: t)
            applyScalar(property: track.property, value: value, transform: &transform, opacity: &opacity)
        }

        return (transform, opacity)
    }

    private func sampleTrack(_ track: SpatializedMotionTrackPayload, at timeSec: Double) -> Double {
        let frames = track.keyframes.sorted { $0.at < $1.at }
        guard let first = frames.first else { return 0 }
        guard let last = frames.last else { return 0 }

        if timeSec <= first.at { return first.value }
        if timeSec >= last.at { return last.value }

        for i in 0 ..< (frames.count - 1) {
            let a = frames[i]
            let b = frames[i + 1]
            if timeSec >= a.at, timeSec <= b.at {
                let span = b.at - a.at
                if span <= 0 { return b.value }
                let linear = (timeSec - a.at) / span
                let eased = SpatializedMotionTimingFunction
                    .from(name: a.timingFunction ?? track.timingFunction ?? "linear")
                    .evaluate(linear)
                return a.value + (b.value - a.value) * eased
            }
        }

        return last.value
    }

    private func applyScalar(
        property: String,
        value: Double,
        transform: inout SpatializedMotionTransformComponents,
        opacity: inout Double
    ) {
        switch property {
        case "opacity":
            opacity = value
        case "transform.translate.x":
            transform.translateX = value
        case "transform.translate.y":
            transform.translateY = value
        case "transform.translate.z":
            transform.translateZ = value
        case "transform.rotate.x":
            transform.rotateX = value
        case "transform.rotate.y":
            transform.rotateY = value
        case "transform.rotate.z":
            transform.rotateZ = value
        case "transform.scale.x":
            transform.scaleX = value
        case "transform.scale.y":
            transform.scaleY = value
        case "transform.scale.z":
            transform.scaleZ = value
        default:
            break
        }
    }
}
