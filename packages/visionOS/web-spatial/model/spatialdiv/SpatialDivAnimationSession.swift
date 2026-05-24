import Foundation
import QuartzCore

// MARK: - Partial Vec3 for transform sub-fields

/// Partial 3D vector for specifying individual axis values.
/// Used for translate (pixels), rotate (degrees), and scale (unitless multiplier).
struct Vec3Partial: Decodable {
    let x: Double?
    let y: Double?
    let z: Double?
}

// MARK: - Transform Target

/// Structured transform target for SpatialDiv animation.
/// Composed in fixed order: translate → rotate → scale.
struct SpatialDivTransformTarget: Decodable {
    /// Translation in CSS pixels.
    let translate: Vec3Partial?
    /// Rotation in degrees, aligning with CSS rotateX/Y/Z().
    let rotate: Vec3Partial?
    /// Scale as unitless multipliers, aligning with CSS scaleX/Y/Z().
    let scale: Vec3Partial?
}

// MARK: - Animation Target

/// Whitelisted property values for SpatialDiv animation.
/// Per spec: only transform (translate/rotate/scale) and opacity.
/// Layout-affecting fields (width, height, back, backOffset, depth) are NOT animatable.
struct SpatialDivAnimationTarget: Decodable {
    let transform: SpatialDivTransformTarget?
    let opacity: Double?
}

// MARK: - Loop Configuration

/// Loop configuration decoded from JS bridge.
/// Supports: true (reset loop), { reverse: true } (reverse loop), false/nil (play once).
enum SpatialDivLoopConfig: Decodable {
    case none
    case resetLoop
    case reverseLoop

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        // Try bool first
        if let boolVal = try? container.decode(Bool.self) {
            self = boolVal ? .resetLoop : .none
            return
        }

        // Try object { reverse?: Bool }
        struct LoopObject: Decodable {
            let reverse: Bool?
        }
        if let obj = try? container.decode(LoopObject.self) {
            self = (obj.reverse == true) ? .reverseLoop : .resetLoop
            return
        }

        self = .none
    }
}

// MARK: - JSB Command

/// Command received from the JS SDK via the bridge.
/// Matches the `commandType = "AnimateSpatialized2DElement"` defined in core-sdk.
struct AnimateSpatialized2DElementCommand: CommandDataProtocol {
    static let commandType: String = "AnimateSpatialized2DElement"

    let animationId: String
    let type: String // "play" | "pause" | "resume" | "cancel"

    // Fields present only when type == "play"
    let elementId: String?
    let to: SpatialDivAnimationTarget?
    let from: SpatialDivAnimationTarget?
    let duration: Double?
    let timingFunction: String?
    let delay: Double?
    let playbackRate: Double?
    let loop: SpatialDivLoopConfig?
    /// Multi-track timeline (Phase 2b). When present, segment from/to are ignored.
    let timeline: SpatialDivMotionTimelinePayload?
}

// MARK: - Resolved SRT Values

/// Fully resolved translate/rotate/scale values for interpolation.
struct ResolvedSRT {
    var translateX: Double
    var translateY: Double
    var translateZ: Double
    var rotateX: Double // degrees
    var rotateY: Double // degrees
    var rotateZ: Double // degrees
    var scaleX: Double
    var scaleY: Double
    var scaleZ: Double

    static let identity = ResolvedSRT(
        translateX: 0, translateY: 0, translateZ: 0,
        rotateX: 0, rotateY: 0, rotateZ: 0,
        scaleX: 1, scaleY: 1, scaleZ: 1
    )
}

// MARK: - Timing Functions

/// Cubic bezier timing functions for manual frame interpolation.
enum SpatialDivTimingFunction {
    case linear
    case easeIn
    case easeOut
    case easeInOut

    /// Evaluate the timing function at progress t (0...1) -> output (0...1)
    func evaluate(_ t: Double) -> Double {
        switch self {
        case .linear:
            return t
        case .easeIn:
            // cubic-bezier(0.42, 0, 1, 1)
            return cubicBezier(t, x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0)
        case .easeOut:
            // cubic-bezier(0, 0, 0.58, 1)
            return cubicBezier(t, x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0)
        case .easeInOut:
            // cubic-bezier(0.42, 0, 0.58, 1)
            return cubicBezier(t, x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0)
        }
    }

    /// Solve cubic bezier curve for Y given input T (time fraction).
    private func cubicBezier(_ t: Double, x1: Double, y1: Double, x2: Double, y2: Double) -> Double {
        if x1 == 0 && y1 == 0 && x2 == 1 && y2 == 1 {
            return t
        }

        // Newton-Raphson to solve for bezier parameter given x = t
        var guessT = t
        for _ in 0 ..< 8 {
            let currentX = sampleCurveX(guessT, x1: x1, x2: x2)
            let derivative = sampleCurveDerivativeX(guessT, x1: x1, x2: x2)
            if abs(derivative) < 1e-6 { break }
            guessT -= (currentX - t) / derivative
        }
        guessT = max(0.0, min(1.0, guessT))
        return sampleCurveY(guessT, y1: y1, y2: y2)
    }

    private func sampleCurveX(_ t: Double, x1: Double, x2: Double) -> Double {
        return ((1.0 - 3.0 * x2 + 3.0 * x1) * t + (3.0 * x2 - 6.0 * x1)) * t * t + 3.0 * x1 * t
    }

    private func sampleCurveY(_ t: Double, y1: Double, y2: Double) -> Double {
        return ((1.0 - 3.0 * y2 + 3.0 * y1) * t + (3.0 * y2 - 6.0 * y1)) * t * t + 3.0 * y1 * t
    }

    private func sampleCurveDerivativeX(_ t: Double, x1: Double, x2: Double) -> Double {
        return (3.0 * (1.0 - 3.0 * x2 + 3.0 * x1) * t + 2.0 * (3.0 * x2 - 6.0 * x1)) * t + 3.0 * x1
    }

    static func from(name: String) -> SpatialDivTimingFunction {
        switch name {
        case "linear": return .linear
        case "easeIn": return .easeIn
        case "easeOut": return .easeOut
        case "easeInOut": return .easeInOut
        default: return .easeInOut
        }
    }
}

// MARK: - Animation Session

/// Represents a single SpatialDiv animation session.
/// Uses CADisplayLink for frame-driven interpolation.
/// Only animates: transform (translate/rotate/scale) and opacity.
class SpatialDivAnimationSession {
    let animationId: String
    let elementId: String

    /// Target values to animate to.
    let to: SpatialDivAnimationTarget?

    /// Start values (from). If nil, snapshot from element at play time.
    let from: SpatialDivAnimationTarget?

    /// Resolved "from" SRT values after snapshotting from element.
    var resolvedFromSRT: ResolvedSRT = .identity

    /// Resolved "to" SRT values.
    var resolvedToSRT: ResolvedSRT = .identity

    /// Resolved "from" opacity.
    var resolvedFromOpacity: Double = 1.0

    /// Resolved "to" opacity.
    var resolvedToOpacity: Double = 1.0

    /// Whether transform is being animated.
    var animatesTransform: Bool = false

    /// Whether opacity is being animated.
    var animatesOpacity: Bool = false

    /// Duration in seconds.
    let duration: TimeInterval

    /// Delay in seconds before animation starts.
    let delay: TimeInterval

    /// Timing function for easing.
    let timingFunction: SpatialDivTimingFunction

    /// Playback speed multiplier.
    let speed: Double

    /// Loop configuration.
    let loopConfig: SpatialDivLoopConfig

    /// Timeline evaluator when `timeline` play payload is used (Phase 2b).
    var timelineEvaluator: SpatialDivTimelineEvaluator?

    /// Snapshot at t=0 for timeline cancel restore.
    var timelineStartSRT: ResolvedSRT = .identity
    var timelineStartOpacity: Double = 1.0

    // MARK: - Loop State

    /// Whether the current iteration is playing in reverse (for reverse loop).
    var isReversed: Bool = false

    // MARK: - State

    private(set) var isCanceled: Bool = false
    private(set) var isCompleted: Bool = false
    private(set) var isPaused: Bool = false

    var isTerminal: Bool {
        return isCanceled || isCompleted
    }

    // MARK: - Timing

    /// The timestamp when animation motion actually starts (after delay).
    var startTime: CFTimeInterval = 0

    /// Accumulated pause duration to subtract from elapsed time.
    var pausedDuration: CFTimeInterval = 0

    /// Timestamp when pause began.
    var pauseStartTime: CFTimeInterval = 0

    /// Whether the delay phase has completed.
    var delayCompleted: Bool = false

    /// The timestamp when animation session was created.
    let createdTime: CFTimeInterval

    init(
        animationId: String,
        elementId: String,
        to: SpatialDivAnimationTarget?,
        from: SpatialDivAnimationTarget?,
        duration: Double,
        timingFunction: String,
        delay: Double,
        speed: Double = 1.0,
        loopConfig: SpatialDivLoopConfig = .none
    ) {
        self.animationId = animationId
        self.elementId = elementId
        self.to = to
        self.from = from
        self.duration = duration
        self.delay = delay
        self.timingFunction = SpatialDivTimingFunction.from(name: timingFunction)
        self.speed = speed
        self.loopConfig = loopConfig
        createdTime = CACurrentMediaTime()
    }

    // MARK: - State Transitions

    func markCompleted() {
        isCompleted = true
    }

    func markCanceled() {
        isCanceled = true
    }

    func markPaused() {
        isPaused = true
        pauseStartTime = CACurrentMediaTime()
    }

    func markResumed() {
        isPaused = false
        pausedDuration += CACurrentMediaTime() - pauseStartTime
    }

    // MARK: - Timing Calculations

    /// Calculate the raw linear progress (0...1) at the given timestamp.
    func rawProgress(at timestamp: CFTimeInterval) -> Double {
        guard delayCompleted else { return 0 }
        let elapsed = (timestamp - startTime - pausedDuration) * speed
        return min(max(elapsed / duration, 0.0), 1.0)
    }

    /// Calculate the eased progress, accounting for reverse loop direction.
    func currentProgress(at timestamp: CFTimeInterval) -> Double {
        let raw = rawProgress(at: timestamp)
        let eased = timingFunction.evaluate(raw)
        // If reversed (reverse loop), invert the progress
        return isReversed ? (1.0 - eased) : eased
    }

    /// Check if the delay phase should end at the given timestamp.
    func shouldStartAnimation(at timestamp: CFTimeInterval) -> Bool {
        if delayCompleted { return true }
        let elapsed = (timestamp - createdTime - pausedDuration) * speed
        if elapsed >= delay {
            delayCompleted = true
            startTime = timestamp
            return true
        }
        return false
    }

    /// Check if the current iteration is complete at the given timestamp.
    func isIterationComplete(at timestamp: CFTimeInterval) -> Bool {
        guard delayCompleted else { return false }
        let elapsed = (timestamp - startTime - pausedDuration) * speed
        return elapsed >= duration
    }

    /// Reset timing for a new loop iteration.
    func resetForNextIteration(at timestamp: CFTimeInterval) {
        startTime = timestamp
        pausedDuration = 0
    }

    // MARK: - Interpolation Helpers

    static func lerp(_ from: Double, _ to: Double, _ progress: Double) -> Double {
        return from + (to - from) * progress
    }
}

// MARK: - Event Payloads

/// Payload structure matching the JS-side SpatialDivAnimatedValues.
struct SpatialDivAnimationValuesPayload: Encodable {
    let transform: SpatialDivTransformPayload?
    let opacity: Double?
}

struct SpatialDivTransformPayload: Encodable {
    let translate: Vec3Payload?
    let rotate: Vec3Payload?
    let scale: Vec3Payload?
}

struct Vec3Payload: Encodable {
    let x: Double?
    let y: Double?
    let z: Double?
}

struct SpatialDivAnimationCompletedPayload: Encodable {
    let type: String
    let values: SpatialDivAnimationValuesPayload
}

struct SpatialDivAnimationCanceledPayload: Encodable {
    let type: String
    let values: SpatialDivAnimationValuesPayload
}

struct SpatialDivAnimationFailedPayload: Encodable {
    let type: String
    let animationId: String
    let command: String
    let reason: String
}
