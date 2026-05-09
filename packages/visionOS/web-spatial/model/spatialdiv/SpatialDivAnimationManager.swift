import Foundation
import QuartzCore

// MARK: - SpatialDiv Animation Manager

/// Manages active SpatialDiv animation sessions.
/// Uses a single shared CADisplayLink to drive all animations at display refresh rate (90Hz on visionOS).
/// Properties are interpolated per-frame and applied directly to SpatializedElement @Observable vars,
/// which triggers SwiftUI view updates automatically.
class SpatialDivAnimationManager {
    /// Active sessions keyed by animationId.
    private var sessions: [String: SpatialDivAnimationSession] = [:]

    /// The shared CADisplayLink for frame driving.
    private var displayLink: CADisplayLink?

    /// Weak reference to the scene for sending events back to JS and looking up elements.
    weak var scene: SpatialScene?

    init(scene: SpatialScene? = nil) {
        self.scene = scene
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

            // Check completion
            if session.isAnimationComplete(at: timestamp) {
                // Apply final values
                applyFinalValues(session: session)
                session.markCompleted()
                sendCompletedEvent(session: session)
                completedIds.append(animationId)
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
        command: AnimateSpatialized2DElementCommand,
        element: SpatializedElement,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let elementId = command.elementId else {
            resolve(.failure(JsbError(code: .CommandError, message: "AnimateSpatialized2DElement play: elementId is required")))
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
            speed: command.playbackRate ?? 1.0
        )

        // Snapshot current element values as resolvedFrom
        let snapshotFrom = SpatialDivAnimationTarget(
            width: command.from?.width ?? element.width,
            height: command.from?.height ?? element.height,
            depth: command.from?.depth ?? element.depth,
            opacity: command.from?.opacity ?? element.opacity,
            backOffset: command.from?.backOffset ?? element.backOffset
        )
        session.resolvedFrom = snapshotFrom

        // If `from` values are provided, apply them immediately to the element
        if let from = command.from {
            if let w = from.width { element.width = w }
            if let h = from.height { element.height = h }
            if let d = from.depth { element.depth = d }
            if let o = from.opacity { element.opacity = o }
            if let b = from.backOffset { element.backOffset = b }
        }

        addSession(session)

        // Acknowledge the play command immediately so the JS side can set up listeners
        resolve(.success(nil))
    }

    // MARK: - Pause

    func handlePause(
        command: AnimateSpatialized2DElementCommand,
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

        session.markPaused()
        resolve(.success(nil))
    }

    // MARK: - Resume

    func handleResume(
        command: AnimateSpatialized2DElementCommand,
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
        command: AnimateSpatialized2DElementCommand,
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

        // Cancel restores element to the from values (same as Web Animation API cancel semantics).
        if let from = session.resolvedFrom {
            if let w = from.width, session.to?.width != nil { element.width = w }
            if let h = from.height, session.to?.height != nil { element.height = h }
            if let d = from.depth, session.to?.depth != nil { element.depth = d }
            if let o = from.opacity, session.to?.opacity != nil { element.opacity = o }
            if let b = from.backOffset, session.to?.backOffset != nil { element.backOffset = b }
        }

        sendCanceledEvent(session: session)
        removeSession(command.animationId)

        resolve(.success(nil))
    }

    // MARK: - Interpolation Application

    private func applyInterpolatedValues(session: SpatialDivAnimationSession, progress: Double) {
        guard let element = findElement(session.elementId) else { return }
        guard let from = session.resolvedFrom, let to = session.to else { return }

        if let toWidth = to.width, let fromWidth = from.width {
            element.width = SpatialDivAnimationSession.lerp(fromWidth, toWidth, progress)
        }
        if let toHeight = to.height, let fromHeight = from.height {
            element.height = SpatialDivAnimationSession.lerp(fromHeight, toHeight, progress)
        }
        if let toDepth = to.depth, let fromDepth = from.depth {
            element.depth = SpatialDivAnimationSession.lerp(fromDepth, toDepth, progress)
        }
        if let toOpacity = to.opacity, let fromOpacity = from.opacity {
            element.opacity = SpatialDivAnimationSession.lerp(fromOpacity, toOpacity, progress)
        }
        if let toBackOffset = to.backOffset, let fromBackOffset = from.backOffset {
            element.backOffset = SpatialDivAnimationSession.lerp(fromBackOffset, toBackOffset, progress)
        }
    }

    private func applyFinalValues(session: SpatialDivAnimationSession) {
        guard let element = findElement(session.elementId) else { return }
        guard let to = session.to else { return }

        if let w = to.width { element.width = w }
        if let h = to.height { element.height = h }
        if let d = to.depth { element.depth = d }
        if let o = to.opacity { element.opacity = o }
        if let b = to.backOffset { element.backOffset = b }
    }

    // MARK: - Event Emission

    private func sendCompletedEvent(session: SpatialDivAnimationSession) {
        guard let scene = scene else { return }
        let element = findElement(session.elementId)
        let values = SpatialDivAnimationValuesPayload(
            width: element?.width,
            height: element?.height,
            depth: element?.depth,
            opacity: element?.opacity,
            backOffset: element?.backOffset
        )
        let payload = SpatialDivAnimationCompletedPayload(type: "completed", values: values)
        scene.sendWebMsg("\(session.animationId)_completed", payload)
    }

    private func sendCanceledEvent(session: SpatialDivAnimationSession) {
        guard let scene = scene else { return }
        let element = findElement(session.elementId)
        let values = SpatialDivAnimationValuesPayload(
            width: element?.width,
            height: element?.height,
            depth: element?.depth,
            opacity: element?.opacity,
            backOffset: element?.backOffset
        )
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

    // MARK: - Helpers

    private func findElement(_ elementId: String) -> SpatializedElement? {
        return scene?.findSpatialObject(elementId)
    }
}
