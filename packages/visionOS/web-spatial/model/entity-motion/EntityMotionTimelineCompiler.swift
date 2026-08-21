import Foundation
import simd

/// Closed scalar properties supported by native entity motion.
enum EntityMotionProperty: String, Codable, CaseIterable {
    /// Position X axis.
    case positionX = "position.x"
    /// Position Y axis.
    case positionY = "position.y"
    /// Position Z axis.
    case positionZ = "position.z"
    /// Euler rotation X axis.
    case rotationX = "rotation.x"
    /// Euler rotation Y axis.
    case rotationY = "rotation.y"
    /// Euler rotation Z axis.
    case rotationZ = "rotation.z"
    /// Scale X axis.
    case scaleX = "scale.x"
    /// Scale Y axis.
    case scaleY = "scale.y"
    /// Scale Z axis.
    case scaleZ = "scale.z"

    /// Indicates whether negative scalar values are invalid.
    var requiresNonnegativeValue: Bool {
        switch self {
        case .scaleX, .scaleY, .scaleZ:
            true
        default:
            false
        }
    }
}

/// Complete native pose used as the timeline baseline and sampled output.
struct EntityMotionPose: Equatable {
    /// Position in meters.
    let position: SIMD3<Double>
    /// Canonical Euler rotation in degrees.
    let rotation: SIMD3<Double>
    /// Per-axis scale.
    let scale: SIMD3<Double>

    /// Identity transform pose.
    static let identity = Self(position: .zero, rotation: .zero, scale: .one)

    /// Returns one scalar property value.
    func value(for property: EntityMotionProperty) -> Double {
        switch property {
        case .positionX: position.x
        case .positionY: position.y
        case .positionZ: position.z
        case .rotationX: rotation.x
        case .rotationY: rotation.y
        case .rotationZ: rotation.z
        case .scaleX: scale.x
        case .scaleY: scale.y
        case .scaleZ: scale.z
        }
    }

    /// Returns a copy with one scalar property replaced.
    func replacing(_ property: EntityMotionProperty, with value: Double) -> Self {
        var position = position
        var rotation = rotation
        var scale = scale
        switch property {
        case .positionX: position.x = value
        case .positionY: position.y = value
        case .positionZ: position.z = value
        case .rotationX: rotation.x = value
        case .rotationY: rotation.y = value
        case .rotationZ: rotation.z = value
        case .scaleX: scale.x = value
        case .scaleY: scale.y = value
        case .scaleZ: scale.z = value
        }
        return .init(position: position, rotation: rotation, scale: scale)
    }

    /// Complete transform payload suitable for JSB confirmation.
    var confirmedPayload: EntityMotionConfirmedTransformPayload {
        .init(
            position: .init(x: position.x, y: position.y, z: position.z),
            rotation: .init(x: rotation.x, y: rotation.y, z: rotation.z),
            scale: .init(x: scale.x, y: scale.y, z: scale.z)
        )
    }
}

/// One full-pose sample at a union timeline time.
struct EntityMotionCompiledSlice: Equatable {
    /// Timeline time in seconds.
    let at: Double
    /// Complete sampled pose.
    let pose: EntityMotionPose
}

/// One positive-duration segment with a single easing rule.
struct EntityMotionCompiledSegment: Equatable {
    /// Segment start time.
    let start: Double
    /// Segment end time.
    let end: Double
    /// Easing applied across the segment.
    let timing: EntityMotionTimingFunction
    /// Complete pose at the segment start.
    let from: EntityMotionPose
    /// Complete pose at the segment end.
    let to: EntityMotionPose
}

/// Validated pure timeline representation ready for later RealityKit compilation.
struct EntityMotionCompiledTimeline: Equatable {
    /// Full-pose union slices.
    let slices: [EntityMotionCompiledSlice]
    /// Positive-duration segments.
    let segments: [EntityMotionCompiledSegment]
}

/// Explicit validation and transform errors produced before RealityKit resource creation.
enum EntityMotionCompilationError: Error, Equatable {
    /// Timeline payload violates the canonical contract.
    case invalidTimeline(String)
    /// Sparse set payload contains invalid values.
    case invalidSetValues(String)
    /// Native transform cannot be represented as position, Euler rotation, and scale.
    case unrepresentableTransform(String)

    /// Human-readable diagnostic reason for bridge replies and tests.
    var reason: String {
        switch self {
        case let .invalidTimeline(reason),
             let .invalidSetValues(reason),
             let .unrepresentableTransform(reason):
            reason
        }
    }
}

/// Pure validator and full-pose timeline compiler.
enum EntityMotionTimelineCompiler {
    /// Validated timeline data reused by validation and compilation.
    private struct ParsedTimeline {
        let tracks: [EntityMotionProperty: EntityMotionTrackPayload]
        let times: [Double]
        let defaultTiming: EntityMotionTimingFunction
    }

    /// Fallback-validates a canonical payload without reading a run baseline.
    static func validate(_ timeline: EntityMotionTimelinePayload) throws {
        _ = try parse(timeline)
    }

    /// Validates timeline-only data and prepares values consumed by compilation.
    private static func parse(
        _ timeline: EntityMotionTimelinePayload
    ) throws -> ParsedTimeline {
        guard timeline.duration.isFinite, timeline.duration > 0,
              timeline.delay.isFinite, timeline.delay >= 0,
              timeline.playbackRate.isFinite, timeline.playbackRate > 0,
              !timeline.tracks.isEmpty
        else {
            throw EntityMotionCompilationError.invalidTimeline(
                "Timeline timing or tracks are invalid."
            )
        }

        var validatedTracks: [EntityMotionProperty: EntityMotionTrackPayload] = [:]
        var unionTimes = Set<Double>()
        var defaultTimings = Set<EntityMotionTimingFunction>()
        for track in timeline.tracks {
            guard let property = EntityMotionProperty(rawValue: track.property),
                  validatedTracks[property] == nil,
                  !track.keyframes.isEmpty
            else {
                throw EntityMotionCompilationError.invalidTimeline(
                    "Track property is unsupported, duplicated, or empty."
                )
            }
            defaultTimings.insert(track.timingFunction)
            var previousTime: Double?
            for keyframe in track.keyframes {
                guard keyframe.at.isFinite,
                      keyframe.value.isFinite,
                      (0 ... timeline.duration).contains(keyframe.at),
                      previousTime.map({ keyframe.at > $0 }) ?? true,
                      !property.requiresNonnegativeValue || keyframe.value >= 0
                else {
                    throw EntityMotionCompilationError.invalidTimeline(
                        "Keyframes must be finite, ordered, unique, and in range."
                    )
                }
                previousTime = keyframe.at
                unionTimes.insert(keyframe.at)
            }
            validatedTracks[property] = track
        }
        guard unionTimes.contains(0), unionTimes.contains(timeline.duration),
              defaultTimings.count == 1,
              let defaultTiming = defaultTimings.first
        else {
            throw EntityMotionCompilationError.invalidTimeline(
                "Timeline requires both boundaries and one global timing default."
            )
        }

        return ParsedTimeline(
            tracks: validatedTracks,
            times: unionTimes.sorted(),
            defaultTiming: defaultTiming
        )
    }

    /// Validates a canonical payload and builds full-pose union slices.
    static func compile(
        _ timeline: EntityMotionTimelinePayload,
        baseline: EntityMotionPose
    ) throws -> EntityMotionCompiledTimeline {
        let parsed = try parse(timeline)
        guard poseIsValid(baseline) else {
            throw EntityMotionCompilationError.invalidTimeline(
                "Timeline timing, tracks, or baseline is invalid."
            )
        }

        var slices = [EntityMotionCompiledSlice]()
        for time in parsed.times {
            var pose = baseline
            for (property, track) in parsed.tracks {
                pose = pose.replacing(
                    property,
                    with: sample(
                        track: track,
                        at: time,
                        baseline: baseline.value(for: property)
                    )
                )
            }
            guard poseIsValid(pose) else {
                throw EntityMotionCompilationError.invalidTimeline(
                    "Timeline sampling produced a non-finite pose."
                )
            }
            slices.append(.init(at: time, pose: pose))
        }

        var segments = [EntityMotionCompiledSegment]()
        for (from, to) in zip(slices, slices.dropFirst()) {
            let start = from.at
            let end = to.at
            guard end > start else {
                throw EntityMotionCompilationError.invalidTimeline(
                    "Compiled segments require positive duration."
                )
            }
            let overrides = Set(parsed.tracks.values.compactMap {
                timingOverride(for: $0, segmentStart: start)
            })
            guard overrides.count <= 1 else {
                throw EntityMotionCompilationError.invalidTimeline(
                    "All tracks must resolve to one easing per segment."
                )
            }
            segments.append(
                .init(
                    start: start,
                    end: end,
                    timing: overrides.first ?? parsed.defaultTiming,
                    from: from.pose,
                    to: to.pose
                )
            )
        }

        return .init(
            slices: slices,
            segments: segments
        )
    }

    /// Samples an ordered scalar track with linear baseline and keyframe interpolation.
    static func sample(
        track: EntityMotionTrackPayload,
        at time: Double,
        baseline: Double
    ) -> Double {
        guard let first = track.keyframes.first else {
            return baseline
        }
        if time < first.at {
            guard first.at > 0 else {
                return first.value
            }
            return interpolate(baseline, first.value, progress: time / first.at)
        }
        if time == first.at {
            return first.value
        }

        for (left, right) in zip(track.keyframes, track.keyframes.dropFirst()) {
            if time <= right.at {
                return interpolate(
                    left.value,
                    right.value,
                    progress: (time - left.at) / (right.at - left.at)
                )
            }
        }
        return track.keyframes.last?.value ?? baseline
    }

    /// Returns an explicit keyframe override at one union segment boundary.
    private static func timingOverride(
        for track: EntityMotionTrackPayload,
        segmentStart: Double
    ) -> EntityMotionTimingFunction? {
        track.keyframes.first(where: { $0.at == segmentStart })?.timingFunction
    }

    /// Performs scalar linear interpolation.
    private static func interpolate(
        _ start: Double,
        _ end: Double,
        progress: Double
    ) -> Double {
        start + (end - start) * progress
    }

    /// Checks that baseline pose components are finite and scale is nonnegative.
    private static func poseIsValid(_ pose: EntityMotionPose) -> Bool {
        pose.position.x.isFinite && pose.position.y.isFinite && pose.position.z.isFinite
            && pose.rotation.x.isFinite && pose.rotation.y.isFinite
            && pose.rotation.z.isFinite && pose.scale.x.isFinite
            && pose.scale.y.isFinite && pose.scale.z.isFinite
            && pose.scale.x >= 0 && pose.scale.y >= 0 && pose.scale.z >= 0
    }
}
