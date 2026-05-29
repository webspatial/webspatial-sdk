import Foundation

// MARK: - Timeline wire types (matches JS SpatialDivMotionTimeline)

struct SpatialDivMotionKeyframePayload: Decodable {
    let at: Double
    let value: Double
    let timingFunction: String?
}

struct SpatialDivMotionTrackPayload: Decodable {
    let property: String
    let keyframes: [SpatialDivMotionKeyframePayload]
    let timingFunction: String?
}

struct SpatialDivMotionTimelinePayload: Decodable {
    let duration: Double
    let delay: Double?
    let playbackRate: Double?
    let loop: SpatialDivLoopConfig?
    let tracks: [SpatialDivMotionTrackPayload]
}

// MARK: - Timeline evaluator (parity with Web evaluateMotionTimeline)

/// Per-track timeline sampling for native SpatialDiv motion (Phase 2b).
final class SpatialDivTimelineEvaluator {
    let duration: Double
    private let tracks: [SpatialDivMotionTrackPayload]
    private let baselineSRT: ResolvedSRT
    private let baselineOpacity: Double

    private(set) var animatesTransform = false
    private(set) var animatesOpacity = false

    init(timeline: SpatialDivMotionTimelinePayload, baselineSRT: ResolvedSRT, baselineOpacity: Double) {
        duration = timeline.duration
        tracks = timeline.tracks
        self.baselineSRT = baselineSRT
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

    func sampleSRTAndOpacity(at timeSec: Double) -> (srt: ResolvedSRT, opacity: Double) {
        let t = min(max(timeSec, 0), duration)
        var srt = baselineSRT
        var opacity = baselineOpacity

        for track in tracks {
            let value = sampleTrack(track, at: t)
            applyScalar(property: track.property, value: value, srt: &srt, opacity: &opacity)
        }

        return (srt, opacity)
    }

    private func sampleTrack(_ track: SpatialDivMotionTrackPayload, at timeSec: Double) -> Double {
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
                let eased = SpatialDivTimingFunction
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
        srt: inout ResolvedSRT,
        opacity: inout Double
    ) {
        switch property {
        case "opacity":
            opacity = value
        case "transform.translate.x":
            srt.translateX = value
        case "transform.translate.y":
            srt.translateY = value
        case "transform.translate.z":
            srt.translateZ = value
        case "transform.rotate.x":
            srt.rotateX = value
        case "transform.rotate.y":
            srt.rotateY = value
        case "transform.rotate.z":
            srt.rotateZ = value
        case "transform.scale.x":
            srt.scaleX = value
        case "transform.scale.y":
            srt.scaleY = value
        case "transform.scale.z":
            srt.scaleZ = value
        default:
            break
        }
    }
}
