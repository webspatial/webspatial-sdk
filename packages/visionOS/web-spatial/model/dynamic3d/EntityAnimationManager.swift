import Combine
import Foundation
import RealityKit

// MARK: - Animation Session Manager

/// Manages active animation sessions for entities within a SpatialScene.
/// Each entity can have at most one active session at a time.
class EntityAnimationManager {
    /// Active sessions keyed by animationId.
    private var sessions: [String: EntityAnimationSession] = [:]

    /// Active scene event subscriptions keyed by animationId.
    private var completionSubscriptions: [String: any Cancellable] = [:]

    /// Weak reference to the scene for sending events back to JS.
    weak var scene: SpatialScene?

    init(scene: SpatialScene? = nil) {
        self.scene = scene
    }

    func getSession(_ animationId: String) -> EntityAnimationSession? {
        return sessions[animationId]
    }

    func addSession(_ session: EntityAnimationSession) {
        sessions[session.animationId] = session
    }

    func removeSession(_ animationId: String) {
        completionSubscriptions.removeValue(forKey: animationId)
        sessions.removeValue(forKey: animationId)
    }

    /// Remove all sessions for a given entity (called on entity destroy).
    func removeSessionsForEntity(_ entityId: String) {
        let toRemove = sessions.filter { $0.value.entityId == entityId }
        for (id, session) in toRemove {
            session.markStopped()
            session.playbackController?.stop()
            completionSubscriptions.removeValue(forKey: id)
            sessions.removeValue(forKey: id)
        }
    }

    func removeAll() {
        for (_, session) in sessions {
            session.markStopped()
            session.playbackController?.stop()
        }
        completionSubscriptions.removeAll()
        sessions.removeAll()
    }

    // MARK: - Play

    func handlePlay(
        command: AnimateTransformCommand,
        entity: SpatialEntity,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        let session = EntityAnimationSession(
            animationId: command.animationId,
            entityId: entity.spatialId,
            toTransform: command.toTransform,
            fromTransform: command.fromTransform,
            duration: command.duration ?? 0.3,
            timingFunction: command.timingFunction ?? "easeInOut",
            delay: command.delay ?? 0,
            loop: command.loop
        )
        addSession(session)

        // Acknowledge the play command immediately so the JS side can set up listeners
        resolve(.success(nil))

        // Start the RealityKit animation immediately; delay is handled natively
        // by AnimationView's `delay` parameter.
        startRealityKitAnimation(session: session, entity: entity)
    }

    // MARK: - Pause

    func handlePause(
        command: AnimateTransformCommand,
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

        // RealityKit's playback controller handles pause correctly even during
        // the delay phase (the animation simply won't advance until resumed).
        session.playbackController?.pause()

        resolve(.success(nil))
    }

    // MARK: - Resume

    func handleResume(
        command: AnimateTransformCommand,
        entity: SpatialEntity,
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

        // Resume playback — works correctly whether paused during delay or active phase.
        session.playbackController?.resume()

        resolve(.success(nil))
    }

    // MARK: - Stop

    func handleStop(
        command: AnimateTransformCommand,
        entity: SpatialEntity,
        resolve: @escaping JSBManager.ResolveHandler<Encodable>
    ) {
        guard let session = getSession(command.animationId) else {
            resolve(.failure(JsbError(code: .CommandError, message: "Animation session \(command.animationId) not found")))
            return
        }

        guard !session.isTerminal else {
            // Already terminal — acknowledge silently
            resolve(.success(nil))
            return
        }

        session.markStopped()
        session.playbackController?.stop()

        // Send stopped event to JS with current transform
        sendStoppedEvent(session: session, entity: entity)
        removeSession(command.animationId)

        resolve(.success(nil))
    }

    // MARK: - RealityKit Animation

    private func startRealityKitAnimation(session: EntityAnimationSession, entity: SpatialEntity) {
        guard !session.isTerminal else { return }

        // Build to-transform as float4x4
        guard let toArray = session.toTransform, toArray.count == 16 else {
            sendFailedEvent(session: session, command: "play", reason: "Missing or invalid toTransform")
            session.markStopped()
            removeSession(session.animationId)
            return
        }

        let toMatrix = arrayToFloat4x4(toArray)

        // If fromTransform is provided, set entity transform to it before animating
        if let fromArray = session.fromTransform, fromArray.count == 16 {
            let fromMatrix = arrayToFloat4x4(fromArray)
            entity.transform.matrix = fromMatrix
        }

        // Map timing function to RealityKit animation timing
        let timingFunction = mapTimingFunction(session.timingFunction)

        // Build the animation
        let toTransform = Transform(matrix: toMatrix)
        let animation = FromToByAnimation<Transform>(
            to: toTransform,
            duration: session.duration,
            timing: timingFunction,
            bindTarget: .transform,
            repeatMode: mapRepeatMode(session.loop)
        )

        // Wrap with AnimationView to apply the native delay.
        // RealityKit handles the delay internally — no manual timer needed.
        let animationView = AnimationView(source: animation, delay: session.delay)

        guard let animResource = try? AnimationResource.generate(with: animationView) else {
            sendFailedEvent(session: session, command: "play", reason: "Failed to generate animation resource")
            session.markStopped()
            removeSession(session.animationId)
            return
        }

        // Play the animation
        let controller = entity.playAnimation(animResource, startsPaused: session.isPaused)
        session.playbackController = controller

        // Observe completion for non-looping animations using Scene event subscription
        let isLooping = session.loop?.isEnabled ?? false
        if !isLooping {
            observeAnimationCompletion(session: session, entity: entity)
        }
    }

    /// Subscribe to RealityKit's `AnimationEvents.PlaybackCompleted` on the entity
    /// to detect natural animation completion without timer polling.
    private func observeAnimationCompletion(session: EntityAnimationSession, entity: SpatialEntity) {
        guard let rkScene = entity.scene else {
            // Fallback: entity not yet in a RealityKit scene — this should not
            // happen in normal flow since play is called after entity is added.
            sendFailedEvent(session: session, command: "play", reason: "Entity has no RealityKit scene for event subscription")
            session.markStopped()
            removeSession(session.animationId)
            return
        }

        let subscription = rkScene.subscribe(to: AnimationEvents.PlaybackCompleted.self, on: entity) { [weak self, weak entity] _ in
            guard let self = self, let entity = entity else { return }
            guard !session.isTerminal else { return }

            // Animation completed naturally
            session.markCompleted()
            self.sendCompletedEvent(session: session, entity: entity)
            self.removeSession(session.animationId)
        }

        completionSubscriptions[session.animationId] = subscription
    }

    // MARK: - Event Emission

    /// Send the `{animationId}_completed` event to JS with the entity's current transform.
    private func sendCompletedEvent(session: EntityAnimationSession, entity: SpatialEntity) {
        guard let scene = scene else { return }
        let transform = float4x4ToArray(entity.transform.matrix)
        let payload = AnimationCompletedPayload(type: "completed", transform: transform)
        scene.sendWebMsg("\(session.animationId)_completed", payload)
    }

    /// Send the `{animationId}_stopped` event to JS with the entity's current transform.
    private func sendStoppedEvent(session: EntityAnimationSession, entity: SpatialEntity) {
        guard let scene = scene else { return }
        let transform = float4x4ToArray(entity.transform.matrix)
        let payload = AnimationStoppedPayload(type: "stopped", transform: transform)
        scene.sendWebMsg("\(session.animationId)_stopped", payload)
    }

    /// Send the `{animationId}_failed` event to JS.
    private func sendFailedEvent(session: EntityAnimationSession, command: String, reason: String) {
        guard let scene = scene else { return }
        let payload = AnimationFailedPayload(
            type: "failed",
            animationId: session.animationId,
            command: command,
            reason: reason
        )
        scene.sendWebMsg("\(session.animationId)_failed", payload)
    }

    // MARK: - Helpers

    private func arrayToFloat4x4(_ array: [Double]) -> float4x4 {
        // Column-major order matching DOMMatrix.toFloat64Array()
        return float4x4(
            SIMD4<Float>(Float(array[0]), Float(array[1]), Float(array[2]), Float(array[3])),
            SIMD4<Float>(Float(array[4]), Float(array[5]), Float(array[6]), Float(array[7])),
            SIMD4<Float>(Float(array[8]), Float(array[9]), Float(array[10]), Float(array[11])),
            SIMD4<Float>(Float(array[12]), Float(array[13]), Float(array[14]), Float(array[15]))
        )
    }

    private func float4x4ToArray(_ matrix: float4x4) -> [Double] {
        // Column-major order
        let c0 = matrix.columns.0
        let c1 = matrix.columns.1
        let c2 = matrix.columns.2
        let c3 = matrix.columns.3
        return [
            Double(c0.x), Double(c0.y), Double(c0.z), Double(c0.w),
            Double(c1.x), Double(c1.y), Double(c1.z), Double(c1.w),
            Double(c2.x), Double(c2.y), Double(c2.z), Double(c2.w),
            Double(c3.x), Double(c3.y), Double(c3.z), Double(c3.w),
        ]
    }

    private func mapTimingFunction(_ name: String) -> AnimationTimingFunction {
        switch name {
        case "linear": return .linear
        case "easeIn": return .easeIn
        case "easeOut": return .easeOut
        case "easeInOut": return .easeInOut
        default: return .easeInOut
        }
    }

    /// Maps the JS `loop` config to RealityKit repeat mode.
    ///
    /// OpenSpec contract (task 4.3 verified):
    /// - `loop: true` -> reset loop: plays to to, instantly resets to from, repeats.
    ///   RealityKit .repeat replays the baked animation clip from the start -- matches spec.
    ///   When from is omitted, the implicit start is the entity transform at play() time,
    ///   baked into the AnimationResource, so it is NOT re-snapshotted each loop.
    /// - `loop: { reverse: true }` -> reverse loop: smoothly plays back from to to from.
    ///   RealityKit .autoReverse does exactly this.
    /// - No loop -> .none: plays once, fires PlaybackCompleted.
    private func mapRepeatMode(_ loop: AnimateTransformLoopValue?) -> AnimationRepeatMode {
        guard let loop = loop, loop.isEnabled else {
            return .none
        }
        if loop.isReverse {
            return .autoReverse
        }
        return .repeat
    }
}
