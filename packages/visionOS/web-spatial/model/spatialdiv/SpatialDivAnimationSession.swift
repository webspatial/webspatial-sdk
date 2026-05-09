import Foundation
import QuartzCore

// MARK: - JSB Command

/// Command received from the JS SDK via the bridge.
/// Matches the `commandType = "AnimateSpatialized2DElement"` defined in core-sdk JSBCommand.ts.
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
}

/// Target property values for SpatialDiv animation.
struct SpatialDivAnimationTarget: Decodable {
    let width: Double?
    let height: Double?
    let depth: Double?
    let opacity: Double?
    let backOffset: Double?
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
    /// Uses Newton-Raphson iteration to find the x parameter, then computes y.
    private func cubicBezier(_ t: Double, x1: Double, y1: Double, x2: Double, y2: Double) -> Double {
        // For linear case, short-circuit
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

        // Clamp to valid range
        guessT = max(0.0, min(1.0, guessT))

        return sampleCurveY(guessT, y1: y1, y2: y2)
    }

    private func sampleCurveX(_ t: Double, x1: Double, x2: Double) -> Double {
        // B(t) = 3*(1-t)^2*t*x1 + 3*(1-t)*t^2*x2 + t^3
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
/// Uses CADisplayLink for frame-driven interpolation since SpatialDiv properties
/// (width, height, depth, opacity, backOffset) are not RealityKit transform-based
/// and cannot use FromToByAnimation.
class SpatialDivAnimationSession {
    let animationId: String
    let elementId: String

    /// Target values to animate to.
    let to: SpatialDivAnimationTarget?

    /// Start values (from). If nil, snapshot from element at play time.
    let from: SpatialDivAnimationTarget?

    /// Actual start values after snapshotting from element.
    var resolvedFrom: SpatialDivAnimationTarget?

    /// Duration in seconds.
    let duration: TimeInterval

    /// Delay in seconds before animation starts.
    let delay: TimeInterval

    /// Timing function for easing.
    let timingFunction: SpatialDivTimingFunction

    /// Playback speed multiplier. Default: 1.0.
    let speed: Double

    // MARK: - State

    /// Whether the session has been canceled (terminal state).
    private(set) var isCanceled: Bool = false

    /// Whether the session has completed naturally (terminal state).
    private(set) var isCompleted: Bool = false

    /// Whether the session is paused.
    private(set) var isPaused: Bool = false

    /// Whether this session has reached a terminal state.
    var isTerminal: Bool {
        return isCanceled || isCompleted
    }

    // MARK: - Timing

    /// The timestamp when animation actually starts (after delay).
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
        speed: Double = 1.0
    ) {
        self.animationId = animationId
        self.elementId = elementId
        self.to = to
        self.from = from
        self.duration = duration
        self.delay = delay
        self.timingFunction = SpatialDivTimingFunction.from(name: timingFunction)
        self.speed = speed
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

    // MARK: - Interpolation

    /// Calculate the current progress (0...1) based on elapsed time.
    func currentProgress(at timestamp: CFTimeInterval) -> Double {
        guard delayCompleted else { return 0 }
        let elapsed = (timestamp - startTime - pausedDuration) * speed
        let rawProgress = min(max(elapsed / duration, 0.0), 1.0)
        return timingFunction.evaluate(rawProgress)
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

    /// Check if the animation is complete at the given timestamp.
    func isAnimationComplete(at timestamp: CFTimeInterval) -> Bool {
        guard delayCompleted else { return false }
        let elapsed = (timestamp - startTime - pausedDuration) * speed
        return elapsed >= duration
    }

    /// Interpolate a single value between from and to.
    static func lerp(_ from: Double, _ to: Double, _ progress: Double) -> Double {
        return from + (to - from) * progress
    }
}

// MARK: - Event Payloads

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

struct SpatialDivAnimationValuesPayload: Encodable {
    let width: Double?
    let height: Double?
    let depth: Double?
    let opacity: Double?
    let backOffset: Double?
}
