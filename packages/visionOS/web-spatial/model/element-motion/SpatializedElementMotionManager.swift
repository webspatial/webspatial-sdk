import Foundation
import QuartzCore
import Spatial

// MARK: - Spatialized element motion (2D + Static3D + Dynamic3D)

/// Manages active 2D / Static3D / Dynamic3D element motion sessions via `SpatializedElementMotionTransformAdapter`.
/// Uses a single shared CADisplayLink to drive all animations at display refresh rate (90Hz on visionOS).
/// Properties are interpolated per-frame and applied directly to SpatializedElement @Observable vars,
/// which triggers SwiftUI view updates automatically.
///
/// Per spec, only `transform` (translate/rotate/scale) and `opacity` are animatable.
class SpatializedElementMotionManager: NSObject {
    /// Active sessions keyed by animationId.
    private var sessions: [String: SpatializedElementMotionSession] = [:]

    /// The shared CADisplayLink for frame driving.
    private var displayLink: CADisplayLink?

    /// Weak reference to the scene for sending events back to JS and looking up elements.
    weak var scene: SpatialScene?

    init(scene: SpatialScene? = nil) {
        self.scene = scene
        super.init()
    }

    // MARK: - Session Management

    func getSession(_ animationId: String) -> SpatializedElementMotionSession? {
        return sessions[animationId]
    }

    private func addSession(_ session: SpatializedElementMotionSession) {
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
        command: AnimateSpatializedElementMotionCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let timeline = command.timeline else {
            resolve(.failure(JsbError(code: .CommandError, message: "Spatialized element motion play: timeline is required")))
            return
        }

        let elementId = element.spatialId
        let transformAdapter = command.transformAdapter
        let baselineTransform = Self.decomposeTransform(from: transformAdapter.currentAffineTransform(for: element))
        let baselineOpacity = transformAdapter.baselineOpacity(for: element)
        let sampler = SpatializedElementMotionTimelineSampler(
            timeline: timeline,
            baselineTransform: baselineTransform,
            baselineOpacity: baselineOpacity
        )
        let session = SpatializedElementMotionSession(
            animationId: command.animationId,
            elementId: elementId,
            timelineSampler: sampler,
            duration: timeline.duration,
            timingFunction: "linear",
            delay: timeline.delay ?? 0,
            speed: timeline.playbackRate ?? 1.0,
            loopConfig: timeline.loop ?? .none
        )

        session.animatesTransform = sampler.animatesTransform
        session.animatesOpacity = sampler.animatesOpacity

        let start = sampler.sampleTransformAndOpacity(at: 0)
        session.timelineStartTransform = start.transform
        session.timelineStartOpacity = start.opacity

        session.transformAdapter = transformAdapter
        if session.animatesTransform {
            transformAdapter.applyAffine(Self.composeTransform(start.transform), to: element)
        }
        if session.animatesOpacity {
            transformAdapter.applyOpacity(start.opacity, to: element)
        }

        addSession(session)
        resolve(.success(nil))
    }

    // MARK: - Pause

    func handlePause(
        command: AnimateSpatializedElementMotionCommand,
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
        let payload = SpatializedMotionPausedPayload(type: "paused", values: values)
        resolve(.success(payload))
    }

    // MARK: - Resume

    func handleResume(
        command: AnimateSpatializedElementMotionCommand,
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

    // MARK: - Reset

    func handleReset(
        command: AnimateSpatializedElementMotionCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        if let session = getSession(command.animationId) {
            let values = buildCurrentValuesPayload(session: session, useTo: false)
            session.markCanceled()
            applyTerminalValues(session: session, useTo: false)
            removeSession(command.animationId)
            resolve(.success(values))
            return
        }

        guard let values = applyTerminalSeek(command: command, element: element, useTo: false) else {
            resolve(.success(nil))
            return
        }

        resolve(.success(values))
    }

    // MARK: - Stop

    func handleStop(
        command: AnimateSpatializedElementMotionCommand,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let session = getSession(command.animationId) else {
            resolve(.success(nil))
            return
        }

        let values = buildSampledValuesPayload(
            session: session,
            at: CACurrentMediaTime()
        )
        session.markCanceled()
        removeSession(command.animationId)
        resolve(.success(values))
    }

    // MARK: - Finish

    func handleFinish(
        command: AnimateSpatializedElementMotionCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        if let session = getSession(command.animationId) {
            let values = buildCurrentValuesPayload(session: session, useTo: true)
            session.markCompleted()
            applyTerminalValues(session: session, useTo: true)
            removeSession(command.animationId)
            resolve(.success(values))
            return
        }

        guard let values = applyTerminalSeek(command: command, element: element, useTo: true) else {
            resolve(.success(nil))
            return
        }

        resolve(.success(values))
    }

    // MARK: - Cancel

    func handleCancel(
        command: AnimateSpatializedElementMotionCommand,
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
        let adapter = session.transformAdapter
        if session.animatesTransform {
            adapter.applyAffine(Self.composeTransform(session.timelineStartTransform), to: element)
        }
        if session.animatesOpacity {
            adapter.applyOpacity(session.timelineStartOpacity, to: element)
        }

        sendCanceledEvent(session: session)
        removeSession(command.animationId)

        resolve(.success(nil))
    }

    // MARK: - Interpolation Application

    private func applyInterpolatedValues(session: SpatializedElementMotionSession, progress: Double) {
        guard let element = findElement(session.elementId) else { return }
        let adapter = session.transformAdapter
        let timeSec = progress * session.duration
        let sample = session.timelineSampler.sampleTransformAndOpacity(at: timeSec)
        if session.animatesTransform {
            adapter.applyAffine(Self.composeTransform(sample.transform), to: element)
        }
        if session.animatesOpacity {
            adapter.applyOpacity(sample.opacity, to: element)
        }
    }

    private func applyFinalValues(session: SpatializedElementMotionSession) {
        guard let element = findElement(session.elementId) else { return }
        let adapter = session.transformAdapter
        let sample = session.timelineSampler.sampleTransformAndOpacity(at: session.duration)
        if session.animatesTransform {
            adapter.applyAffine(Self.composeTransform(sample.transform), to: element)
        }
        if session.animatesOpacity {
            adapter.applyOpacity(sample.opacity, to: element)
        }
    }

    /// Apply the "from" values to the element (used in reset loop snap-back).
    private func applyFromValues(session: SpatializedElementMotionSession) {
        guard let element = findElement(session.elementId) else { return }
        let adapter = session.transformAdapter
        if session.animatesTransform {
            adapter.applyAffine(Self.composeTransform(session.timelineStartTransform), to: element)
        }
        if session.animatesOpacity {
            adapter.applyOpacity(session.timelineStartOpacity, to: element)
        }
    }

    // MARK: - Transform Decomposition / Composition

    /// Decompose an AffineTransform3D into separate translate, rotate (degrees), scale components.
    /// Assumes composition order: translate → rotate → scale.
    static func decomposeTransform(from transform: AffineTransform3D) -> SpatializedMotionTransformComponents {
        // If identity, return identity transform components
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
            return SpatializedMotionTransformComponents(
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

        return SpatializedMotionTransformComponents(
            translateX: tx, translateY: ty, translateZ: tz,
            rotateX: rotX * rad2deg,
            rotateY: rotY * rad2deg,
            rotateZ: rotZ * rad2deg,
            scaleX: sx, scaleY: sy, scaleZ: sz
        )
    }

    /// Compose an AffineTransform3D from transform components.
    /// Composition order (spec-mandated): translate → rotate → scale.
    /// Rotation order: rotateX → rotateY → rotateZ (matching CSS transform function order).
    static func composeTransform(_ transform: SpatializedMotionTransformComponents) -> AffineTransform3D {
        let deg2rad = Double.pi / 180.0

        let cosX = cos(transform.rotateX * deg2rad)
        let sinX = sin(transform.rotateX * deg2rad)
        let cosY = cos(transform.rotateY * deg2rad)
        let sinY = sin(transform.rotateY * deg2rad)
        let cosZ = cos(transform.rotateZ * deg2rad)
        let sinZ = sin(transform.rotateZ * deg2rad)

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
        let col0 = simd_double4(r00 * transform.scaleX, r10 * transform.scaleX, r20 * transform.scaleX, 0)
        let col1 = simd_double4(r01 * transform.scaleY, r11 * transform.scaleY, r21 * transform.scaleY, 0)
        let col2 = simd_double4(r02 * transform.scaleZ, r12 * transform.scaleZ, r22 * transform.scaleZ, 0)
        let col3 = simd_double4(transform.translateX, transform.translateY, transform.translateZ, 1)

        let matrix = simd_double4x4(columns: (col0, col1, col2, col3))
        return AffineTransform3D(truncating: matrix)
    }

    // MARK: - Event Emission

    private func sendCompletedEvent(session: SpatializedElementMotionSession) {
        guard let scene = scene else { return }
        let values = buildCurrentValuesPayload(session: session, useTo: true)
        let payload = SpatializedMotionCompletedPayload(type: "completed", values: values)
        scene.sendWebMsg("\(session.animationId)_completed", payload)
    }

    private func sendCanceledEvent(session: SpatializedElementMotionSession) {
        guard let scene = scene else { return }
        let values = buildCurrentValuesPayload(session: session, useTo: false)
        let payload = SpatializedMotionCanceledPayload(type: "canceled", values: values)
        scene.sendWebMsg("\(session.animationId)_canceled", payload)
    }

    private func sendFailedEvent(session: SpatializedElementMotionSession, command: String, reason: String) {
        guard let scene = scene else { return }
        let payload = SpatializedMotionFailedPayload(
            type: "failed",
            animationId: session.animationId,
            command: command,
            reason: reason
        )
        scene.sendWebMsg("\(session.animationId)_failed", payload)
    }

    /// Sample animated values at the session's current playback position (for pause ack).
    private func buildSampledValuesPayload(
        session: SpatializedElementMotionSession,
        at timestamp: CFTimeInterval
    ) -> SpatializedMotionValuesPayload {
        let progress = session.currentProgress(at: timestamp)
        let sample = session.timelineSampler.sampleTransformAndOpacity(
            at: progress * session.duration
        )
        return buildValuesPayload(
            transform: sample.transform,
            opacity: sample.opacity,
            animatesTransform: session.animatesTransform,
            animatesOpacity: session.animatesOpacity
        )
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

    /// Build the event payload with current animated values.
    /// - Parameter useTo: if true, use the resolved "to" values (for completed); if false, use "from" (for canceled).
    private func buildCurrentValuesPayload(session: SpatializedElementMotionSession, useTo: Bool) -> SpatializedMotionValuesPayload {
        let sample = session.timelineSampler.sampleTransformAndOpacity(
            at: useTo ? session.duration : 0
        )
        return buildValuesPayload(
            transform: sample.transform,
            opacity: sample.opacity,
            animatesTransform: session.animatesTransform,
            animatesOpacity: session.animatesOpacity
        )
    }

    private func applyTerminalValues(session: SpatializedElementMotionSession, useTo: Bool) {
        guard let element = findElement(session.elementId) else { return }
        let adapter = session.transformAdapter
        let sample = session.timelineSampler.sampleTransformAndOpacity(
            at: useTo ? session.duration : 0
        )
        if session.animatesTransform {
            adapter.applyAffine(Self.composeTransform(sample.transform), to: element)
        }
        if session.animatesOpacity {
            adapter.applyOpacity(sample.opacity, to: element)
        }
    }

    private func applyTerminalSeek(
        command: AnimateSpatializedElementMotionCommand,
        element: SpatializedElement,
        useTo: Bool
    ) -> SpatializedMotionValuesPayload? {
        guard let timeline = command.timeline, command.elementId != nil else {
            return nil
        }

        let adapter = command.transformAdapter
        let baselineTransform = Self.decomposeTransform(from: adapter.currentAffineTransform(for: element))
        let baselineOpacity = adapter.baselineOpacity(for: element)
        let sampler = SpatializedElementMotionTimelineSampler(
            timeline: timeline,
            baselineTransform: baselineTransform,
            baselineOpacity: baselineOpacity
        )
        let sample = sampler.sampleTransformAndOpacity(at: useTo ? sampler.duration : 0)
        if sampler.animatesTransform {
            adapter.applyAffine(Self.composeTransform(sample.transform), to: element)
        }
        if sampler.animatesOpacity {
            adapter.applyOpacity(sample.opacity, to: element)
        }
        return buildValuesPayload(
            transform: sample.transform,
            opacity: sample.opacity,
            animatesTransform: sampler.animatesTransform,
            animatesOpacity: sampler.animatesOpacity
        )
    }

    // MARK: - Helpers

    private func findElement(_ elementId: String) -> SpatializedElement? {
        return scene?.findSpatialObject(elementId)
    }
}
