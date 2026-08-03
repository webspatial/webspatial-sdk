import Combine
import Foundation
import QuartzCore
import RealityKit
import simd

/// Error raised by one native Entity motion animation object.
enum EntityMotionAnimationObjectError: Error, Equatable {
    /// Target Entity no longer exists.
    case targetNotFound(String)
    /// Timeline or sampled transform cannot be compiled.
    case compilationFailed(String)
    /// Sparse set values are invalid.
    case invalidSetValues(String)
    /// Requested control is invalid for the current state.
    case invalidControlState(String)

    /// Stable JSB reply code for this native object error.
    var replyCode: ReplyCode {
        switch self {
        case .targetNotFound:
            .TARGET_NOT_FOUND
        case .compilationFailed:
            .COMPILATION_FAILED
        case .invalidSetValues:
            .INVALID_SET_VALUES
        case .invalidControlState:
            .INVALID_CONTROL_STATE
        }
    }

    /// Human-readable diagnostic reason for this native object error.
    var reason: String {
        switch self {
        case let .targetNotFound(reason),
             let .compilationFailed(reason),
             let .invalidSetValues(reason),
             let .invalidControlState(reason):
            reason
        }
    }
}

/// Native animation object that owns one Entity motion timeline and target.
final class EntityMotionAnimationObject: SpatialObject {
    /// Target Entity id retained for lifecycle cleanup.
    let targetEntityId: String
    /// Canonical timeline supplied by Core.
    private(set) var timeline: EntityMotionTimelinePayload
    /// Latest native playback state.
    private(set) var playState: EntityMotionPlayState = .idle
    /// Latest complete transform confirmed by native.
    private(set) var confirmedValues: EntityMotionPose
    /// Revision of the committed execution definition.
    private(set) var executionRevision = 0

    /// Weak target reference to avoid retaining destroyed Entities.
    private weak var target: SpatialEntity?
    /// Event sender owned by `SpatialScene`.
    private let sendWebMsg: ((String, Encodable) -> Void)?
    /// Currently compiled playback timeline for a fresh play.
    private var compiledTimeline: EntityMotionCompiledTimeline?
    /// Baseline pose for the current fresh play.
    private var baselinePose: EntityMotionPose?
    /// Current RealityKit playback controller.
    private var playbackController: AnimationPlaybackController?
    /// Current RealityKit completion subscription.
    private var completionSubscription: (any Cancellable)?
    /// Gates duplicate completion callbacks from the same playback controller.
    private var acceptsCompletionEvent = false
    /// Prepared retarget retained while an updated animation remains paused.
    private var preparedPausedPlayback: PreparedPlayback?

    /// Fully prepared execution that can be committed without another throwing operation.
    private struct PreparedPlayback {
        /// Compiled full-pose timeline.
        let compiled: EntityMotionCompiledTimeline
        /// Generated RealityKit animation resource.
        let resource: AnimationResource
    }

    /// Creates one Entity motion object without reading the playback baseline.
    init(
        id: String? = nil,
        target: SpatialEntity,
        timeline: EntityMotionTimelinePayload,
        sendWebMsg: ((String, Encodable) -> Void)? = nil
    ) throws {
        targetEntityId = target.spatialId
        self.target = target
        self.timeline = timeline
        self.sendWebMsg = sendWebMsg
        confirmedValues = .identity
        try EntityMotionTimelineCompiler.validate(timeline)
        if let id {
            super.init(id)
        } else {
            super.init()
        }
    }

    /// Reports whether the object currently controls the target transform.
    var isActive: Bool {
        playState == .running || playState == .paused
    }

    /// Starts fresh playback or resumes paused playback.
    func play(at timestamp: CFTimeInterval = CACurrentMediaTime()) throws {
        if playState == .paused {
            if let preparedPausedPlayback {
                self.preparedPausedPlayback = nil
                startPreparedPlayback(preparedPausedPlayback)
                return
            }
            playbackController?.resume()
            playState = .running
            emitStateChanged(playState: .running)
            return
        }
        guard playState != .running else {
            return
        }
        try startFreshPlayback()
    }

    /// Pauses running playback while retaining transform write ownership.
    func pause() {
        guard playState == .running else {
            return
        }
        playbackController?.pause()
        playState = .paused
        updateConfirmedFromTarget()
        emitStateChanged(playState: .paused)
    }

    /// Stops playback at the current transform and releases transform write ownership.
    func stop(at timestamp: CFTimeInterval = CACurrentMediaTime()) {
        guard playState == .running || playState == .paused else {
            return
        }
        stopController()
        updateConfirmedFromTarget()
        playState = .idle
        releaseTransformWrite()
        emitStateChanged(
            playState: .idle,
            callbackAction: .stop,
            values: confirmedValues
        )
    }

    /// Commits the current start pose and returns to idle.
    func reset() throws {
        stopController()
        let pose = try startPose()
        let confirmed = try commitPose(pose)
        confirmedValues = confirmed
        playState = .idle
        releaseTransformWrite()
        emitStateChanged(
            playState: .idle,
            callbackAction: .reset,
            values: confirmed
        )
    }

    /// Commits the configured final pose and enters the finished state.
    func finish() throws {
        guard playState != .finished else {
            return
        }
        stopController()
        let pose = try terminalPose()
        let confirmed = try commitPose(pose)
        confirmedValues = confirmed
        playState = .finished
        releaseTransformWrite()
        emitStateChanged(
            playState: .finished,
            callbackAction: .complete,
            values: confirmed
        )
    }

    /// Handles the current RealityKit controller's natural completion.
    func completeNaturally(revision: Int? = nil) {
        guard acceptsCompletionEvent,
              revision ?? executionRevision == executionRevision
        else {
            return
        }
        acceptsCompletionEvent = false
        playbackController = nil
        guard let pose = compiledTimeline?.slices.last?.pose else {
            playState = .idle
            releaseTransformWrite()
            emitError(.compilationFailed("Completed run has no compiled terminal pose."))
            return
        }
        do {
            confirmedValues = try commitPose(pose)
        } catch {
            playState = .idle
            releaseTransformWrite()
            emitError(.compilationFailed(error.localizedDescription))
            return
        }
        playState = .finished
        releaseTransformWrite()
        emitStateChanged(
            playState: .finished,
            callbackAction: .complete,
            values: confirmedValues
        )
    }

    /// Merges a sparse update into the inactive native transform and returns the full pose.
    @discardableResult
    func set(_ update: EntityMotionTransformPayload) throws -> EntityMotionConfirmedTransformPayload {
        guard !isActive else {
            throw EntityMotionAnimationObjectError.invalidControlState(
                "set is not allowed while animation is active"
            )
        }
        do {
            let pose = try EntityMotionTransformValues.merge(update, onto: currentConfirmedPose())
            confirmedValues = try commitPose(pose)
            return confirmedValues.confirmedPayload
        } catch let EntityMotionCompilationError.invalidSetValues(reason) {
            throw EntityMotionAnimationObjectError.invalidSetValues(reason)
        } catch {
            throw EntityMotionAnimationObjectError.invalidSetValues(error.localizedDescription)
        }
    }

    /// Atomically commits a replacement timeline and retargets active playback.
    @discardableResult
    func update(_ candidate: EntityMotionTimelinePayload) throws -> UpdateEntityAnimationResult {
        guard let target else {
            throw EntityMotionAnimationObjectError.targetNotFound(targetEntityId)
        }
        try EntityMotionTimelineCompiler.validate(candidate)
        let current = try Self.currentPose(for: target)
        let active = isActive
        if !active {
            timeline = candidate
            executionRevision += 1
            confirmedValues = current
            baselinePose = nil
            compiledTimeline = nil
            preparedPausedPlayback = nil
            return UpdateEntityAnimationResult(
                values: confirmedValues.confirmedPayload,
                revision: executionRevision
            )
        }

        let executionTimeline = Self.retargetTimeline(candidate, from: current)
        let compiled = try EntityMotionTimelineCompiler.compile(
            executionTimeline,
            baseline: current
        )
        let resource = try Self.makeAnimationResource(
            compiled: compiled,
            timeline: candidate
        ).resource
        let previousState = playState

        stopController()
        timeline = candidate
        executionRevision += 1
        confirmedValues = current
        baselinePose = current
        compiledTimeline = compiled

        switch previousState {
        case .running:
            playState = .running
            startPreparedPlayback(.init(compiled: compiled, resource: resource))
        case .paused:
            playState = .paused
            preparedPausedPlayback = .init(compiled: compiled, resource: resource)
        case .idle, .finished:
            preconditionFailure("Active Entity motion update entered an inactive state.")
        }

        return UpdateEntityAnimationResult(
            values: confirmedValues.confirmedPayload,
            revision: executionRevision
        )
    }

    /// Releases native resources and transform write ownership.
    override func onDestroy() {
        stopController()
        releaseTransformWrite()
    }

    /// Compiles and starts one fresh RealityKit playback resource.
    private func startFreshPlayback() throws {
        guard let target else {
            throw EntityMotionAnimationObjectError.targetNotFound(targetEntityId)
        }
        guard target.acquireEntityMotionTransformWrite(animationId: spatialId) else {
            throw EntityMotionAnimationObjectError.invalidControlState(
                "another animation is writing this entity transform"
            )
        }

        do {
            let baseline = try Self.currentPose(for: target)
            let compiled = try EntityMotionTimelineCompiler.compile(timeline, baseline: baseline)
            let resourceBuild = try Self.makeAnimationResource(
                compiled: compiled,
                timeline: timeline
            )
            baselinePose = baseline
            compiledTimeline = compiled
            let startPose = compiled.slices[0].pose
            playState = .running
            acceptsCompletionEvent = timeline.loop.mode == .none
            confirmedValues = try commitPose(startPose)
            emitStateChanged(
                playState: .running,
                callbackAction: .start,
                values: confirmedValues
            )
            playbackController = target.playAnimation(resourceBuild.resource, startsPaused: false)
            observeCompletion(on: target)
        } catch {
            releaseTransformWrite()
            playState = .idle
            throw EntityMotionAnimationObjectError.compilationFailed(error.localizedDescription)
        }
    }

    /// Starts a precompiled execution after its candidate definition has committed.
    private func startPreparedPlayback(_ prepared: PreparedPlayback) {
        guard let target else {
            return
        }
        compiledTimeline = prepared.compiled
        playState = .running
        acceptsCompletionEvent = timeline.loop.mode == .none
        emitStateChanged(
            playState: .running,
            callbackAction: .start,
            values: confirmedValues
        )
        playbackController = target.playAnimation(prepared.resource, startsPaused: false)
        observeCompletion(on: target)
    }

    /// Subscribes to the current RealityKit playback-completed event.
    private func observeCompletion(on target: SpatialEntity) {
        let revision = executionRevision
        completionSubscription = target.scene?.subscribe(
            to: AnimationEvents.PlaybackCompleted.self,
            on: target
        ) { [weak self] event in
            guard let self,
                  event.playbackController == self.playbackController,
                  revision == self.executionRevision
            else {
                return
            }
            self.completeNaturally(revision: revision)
        }
    }

    /// Stops the owned RealityKit playback controller only.
    private func stopController() {
        acceptsCompletionEvent = false
        completionSubscription = nil
        playbackController?.stop()
        playbackController = nil
    }

    /// Releases this object's transform write ownership from the target.
    private func releaseTransformWrite() {
        target?.releaseEntityMotionTransformWrite(animationId: spatialId)
    }

    /// Reads the latest target pose, falling back to the previous confirmed pose.
    private func updateConfirmedFromTarget() {
        guard let target,
              let pose = try? Self.currentPose(for: target)
        else {
            return
        }
        confirmedValues = pose
    }

    /// Returns the most recent complete native pose.
    private func currentConfirmedPose() -> EntityMotionPose {
        if let target,
           let pose = try? Self.currentPose(for: target)
        {
            return pose
        }
        return confirmedValues
    }

    /// Returns the start pose used by reset before the first play.
    private func makeBaselineForTerminalCommand() -> EntityMotionPose {
        if let target,
           let pose = try? Self.currentPose(for: target)
        {
            return pose
        }
        return confirmedValues
    }

    /// Returns the configured first pose for reset.
    private func startPose() throws -> EntityMotionPose {
        let baseline = baselinePose ?? makeBaselineForTerminalCommand()
        return try EntityMotionTimelineCompiler.compile(
            timeline,
            baseline: baseline
        ).slices[0].pose
    }

    /// Returns the configured final pose for finish or natural completion.
    private func terminalPose() throws -> EntityMotionPose {
        let baseline = baselinePose ?? makeBaselineForTerminalCommand()
        if let compiledTimeline,
           let pose = compiledTimeline.slices.last?.pose
        {
            return pose
        }
        guard let pose = try EntityMotionTimelineCompiler.compile(
            timeline,
            baseline: baseline
        ).slices.last?.pose else {
            throw EntityMotionAnimationObjectError.compilationFailed(
                "Timeline has no terminal pose."
            )
        }
        return pose
    }

    /// Commits a complete pose and reads the target's stored Transform back.
    private func commitPose(_ pose: EntityMotionPose) throws -> EntityMotionPose {
        guard let target else {
            throw EntityMotionAnimationObjectError.targetNotFound(targetEntityId)
        }
        target.transform = Self.transform(from: pose)
        return try Self.currentPose(for: target)
    }

    /// Sends one canonical Entity motion state or lifecycle callback event.
    private func emitStateChanged(
        playState: EntityMotionPlayState,
        callbackAction: EntityMotionCallbackAction? = nil,
        values: EntityMotionPose? = nil
    ) {
        precondition(
            (callbackAction == nil) == (values == nil),
            "Entity motion callbackAction and values must be paired."
        )
        sendWebMsg?(spatialId, EntityMotionStateChangedMessage(
            detail: .init(
                id: spatialId,
                revision: executionRevision,
                playState: playState,
                callbackAction: callbackAction,
                values: values?.confirmedPayload
            )
        ))
    }

    /// Sends one asynchronous Entity motion error on its dedicated channel.
    private func emitError(_ error: EntityMotionAnimationObjectError) {
        let code: EntityMotionErrorCode
        switch error {
        case .targetNotFound:
            code = .targetNotFound
        case .compilationFailed:
            code = .compilationFailed
        case .invalidSetValues:
            code = .invalidSetValues
        case .invalidControlState:
            code = .invalidControlState
        }
        sendWebMsg?(spatialId, EntityAnimationErrorMessage(
            detail: .init(
                id: spatialId,
                error: .init(code: code, reason: error.reason)
            )
        ))
    }

    /// Reads a complete pose from a RealityKit Entity transform.
    private static func currentPose(for entity: SpatialEntity) throws -> EntityMotionPose {
        try EntityMotionTransformValues.decompose(entity.transform)
    }

    /// Converts a RealityKit float matrix to the double matrix used by decomposition.
    private static func doubleMatrix(from matrix: simd_float4x4) -> simd_double4x4 {
        simd_double4x4(columns: (
            SIMD4<Double>(
                Double(matrix.columns.0.x),
                Double(matrix.columns.0.y),
                Double(matrix.columns.0.z),
                Double(matrix.columns.0.w)
            ),
            SIMD4<Double>(
                Double(matrix.columns.1.x),
                Double(matrix.columns.1.y),
                Double(matrix.columns.1.z),
                Double(matrix.columns.1.w)
            ),
            SIMD4<Double>(
                Double(matrix.columns.2.x),
                Double(matrix.columns.2.y),
                Double(matrix.columns.2.z),
                Double(matrix.columns.2.w)
            ),
            SIMD4<Double>(
                Double(matrix.columns.3.x),
                Double(matrix.columns.3.y),
                Double(matrix.columns.3.z),
                Double(matrix.columns.3.w)
            ),
        ))
    }

    /// Converts a complete pose to a RealityKit transform.
    private static func transform(from pose: EntityMotionPose) -> Transform {
        let rotation = EntityMotionTransformValues.composeEulerZYX(pose.rotation)
        return Transform(
            scale: SIMD3<Float>(
                Float(pose.scale.x),
                Float(pose.scale.y),
                Float(pose.scale.z)
            ),
            rotation: simd_quatf(
                ix: Float(rotation.imag.x),
                iy: Float(rotation.imag.y),
                iz: Float(rotation.imag.z),
                r: Float(rotation.real)
            ),
            translation: SIMD3<Float>(
                Float(pose.position.x),
                Float(pose.position.y),
                Float(pose.position.z)
            )
        )
    }

    /// Replaces each controlled time-zero scalar with the current native pose.
    private static func retargetTimeline(
        _ timeline: EntityMotionTimelinePayload,
        from pose: EntityMotionPose
    ) -> EntityMotionTimelinePayload {
        EntityMotionTimelinePayload(
            duration: timeline.duration,
            delay: timeline.delay,
            playbackRate: timeline.playbackRate,
            loop: timeline.loop,
            tracks: timeline.tracks.map { track in
                EntityMotionTrackPayload(
                    property: track.property,
                    keyframes: track.keyframes.map { keyframe in
                        guard keyframe.at == 0 else {
                            return keyframe
                        }
                        return EntityMotionKeyframePayload(
                            at: keyframe.at,
                            value: scalarValue(for: track.property, in: pose),
                            timingFunction: keyframe.timingFunction
                        )
                    },
                    timingFunction: track.timingFunction
                )
            }
        )
    }

    /// Reads one canonical scalar property from a complete pose.
    private static func scalarValue(for property: String, in pose: EntityMotionPose) -> Double {
        switch property {
        case "position.x": pose.position.x
        case "position.y": pose.position.y
        case "position.z": pose.position.z
        case "rotation.x": pose.rotation.x
        case "rotation.y": pose.rotation.y
        case "rotation.z": pose.rotation.z
        case "scale.x": pose.scale.x
        case "scale.y": pose.scale.y
        case "scale.z": pose.scale.z
        default:
            preconditionFailure("Validated Entity motion property became unsupported.")
        }
    }

    /// Generates one complete-transform RealityKit animation resource.
    static func makeAnimationResource(
        compiled: EntityMotionCompiledTimeline,
        timeline: EntityMotionTimelinePayload
    ) throws -> (resource: AnimationResource, usesSequence: Bool) {
        let segmentResources = try compiled.segments.map { segment in
            let animation = FromToByAnimation<Transform>(
                from: transform(from: segment.from),
                to: transform(from: segment.to),
                duration: segment.end - segment.start,
                timing: timingFunction(segment.timing),
                bindTarget: .transform
            )
            return try AnimationResource.generate(with: animation)
        }
        guard !segmentResources.isEmpty else {
            throw EntityMotionAnimationObjectError.compilationFailed(
                "Timeline produced no full-pose segments."
            )
        }
        let source = segmentResources.count == 1
            ? segmentResources[0]
            : try AnimationResource.sequence(with: segmentResources)
        let view = AnimationView(
            source: source.definition,
            // Inherit the source binding instead of rebinding its composite definition.
            bindTarget: nil,
            repeatMode: repeatMode(timeline.loop.mode),
            delay: timeline.delay,
            speed: Float(timeline.playbackRate)
        )
        return try (
            resource: AnimationResource.generate(with: view),
            usesSequence: segmentResources.count > 1
        )
    }

    /// Maps Entity motion loop mode to RealityKit repeat mode.
    private static func repeatMode(_ mode: EntityMotionLoopMode) -> AnimationRepeatMode {
        switch mode {
        case .none:
            .none
        case .reset:
            .repeat
        case .reverse:
            .autoReverse
        }
    }

    /// Maps Entity motion timing to RealityKit timing.
    private static func timingFunction(_ timing: EntityMotionTimingFunction) -> AnimationTimingFunction {
        switch timing {
        case .linear:
            .linear
        case .easeIn:
            .easeIn
        case .easeOut:
            .easeOut
        case .easeInOut:
            .easeInOut
        }
    }
}
