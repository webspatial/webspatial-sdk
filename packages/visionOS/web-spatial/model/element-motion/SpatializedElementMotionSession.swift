import Foundation
import QuartzCore

// MARK: - Animation Session

/// Represents a single spatialized element motion session.
/// Uses CADisplayLink for frame-driven interpolation.
/// Only animates: transform (translate/rotate/scale) and opacity.
class SpatializedElementMotionSession {
    let animationId: String
    let elementId: String

    /// Native write path adapter for element motion (Static3D `modelTransform` vs element `transform`).
    var transformAdapter: SpatializedElementMotionTransformAdapter = .elementTransform

    /// Whether transform is being animated.
    var animatesTransform: Bool = false

    /// Whether opacity is being animated.
    var animatesOpacity: Bool = false

    /// Duration in seconds.
    let duration: TimeInterval

    /// Delay in seconds before animation starts.
    let delay: TimeInterval

    /// Timing function used to ease loop progress across iterations.
    let timingFunction: SpatializedMotionTimingFunction

    /// Playback speed multiplier.
    let speed: Double

    /// Loop configuration.
    let loopConfig: SpatializedMotionLoopConfig

    /// Timeline sampler for canonical timeline playback.
    let timelineSampler: SpatializedElementMotionTimelineSampler

    /// Snapshot at t=0 for timeline cancel restore.
    var timelineStartTransform: SpatializedMotionTransformComponents = .identity
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
        timelineSampler: SpatializedElementMotionTimelineSampler,
        duration: Double,
        timingFunction: String,
        delay: Double,
        speed: Double = 1.0,
        loopConfig: SpatializedMotionLoopConfig = .none
    ) {
        self.animationId = animationId
        self.elementId = elementId
        self.timelineSampler = timelineSampler
        self.duration = duration
        self.delay = delay
        self.timingFunction = SpatializedMotionTimingFunction.from(name: timingFunction)
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

    func markPaused(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard !isPaused else { return }
        isPaused = true
        pauseStartTime = timestamp
    }

    func markResumed(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard isPaused else { return }
        isPaused = false
        pausedDuration += timestamp - pauseStartTime
    }

    /// Freeze time-dependent sampling at the pause boundary while paused.
    private func samplingTimestamp(for timestamp: CFTimeInterval) -> CFTimeInterval {
        return isPaused ? pauseStartTime : timestamp
    }

    // MARK: - Timing Calculations

    /// Calculate the raw linear progress (0...1) at the given timestamp.
    func rawProgress(at timestamp: CFTimeInterval) -> Double {
        guard delayCompleted else { return 0 }
        let elapsed = (samplingTimestamp(for: timestamp) - startTime - pausedDuration) * speed
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
}
