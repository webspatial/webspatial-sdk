import Foundation
import QuartzCore
import Spatial

// MARK: - SpatialDiv Animation Manager

/// Manages active Dynamic3D animation sessions.
/// Uses a single shared CADisplayLink to drive all animations at display refresh rate (90Hz on visionOS).
/// Properties are interpolated per-frame and applied directly to SpatializedElement @Observable vars,
/// which triggers SwiftUI view updates automatically.
///
/// Per spec, only `transform` (translate/rotate/scale) and `opacity` are animatable.
class Dynamic3DMotionAnimationManager: NSObject {
    /// Active sessions keyed by animationId.
    private var sessions: [String: SpatialDivAnimationSession] = [:]

    /// The shared CADisplayLink for frame driving.
    private var displayLink: CADisplayLink?

    /// Weak reference to the scene for sending events back to JS and looking up elements.
    weak var scene: SpatialScene?

    init(scene: SpatialScene? = nil) {
        self.scene = scene
        super.init()
    }

    // MARK: - Session Management

    func getSession(_ animationId: String) -> SpatialDivAnimationSession? {
        return sessions[animationId]
    }

    private func addSession(_ session: SpatialDivAnimationSession) {
        sessions[session.animationId] = session
        ensureDisplayLinkRunning()
    }

    private func removeSession(_ animationId: String) {
        sessions.removeValue(forKey: animationId)
        if sessions.isEmpty {
            stopDisplayLink()
        }
    }

    /// Remove all sessions for a given element (called on element destroy).
    func removeSessionsForElement(_ elementId: String) {
        let toRemove = sessions.filter { $0.value.elementId == elementId }
        for (id, session) in toRemove {
            session.markCanceled()
            sessions.removeValue(forKey: id)
        }
        if sessions.isEmpty {
            stopDisplayLink()
        }
    }

    func removeAll() {
        for (_, session) in sessions {
            session.markCanceled()
        }
        sessions.removeAll()
        stopDisplayLink()
    }

    // MARK: - CADisplayLink

    private func ensureDisplayLinkRunning() {
        guard displayLink == nil else { return }
        let link = CADisplayLink(target: self, selector: #selector(onFrame(_:)))
        // visionOS: preferredFrameRateRange for 90Hz
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 90, preferred: 90)
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    private func stopDisplayLink() {
        displayLink?.invalidate()
        displayLink = nil
    }

    @objc private func onFrame(_ link: CADisplayLink) {
        let timestamp = CACurrentMediaTime()
        var completedIds: [String] = []

        for (animationId, session) in sessions {
            guard !session.isTerminal else {
                completedIds.append(animationId)
                continue
            }
            guard !session.isPaused else { continue }

            // Check delay phase
            guard session.shouldStartAnimation(at: timestamp) else { continue }

            // Check if current iteration is complete
            if session.isIterationComplete(at: timestamp) {
                switch session.loopConfig {
                case .none:
                    // No loop: apply final values and complete
                    applyFinalValues(session: session)
                    session.markCompleted()
                    sendCompletedEvent(session: session)
                    completedIds.append(animationId)

                case .resetLoop:
                    // Reset loop: snap back to 'from' values instantly and restart
                    applyFromValues(session: session)
                    session.resetForNextIteration(at: timestamp)

                case .reverseLoop:
                    // Reverse loop: flip direction and restart
                    session.isReversed.toggle()
                    session.resetForNextIteration(at: timestamp)
                }
                continue
            }

            // Interpolate and apply
            let progress = session.currentProgress(at: timestamp)
            applyInterpolatedValues(session: session, progress: progress)
        }

        // Cleanup completed sessions
        for id in completedIds {
            removeSession(id)
        }
    }

    // MARK: - Play

    func handlePlay(
        command: AnimateSpatializedDynamic3DElementCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let elementId = command.elementId else {
            resolve(.failure(JsbError(code: .CommandError, message: "AnimateSpatializedDynamic3DElement play: elementId is required")))
            return
        }

        if let timeline = command.timeline {
            handleTimelinePlay(
                command: command,
                timeline: timeline,
                element: element,
                elementId: elementId,
                resolve: resolve
            )
            return
        }

        let session = SpatialDivAnimationSession(
            animationId: command.animationId,
            elementId: elementId,
            to: command.to,
            from: command.from,
            duration: command.duration ?? 0.3,
            timingFunction: command.timingFunction ?? "easeInOut",
            delay: command.delay ?? 0,
            speed: command.playbackRate ?? 1.0,
            loopConfig: command.loop ?? .none
        )

        // --- Resolve "from" SRT by snapshotting current element transform ---
        let currentSRT = Self.decomposeSRT(from: element.transform)
        let fromTarget = command.from

        session.resolvedFromSRT = ResolvedSRT(
            translateX: fromTarget?.transform?.translate?.x ?? currentSRT.translateX,
            translateY: fromTarget?.transform?.translate?.y ?? currentSRT.translateY,
            translateZ: fromTarget?.transform?.translate?.z ?? currentSRT.translateZ,
            rotateX: fromTarget?.transform?.rotate?.x ?? currentSRT.rotateX,
            rotateY: fromTarget?.transform?.rotate?.y ?? currentSRT.rotateY,
            rotateZ: fromTarget?.transform?.rotate?.z ?? currentSRT.rotateZ,
            scaleX: fromTarget?.transform?.scale?.x ?? currentSRT.scaleX,
            scaleY: fromTarget?.transform?.scale?.y ?? currentSRT.scaleY,
            scaleZ: fromTarget?.transform?.scale?.z ?? currentSRT.scaleZ
        )

        // --- Resolve "from" opacity ---
        session.resolvedFromOpacity = fromTarget?.opacity ?? element.opacity

        // --- Resolve "to" SRT ---
        let toTarget = command.to
        if let toTransform = toTarget?.transform {
            session.animatesTransform = true
            // For "to" values: if a sub-field is not specified, hold at the from value
            session.resolvedToSRT = ResolvedSRT(
                translateX: toTransform.translate?.x ?? session.resolvedFromSRT.translateX,
                translateY: toTransform.translate?.y ?? session.resolvedFromSRT.translateY,
                translateZ: toTransform.translate?.z ?? session.resolvedFromSRT.translateZ,
                rotateX: toTransform.rotate?.x ?? session.resolvedFromSRT.rotateX,
                rotateY: toTransform.rotate?.y ?? session.resolvedFromSRT.rotateY,
                rotateZ: toTransform.rotate?.z ?? session.resolvedFromSRT.rotateZ,
                scaleX: toTransform.scale?.x ?? session.resolvedFromSRT.scaleX,
                scaleY: toTransform.scale?.y ?? session.resolvedFromSRT.scaleY,
                scaleZ: toTransform.scale?.z ?? session.resolvedFromSRT.scaleZ
            )
        }

        // --- Resolve "to" opacity ---
        if let toOpacity = toTarget?.opacity {
            session.animatesOpacity = true
            session.resolvedToOpacity = toOpacity
        } else {
            session.resolvedToOpacity = session.resolvedFromOpacity
        }

        // If "from" values are explicitly provided, apply them immediately to the element
        if fromTarget?.transform != nil {
            session.animatesTransform = true
            element.transform = Self.composeSRT(session.resolvedFromSRT)
        }
        if fromTarget?.opacity != nil {
            session.animatesOpacity = true
            element.opacity = session.resolvedFromOpacity
        }

        addSession(session)

        // Acknowledge the play command immediately so the JS side can set up listeners
        resolve(.success(nil))
    }

    private func handleTimelinePlay(
        command: AnimateSpatializedDynamic3DElementCommand,
        timeline: SpatialDivMotionTimelinePayload,
        element: SpatializedElement,
        elementId: String,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        let baselineSRT = Self.decomposeSRT(from: element.transform)
        let baselineOpacity = element.opacity
        let evaluator = SpatialDivTimelineEvaluator(
            timeline: timeline,
            baselineSRT: baselineSRT,
            baselineOpacity: baselineOpacity
        )
        let session = SpatialDivAnimationSession(
            animationId: command.animationId,
            elementId: elementId,
            to: nil,
            from: nil,
            duration: timeline.duration,
            timingFunction: "linear",
            delay: command.delay ?? timeline.delay ?? 0,
            speed: command.playbackRate ?? timeline.playbackRate ?? 1.0,
            loopConfig: command.loop ?? timeline.loop ?? .none
        )

        session.timelineEvaluator = evaluator
        session.animatesTransform = evaluator.animatesTransform
        session.animatesOpacity = evaluator.animatesOpacity

        let start = evaluator.sampleSRTAndOpacity(at: 0)
        session.timelineStartSRT = start.srt
        session.timelineStartOpacity = start.opacity

        if session.animatesTransform {
            element.transform = Self.composeSRT(start.srt)
        }
        if session.animatesOpacity {
            element.opacity = start.opacity
        }

        addSession(session)
        resolve(.success(nil))
    }

    // MARK: - Pause

    func handlePause(
        command: AnimateSpatializedDynamic3DElementCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let session = getSession(command.animationId) else {
            resolve(.failure(JsbError(code: .CommandError, message: "Animation session \(command.animationId) not found")))
            return
        }
        guard !session.isTerminal else {
            resolve(.failure(JsbError(code: .CommandError, message: "Animation session \(command.animationId) is already terminal")))
            return
        }

        let values = buildSampledValuesPayload(
            session: session,
            at: CACurrentMediaTime()
        )
        session.markPaused()
        let payload = SpatialDivAnimationPausedPayload(type: "paused", values: values)
        resolve(.success(payload))
    }

    // MARK: - Resume

    func handleResume(
        command: AnimateSpatializedDynamic3DElementCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let session = getSession(command.animationId) else {
            resolve(.failure(JsbError(code: .CommandError, message: "Animation session \(command.animationId) not found")))
            return
        }
        guard session.isPaused else {
            resolve(.failure(JsbError(code: .CommandError, message: "Animation session \(command.animationId) is not paused")))
            return
        }

        session.markResumed()
        resolve(.success(nil))
    }

    // MARK: - Cancel

    func handleCancel(
        command: AnimateSpatializedDynamic3DElementCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let session = getSession(command.animationId) else {
            // Session may have already been cleaned up - acknowledge silently.
            resolve(.success(nil))
            return
        }

        guard !session.isTerminal else {
            resolve(.success(nil))
            return
        }

        session.markCanceled()

        // Cancel restores element to the "from" values (Web Animation API cancel semantics).
        if let evaluator = session.timelineEvaluator {
            if session.animatesTransform {
                element.transform = Self.composeSRT(session.timelineStartSRT)
            }
            if session.animatesOpacity {
                element.opacity = session.timelineStartOpacity
            }
        } else {
            if session.animatesTransform {
                element.transform = Self.composeSRT(session.resolvedFromSRT)
            }
            if session.animatesOpacity {
                element.opacity = session.resolvedFromOpacity
            }
        }

        sendCanceledEvent(session: session)
        removeSession(command.animationId)

        resolve(.success(nil))
    }

    // MARK: - Interpolation Application

    private func applyInterpolatedValues(session: SpatialDivAnimationSession, progress: Double) {
        guard let element = findElement(session.elementId) else { return }

        if let evaluator = session.timelineEvaluator {
            let timeSec = progress * session.duration
            let sample = evaluator.sampleSRTAndOpacity(at: timeSec)
            if session.animatesTransform {
                element.transform = Self.composeSRT(sample.srt)
            }
            if session.animatesOpacity {
                element.opacity = sample.opacity
            }
            return
        }

        if session.animatesTransform {
            let fromSRT = session.resolvedFromSRT
            let toSRT = session.resolvedToSRT
            let interpolated = ResolvedSRT(
                translateX: SpatialDivAnimationSession.lerp(fromSRT.translateX, toSRT.translateX, progress),
                translateY: SpatialDivAnimationSession.lerp(fromSRT.translateY, toSRT.translateY, progress),
                translateZ: SpatialDivAnimationSession.lerp(fromSRT.translateZ, toSRT.translateZ, progress),
                rotateX: SpatialDivAnimationSession.lerp(fromSRT.rotateX, toSRT.rotateX, progress),
                rotateY: SpatialDivAnimationSession.lerp(fromSRT.rotateY, toSRT.rotateY, progress),
                rotateZ: SpatialDivAnimationSession.lerp(fromSRT.rotateZ, toSRT.rotateZ, progress),
                scaleX: SpatialDivAnimationSession.lerp(fromSRT.scaleX, toSRT.scaleX, progress),
                scaleY: SpatialDivAnimationSession.lerp(fromSRT.scaleY, toSRT.scaleY, progress),
                scaleZ: SpatialDivAnimationSession.lerp(fromSRT.scaleZ, toSRT.scaleZ, progress)
            )
            element.transform = Self.composeSRT(interpolated)
        }

        if session.animatesOpacity {
            element.opacity = SpatialDivAnimationSession.lerp(
                session.resolvedFromOpacity, session.resolvedToOpacity, progress
            )
        }
    }

    private func applyFinalValues(session: SpatialDivAnimationSession) {
        guard let element = findElement(session.elementId) else { return }

        if let evaluator = session.timelineEvaluator {
            let sample = evaluator.sampleSRTAndOpacity(at: session.duration)
            if session.animatesTransform {
                element.transform = Self.composeSRT(sample.srt)
            }
            if session.animatesOpacity {
                element.opacity = sample.opacity
            }
            return
        }

        if session.animatesTransform {
            element.transform = Self.composeSRT(session.resolvedToSRT)
        }
        if session.animatesOpacity {
            element.opacity = session.resolvedToOpacity
        }
    }

    /// Apply the "from" values to the element (used in reset loop snap-back).
    private func applyFromValues(session: SpatialDivAnimationSession) {
        guard let element = findElement(session.elementId) else { return }

        if let evaluator = session.timelineEvaluator {
            if session.animatesTransform {
                element.transform = Self.composeSRT(session.timelineStartSRT)
            }
            if session.animatesOpacity {
                element.opacity = session.timelineStartOpacity
            }
            return
        }

        if session.animatesTransform {
            element.transform = Self.composeSRT(session.resolvedFromSRT)
        }
        if session.animatesOpacity {
            element.opacity = session.resolvedFromOpacity
        }
    }

    // MARK: - SRT Decomposition / Composition

    /// Decompose an AffineTransform3D into separate translate, rotate (degrees), scale components.
    /// Assumes composition order: translate → rotate → scale.
    static func decomposeSRT(from transform: AffineTransform3D) -> ResolvedSRT {
        // If identity, return identity SRT
        if transform == .identity {
            return .identity
        }

        // Access the underlying 4x4 matrix (column-major)
        let m = transform.matrix

        // Extract translation from the 4th column
        let tx = m.columns.3.x
        let ty = m.columns.3.y
        let tz = m.columns.3.z

        // Extract the 3x3 upper-left (rotation + scale) matrix columns
        let col0 = SIMD3<Double>(m.columns.0.x, m.columns.0.y, m.columns.0.z)
        let col1 = SIMD3<Double>(m.columns.1.x, m.columns.1.y, m.columns.1.z)
        let col2 = SIMD3<Double>(m.columns.2.x, m.columns.2.y, m.columns.2.z)

        // Scale = length of each column
        let sx = simd_length(col0)
        let sy = simd_length(col1)
        let sz = simd_length(col2)

        // Avoid division by zero
        guard sx > 1e-10, sy > 1e-10, sz > 1e-10 else {
            return ResolvedSRT(
                translateX: tx, translateY: ty, translateZ: tz,
                rotateX: 0, rotateY: 0, rotateZ: 0,
                scaleX: sx, scaleY: sy, scaleZ: sz
            )
        }

        // Normalized rotation matrix elements
        let r00 = col0.x / sx; let r10 = col0.y / sx; let r20 = col0.z / sx
        let r01 = col1.x / sy; let r11 = col1.y / sy; let r21 = col1.z / sy
        let r02 = col2.x / sz; let r12 = col2.y / sz; let r22 = col2.z / sz

        // Extract Euler angles (XYZ intrinsic order matching CSS rotateX → rotateY → rotateZ)
        let rotY = asin(max(-1, min(1, r02)))
        var rotX: Double
        var rotZ: Double

        if cos(rotY) > 1e-6 {
            rotX = atan2(-r12, r22)
            rotZ = atan2(-r01, r00)
        } else {
            // Gimbal lock
            rotX = atan2(r21, r11)
            rotZ = 0
        }

        // Convert radians to degrees
        let rad2deg = 180.0 / Double.pi

        return ResolvedSRT(
            translateX: tx, translateY: ty, translateZ: tz,
            rotateX: rotX * rad2deg,
            rotateY: rotY * rad2deg,
            rotateZ: rotZ * rad2deg,
            scaleX: sx, scaleY: sy, scaleZ: sz
        )
    }

    /// Compose an AffineTransform3D from SRT values.
    /// Composition order (spec-mandated): translate → rotate → scale.
    /// Rotation order: rotateX → rotateY → rotateZ (matching CSS transform function order).
    static func composeSRT(_ srt: ResolvedSRT) -> AffineTransform3D {
        let deg2rad = Double.pi / 180.0

        let cosX = cos(srt.rotateX * deg2rad)
        let sinX = sin(srt.rotateX * deg2rad)
        let cosY = cos(srt.rotateY * deg2rad)
        let sinY = sin(srt.rotateY * deg2rad)
        let cosZ = cos(srt.rotateZ * deg2rad)
        let sinZ = sin(srt.rotateZ * deg2rad)

        // Combined rotation matrix Rz * Ry * Rx (for intrinsic XYZ order, extrinsic is ZYX)
        // This gives the matrix for applying rotateX first, then rotateY, then rotateZ.
        let r00 = cosY * cosZ
        let r01 = sinX * sinY * cosZ - cosX * sinZ
        let r02 = cosX * sinY * cosZ + sinX * sinZ
        let r10 = cosY * sinZ
        let r11 = sinX * sinY * sinZ + cosX * cosZ
        let r12 = cosX * sinY * sinZ - sinX * cosZ
        let r20 = -sinY
        let r21 = sinX * cosY
        let r22 = cosX * cosY

        // Build the 4x4 matrix: T * R * S
        // Where T = translation, R = rotation, S = scale
        // Combined: each column of R is scaled, then translation is added to column 3.
        let col0 = simd_double4(r00 * srt.scaleX, r10 * srt.scaleX, r20 * srt.scaleX, 0)
        let col1 = simd_double4(r01 * srt.scaleY, r11 * srt.scaleY, r21 * srt.scaleY, 0)
        let col2 = simd_double4(r02 * srt.scaleZ, r12 * srt.scaleZ, r22 * srt.scaleZ, 0)
        let col3 = simd_double4(srt.translateX, srt.translateY, srt.translateZ, 1)

        let matrix = simd_double4x4(columns: (col0, col1, col2, col3))
        return AffineTransform3D(truncating: matrix)
    }

    // MARK: - Event Emission

    private func sendCompletedEvent(session: SpatialDivAnimationSession) {
        guard let scene = scene else { return }
        let values = buildCurrentValuesPayload(session: session, useTo: true)
        let payload = SpatialDivAnimationCompletedPayload(type: "completed", values: values)
        scene.sendWebMsg("\(session.animationId)_completed", payload)
    }

    private func sendCanceledEvent(session: SpatialDivAnimationSession) {
        guard let scene = scene else { return }
        let values = buildCurrentValuesPayload(session: session, useTo: false)
        let payload = SpatialDivAnimationCanceledPayload(type: "canceled", values: values)
        scene.sendWebMsg("\(session.animationId)_canceled", payload)
    }

    private func sendFailedEvent(session: SpatialDivAnimationSession, command: String, reason: String) {
        guard let scene = scene else { return }
        let payload = SpatialDivAnimationFailedPayload(
            type: "failed",
            animationId: session.animationId,
            command: command,
            reason: reason
        )
        scene.sendWebMsg("\(session.animationId)_failed", payload)
    }

    /// Sample animated values at the session's current playback position (for pause ack).
    private func buildSampledValuesPayload(
        session: SpatialDivAnimationSession,
        at timestamp: CFTimeInterval
    ) -> SpatialDivAnimationValuesPayload {
        let progress = session.currentProgress(at: timestamp)

        if let evaluator = session.timelineEvaluator {
            let timeSec = progress * session.duration
            let sample = evaluator.sampleSRTAndOpacity(at: timeSec)
            return buildValuesPayload(
                srt: sample.srt,
                opacity: sample.opacity,
                session: session
            )
        }

        let fromSRT = session.resolvedFromSRT
        let toSRT = session.resolvedToSRT
        let srt = ResolvedSRT(
            translateX: SpatialDivAnimationSession.lerp(fromSRT.translateX, toSRT.translateX, progress),
            translateY: SpatialDivAnimationSession.lerp(fromSRT.translateY, toSRT.translateY, progress),
            translateZ: SpatialDivAnimationSession.lerp(fromSRT.translateZ, toSRT.translateZ, progress),
            rotateX: SpatialDivAnimationSession.lerp(fromSRT.rotateX, toSRT.rotateX, progress),
            rotateY: SpatialDivAnimationSession.lerp(fromSRT.rotateY, toSRT.rotateY, progress),
            rotateZ: SpatialDivAnimationSession.lerp(fromSRT.rotateZ, toSRT.rotateZ, progress),
            scaleX: SpatialDivAnimationSession.lerp(fromSRT.scaleX, toSRT.scaleX, progress),
            scaleY: SpatialDivAnimationSession.lerp(fromSRT.scaleY, toSRT.scaleY, progress),
            scaleZ: SpatialDivAnimationSession.lerp(fromSRT.scaleZ, toSRT.scaleZ, progress)
        )
        let opacity = SpatialDivAnimationSession.lerp(
            session.resolvedFromOpacity,
            session.resolvedToOpacity,
            progress
        )
        return buildValuesPayload(srt: srt, opacity: opacity, session: session)
    }

    private func buildValuesPayload(
        srt: ResolvedSRT,
        opacity: Double,
        session: SpatialDivAnimationSession
    ) -> SpatialDivAnimationValuesPayload {
        var transformPayload: SpatialDivTransformPayload? = nil
        var opacityPayload: Double? = nil

        if session.animatesTransform {
            transformPayload = SpatialDivTransformPayload(
                translate: Vec3Payload(x: srt.translateX, y: srt.translateY, z: srt.translateZ),
                rotate: Vec3Payload(x: srt.rotateX, y: srt.rotateY, z: srt.rotateZ),
                scale: Vec3Payload(x: srt.scaleX, y: srt.scaleY, z: srt.scaleZ)
            )
        }

        if session.animatesOpacity {
            opacityPayload = opacity
        }

        return SpatialDivAnimationValuesPayload(
            transform: transformPayload,
            opacity: opacityPayload
        )
    }

    /// Build the event payload with current animated values.
    /// - Parameter useTo: if true, use the resolved "to" values (for completed); if false, use "from" (for canceled).
    private func buildCurrentValuesPayload(session: SpatialDivAnimationSession, useTo: Bool) -> SpatialDivAnimationValuesPayload {
        var transformPayload: SpatialDivTransformPayload? = nil
        var opacityPayload: Double? = nil
        let timelineSample = session.timelineEvaluator?.sampleSRTAndOpacity(
            at: useTo ? session.duration : 0
        )

        if let sample = timelineSample {
            return buildValuesPayload(
                srt: sample.srt,
                opacity: sample.opacity,
                session: session
            )
        }

        if session.animatesTransform {
            let srt = useTo ? session.resolvedToSRT : session.resolvedFromSRT
            transformPayload = SpatialDivTransformPayload(
                translate: Vec3Payload(x: srt.translateX, y: srt.translateY, z: srt.translateZ),
                rotate: Vec3Payload(x: srt.rotateX, y: srt.rotateY, z: srt.rotateZ),
                scale: Vec3Payload(x: srt.scaleX, y: srt.scaleY, z: srt.scaleZ)
            )
        }

        if session.animatesOpacity {
            opacityPayload = useTo ? session.resolvedToOpacity : session.resolvedFromOpacity
        }

        return SpatialDivAnimationValuesPayload(
            transform: transformPayload,
            opacity: opacityPayload
        )
    }

    // MARK: - Helpers

    private func findElement(_ elementId: String) -> SpatializedElement? {
        return scene?.findSpatialObject(elementId)
    }
}
