import Foundation
import QuartzCore
import Spatial

final class SpatializedElementAnimationObject: SpatialObject {
    let targetElementId: String
    weak var targetElement: SpatializedElement?
    let targetKind: SpatializedElementAnimationTargetKind
    let timelineSampler: SpatializedElementMotionTimelineSampler
    let writeAdapter: SpatializedElementAnimationWriteAdapter
    private let sendWebMsg: ((String, Encodable) -> Void)?

    private let duration: TimeInterval
    private let delay: TimeInterval
    private let timingFunction: SpatializedMotionTimingFunction
    private let speed: Double
    private let loopConfig: SpatializedMotionLoopConfig

    private(set) var animatesTransform: Bool
    private(set) var animatesOpacity: Bool

    private var isReversed = false

    private(set) var playState: SpatializedElementAnimationPlayState = .idle
    private(set) var finished = false

    private var startTime: CFTimeInterval = 0
    private var pausedDuration: CFTimeInterval = 0
    private var pauseStartTime: CFTimeInterval = 0
    private var delayCompleted = false
    private var createdTime: CFTimeInterval = 0
    /// Tracks whether the current playback session has emitted its first-frame lifecycle event.
    private var hasEmittedStartEvent = false

    var isAnimating: Bool {
        playState == .running
    }

    var isPaused: Bool {
        playState == .paused
    }

    var uuid: String {
        spatialId
    }

    init(
        id: String? = nil,
        targetElement: SpatializedElement,
        targetKind: SpatializedElementAnimationTargetKind,
        timelineSampler: SpatializedElementMotionTimelineSampler,
        duration: Double,
        timingFunction: String,
        delay: Double,
        speed: Double = 1.0,
        loopConfig: SpatializedMotionLoopConfig = .none,
        sendWebMsg: ((String, Encodable) -> Void)? = nil
    ) {
        targetElementId = targetElement.spatialId
        self.targetElement = targetElement
        self.targetKind = targetKind
        self.timelineSampler = timelineSampler
        writeAdapter = SpatializedElementAnimationWriteAdapter()
        self.duration = duration
        self.delay = delay
        self.timingFunction = SpatializedMotionTimingFunction.from(name: timingFunction)
        self.speed = speed
        self.loopConfig = loopConfig
        self.sendWebMsg = sendWebMsg
        animatesTransform = timelineSampler.animatesTransform
        animatesOpacity = timelineSampler.animatesOpacity

        if let id {
            super.init(id)
        } else {
            super.init()
        }
    }

    func play(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        if isPaused {
            resume(at: timestamp)
            return
        }

        // Preserve session semantics: play() while already running is a no-op.
        guard playState != .running else {
            return
        }

        startFreshPlayback(at: timestamp)
    }

    func pause(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard playState == .running else {
            return
        }

        let values = currentValues(at: timestamp)
        applySample(values)
        playState = .paused
        pauseStartTime = timestamp
        emitStateChanged(action: "pause", playState: .paused, values: values)
    }

    func resume(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard playState == .paused else {
            return
        }

        playState = .running
        pausedDuration += timestamp - pauseStartTime
        emitStateChanged(action: "resume", playState: .running, values: currentValues(at: timestamp))
    }

    func stop(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard playState == .running || playState == .paused else {
            return
        }

        let values = currentValues(at: timestamp)
        playState = .idle
        finished = false
        applySample(values)
        releaseMask()
        emitStateChanged(action: "stop", playState: .idle, values: values)
    }

    func reset(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        let values = sampleValues(at: 0)
        resetTimingState()
        playState = .idle
        finished = false
        applySample(values)
        releaseMask()
        emitStateChanged(action: "reset", playState: .idle, values: values)
    }

    func finish(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        // A finished session has already emitted its terminal event.
        guard playState != .finished else {
            return
        }

        let values = sampleValues(at: duration)
        resetTimingState()
        playState = .finished
        finished = true
        applySample(values)
        releaseMask()
        emitStateChanged(action: "finish", playState: .finished, values: values)
    }

    func tick(at timestamp: CFTimeInterval) {
        guard playState == .running else {
            return
        }

        guard shouldStartAnimation(at: timestamp) else {
            return
        }

        if !hasEmittedStartEvent {
            let values = currentValues(at: timestamp)
            applySample(values)
            emitStartEventIfNeeded(values: values)
            if isIterationComplete(at: timestamp) {
                let completedValues = sampleValues(at: duration)
                applySample(completedValues)
                playState = .finished
                finished = true
                releaseMask()
                emitStateChanged(action: "complete", playState: .finished, values: completedValues)
            }
            return
        }

        if isIterationComplete(at: timestamp) {
            switch loopConfig {
            case .none:
                let values = sampleValues(at: duration)
                applySample(values)
                playState = .finished
                finished = true
                releaseMask()
                emitStateChanged(action: "complete", playState: .finished, values: values)
            case .resetLoop:
                applySample(sampleValues(at: 0))
                resetForNextIteration(at: timestamp)
            case .reverseLoop:
                isReversed.toggle()
                resetForNextIteration(at: timestamp)
            }
            return
        }

        applySample(currentValues(at: timestamp))
    }

    override func onDestroy() {
        playState = .idle
        finished = false
        releaseMask()
        emitStateChanged(action: "destroy", playState: .idle)
    }

    private func startFreshPlayback(at timestamp: CFTimeInterval) {
        createdTime = timestamp
        startTime = timestamp
        pausedDuration = 0
        pauseStartTime = 0
        delayCompleted = delay <= 0
        isReversed = false
        finished = false
        hasEmittedStartEvent = false
        guard lockMask() else {
            emitStateChanged(
                action: "error",
                playState: .idle,
                values: currentValues(at: timestamp),
                error: SpatializedElementAnimationErrorPayload(
                    code: "mask-conflict",
                    message: "Another animation is already writing this target"
                )
            )
            return
        }
        playState = .running
        let startValues = sampleValues(at: 0)
        applySample(startValues)
        emitStateChanged(action: "play", playState: .running, values: startValues)
        if delay <= 0 {
            emitStartEventIfNeeded(values: startValues)
        }
    }

    private func lockMask() -> Bool {
        guard let element = targetElement else { return false }
        return writeAdapter.acquireMask(
            on: element,
            animationId: uuid,
            animatesTransform: animatesTransform,
            animatesOpacity: animatesOpacity
        )
    }

    private func releaseMask() {
        guard let element = targetElement else { return }
        writeAdapter.releaseMaskAndApplyPending(on: element, animationId: uuid)
    }

    private func currentValues(at timestamp: CFTimeInterval) -> SpatializedMotionValuesPayload {
        let progress = currentProgress(at: timestamp)
        return sampleValues(at: progress * duration)
    }

    private func sampleValues(at timeSec: Double) -> SpatializedMotionValuesPayload {
        let sample = timelineSampler.sampleTransformAndOpacity(at: timeSec)
        return buildValuesPayload(
            transform: sample.transform,
            opacity: sample.opacity,
            animatesTransform: animatesTransform,
            animatesOpacity: animatesOpacity
        )
    }

    private func applySample(_ values: SpatializedMotionValuesPayload) {
        guard let element = targetElement else { return }

        if let transform = values.transform,
           writeAdapter.shouldAllowTransformWrite(on: element, animationId: uuid)
        {
            let components = SpatializedMotionTransformComponents(
                translateX: transform.translate?.x ?? 0,
                translateY: transform.translate?.y ?? 0,
                translateZ: transform.translate?.z ?? 0,
                rotateX: transform.rotate?.x ?? 0,
                rotateY: transform.rotate?.y ?? 0,
                rotateZ: transform.rotate?.z ?? 0,
                scaleX: transform.scale?.x ?? 1,
                scaleY: transform.scale?.y ?? 1,
                scaleZ: transform.scale?.z ?? 1
            )
            writeAdapter.applyAffine(SpatializedElementAnimationManager.composeTransform(components), to: element)
        }

        if let opacity = values.opacity,
           writeAdapter.shouldAllowOpacityWrite(on: element, animationId: uuid)
        {
            writeAdapter.applyOpacity(opacity, to: element)
        }
    }

    private func buildValuesPayload(
        transform: SpatializedMotionTransformComponents,
        opacity: Double,
        animatesTransform: Bool,
        animatesOpacity: Bool
    ) -> SpatializedMotionValuesPayload {
        var transformPayload: SpatializedMotionTransformPayload? = nil
        var opacityPayload: Double? = nil

        if animatesTransform {
            transformPayload = SpatializedMotionTransformPayload(
                translate: Vec3Payload(x: transform.translateX, y: transform.translateY, z: transform.translateZ),
                rotate: Vec3Payload(x: transform.rotateX, y: transform.rotateY, z: transform.rotateZ),
                scale: Vec3Payload(x: transform.scaleX, y: transform.scaleY, z: transform.scaleZ)
            )
        }

        if animatesOpacity {
            opacityPayload = opacity
        }

        return SpatializedMotionValuesPayload(
            transform: transformPayload,
            opacity: opacityPayload
        )
    }

    private func emitStateChanged(
        action: String,
        playState: SpatializedElementAnimationPlayState,
        values: SpatializedMotionValuesPayload? = nil,
        error: SpatializedElementAnimationErrorPayload? = nil
    ) {
        guard let sendWebMsg else { return }
        sendWebMsg(uuid, SpatialAnimationStateChanged(
            animationId: uuid,
            action: action,
            playState: playState,
            finished: finished,
            values: values,
            error: error
        ))
    }

    private func shouldStartAnimation(at timestamp: CFTimeInterval) -> Bool {
        if delayCompleted {
            return true
        }
        let elapsed = (timestamp - createdTime - pausedDuration) * speed
        if elapsed >= delay {
            delayCompleted = true
            startTime = timestamp
            // Delay-window pauses are already accounted for above; active playback starts with a fresh pause clock.
            pausedDuration = 0
            pauseStartTime = 0
            return true
        }
        return false
    }

    /// Emits a one-time start lifecycle event when playback reaches its first sampled frame.
    private func emitStartEventIfNeeded(values: SpatializedMotionValuesPayload) {
        guard !hasEmittedStartEvent else {
            return
        }
        hasEmittedStartEvent = true
        emitStateChanged(action: "start", playState: .running, values: values)
    }

    private func currentProgress(at timestamp: CFTimeInterval) -> Double {
        let raw = rawProgress(at: timestamp)
        let eased = timingFunction.evaluate(raw)
        return isReversed ? (1.0 - eased) : eased
    }

    private func rawProgress(at timestamp: CFTimeInterval) -> Double {
        guard delayCompleted else { return 0 }
        let elapsed = (samplingTimestamp(for: timestamp) - startTime - pausedDuration) * speed
        return min(max(elapsed / duration, 0.0), 1.0)
    }

    private func isIterationComplete(at timestamp: CFTimeInterval) -> Bool {
        guard delayCompleted else { return false }
        let elapsed = (timestamp - startTime - pausedDuration) * speed
        return elapsed >= duration
    }

    private func resetForNextIteration(at timestamp: CFTimeInterval) {
        startTime = timestamp
        pausedDuration = 0
    }

    private func resetTimingState() {
        startTime = 0
        pausedDuration = 0
        pauseStartTime = 0
        createdTime = 0
        delayCompleted = false
        isReversed = false
    }

    private func samplingTimestamp(for timestamp: CFTimeInterval) -> CFTimeInterval {
        isPaused ? pauseStartTime : timestamp
    }
}
