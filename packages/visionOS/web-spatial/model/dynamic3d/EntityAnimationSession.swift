import Foundation
import RealityKit

// MARK: - JSB Command

/// Command received from the JS SDK via the bridge.
/// Matches the `commandType = "AnimateTransform"` defined in core-sdk JSBCommand.ts.
struct AnimateTransformCommand: CommandDataProtocol {
    static let commandType: String = "AnimateTransform"

    let animationId: String
    let type: String // "play" | "pause" | "resume" | "stop"

    // Fields present only when type == "play"
    let entityId: String?
    let toTransform: [Double]?
    let fromTransform: [Double]?
    let duration: Double?
    let timingFunction: String?
    let delay: Double?
    let loop: AnimateTransformLoopValue?
}

/// Handles the polymorphic `loop` field which can be `true`, `false`, or `{ reverse: true }`.
enum AnimateTransformLoopValue: Decodable {
    case boolean(Bool)
    case object(AnimateTransformLoopObject)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let boolVal = try? container.decode(Bool.self) {
            self = .boolean(boolVal)
        } else if let objVal = try? container.decode(AnimateTransformLoopObject.self) {
            self = .object(objVal)
        } else {
            self = .boolean(false)
        }
    }

    var isEnabled: Bool {
        switch self {
        case let .boolean(v): return v
        case .object: return true
        }
    }

    var isReverse: Bool {
        switch self {
        case .boolean: return false
        case let .object(obj): return obj.reverse ?? false
        }
    }
}

struct AnimateTransformLoopObject: Decodable {
    let reverse: Bool?
}

// MARK: - Native Animation Session

/// Represents a single animation session on the native side.
/// Tracks state so pause/resume/stop commands can be fulfilled.
class EntityAnimationSession {
    let animationId: String
    let entityId: String

    /// The RealityKit animation playback controller.
    var playbackController: AnimationPlaybackController?

    /// Whether the session has been stopped (terminal state).
    private(set) var isStopped: Bool = false

    /// Whether the session has completed naturally (terminal state).
    private(set) var isCompleted: Bool = false

    /// Whether the session is paused.
    private(set) var isPaused: Bool = false

    /// Timer for delay support — fires play after delay elapses.
    private var delayTimer: DispatchWorkItem?

    /// Remaining delay when paused during delay phase.
    fileprivate(set) var remainingDelay: TimeInterval = 0

    /// Timestamp when delay started (for computing remaining).
    private var delayStartTime: Date?

    /// Original delay value.
    private let originalDelay: TimeInterval

    /// Whether the animation is in the delay phase.
    private(set) var inDelayPhase: Bool = false

    /// The to-transform matrix (column-major, 16 doubles).
    let toTransform: [Double]?

    /// The from-transform matrix (column-major, 16 doubles).
    let fromTransform: [Double]?

    /// Duration in seconds.
    let duration: TimeInterval

    /// Timing function name.
    let timingFunction: String

    /// Loop configuration.
    let loop: AnimateTransformLoopValue?

    init(
        animationId: String,
        entityId: String,
        toTransform: [Double]?,
        fromTransform: [Double]?,
        duration: Double,
        timingFunction: String,
        delay: Double,
        loop: AnimateTransformLoopValue?
    ) {
        self.animationId = animationId
        self.entityId = entityId
        self.toTransform = toTransform
        self.fromTransform = fromTransform
        self.duration = duration
        self.timingFunction = timingFunction
        originalDelay = delay
        remainingDelay = delay
        self.loop = loop
    }

    /// Whether this session has reached a terminal state.
    var isTerminal: Bool {
        return isStopped || isCompleted
    }

    func markCompleted() {
        isCompleted = true
        cancelDelayTimer()
    }

    func markStopped() {
        isStopped = true
        cancelDelayTimer()
    }

    func markPaused() {
        isPaused = true
    }

    func markResumed() {
        isPaused = false
    }

    // MARK: - Delay management

    /// Start the delay phase. When delay elapses, calls `onDelayComplete`.
    func startDelay(onDelayComplete: @escaping () -> Void) {
        guard remainingDelay > 0 else {
            onDelayComplete()
            return
        }
        inDelayPhase = true
        delayStartTime = Date()

        let work = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isTerminal else { return }
            self.inDelayPhase = false
            onDelayComplete()
        }
        delayTimer = work
        DispatchQueue.main.asyncAfter(deadline: .now() + remainingDelay, execute: work)
    }

    /// Pause during delay: cancel timer and record remaining time.
    func pauseDelay() {
        guard inDelayPhase, let startTime = delayStartTime else { return }
        cancelDelayTimer()
        let elapsed = Date().timeIntervalSince(startTime)
        remainingDelay = max(0, remainingDelay - elapsed)
        inDelayPhase = false
    }

    /// Resume delay with the remaining time.
    func resumeDelay(onDelayComplete: @escaping () -> Void) {
        startDelay(onDelayComplete: onDelayComplete)
    }

    private func cancelDelayTimer() {
        delayTimer?.cancel()
        delayTimer = nil
    }

    deinit {
        cancelDelayTimer()
    }
}

// MARK: - Animation Session Manager

/// Manages active animation sessions for entities within a SpatialScene.
/// Each entity can have at most one active session at a time.
class EntityAnimationManager {
    /// Active sessions keyed by animationId.
    private var sessions: [String: EntityAnimationSession] = [:]

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
        sessions.removeValue(forKey: animationId)
    }

    /// Remove all sessions for a given entity (called on entity destroy).
    func removeSessionsForEntity(_ entityId: String) {
        let toRemove = sessions.filter { $0.value.entityId == entityId }
        for (id, session) in toRemove {
            session.markStopped()
            session.playbackController?.stop()
            sessions.removeValue(forKey: id)
        }
    }

    func removeAll() {
        for (_, session) in sessions {
            session.markStopped()
            session.playbackController?.stop()
        }
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

        // Start delay (or play immediately if delay == 0)
        session.startDelay { [weak self] in
            guard let self = self, !session.isTerminal else { return }
            self.startRealityKitAnimation(session: session, entity: entity)
        }
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

        if session.inDelayPhase {
            // Pause during delay: preserve remaining delay time
            session.pauseDelay()
        } else if let controller = session.playbackController {
            controller.pause()
        }

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

        if session.remainingDelay > 0, session.playbackController == nil {
            // Was paused during delay — resume the delay timer
            session.resumeDelay { [weak self] in
                guard let self = self, !session.isTerminal else { return }
                self.startRealityKitAnimation(session: session, entity: entity)
            }
        } else if let controller = session.playbackController {
            controller.resume()
        }

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
            repeatMode: mapRepeatMode(session.loop),
            trimDuration: mapTrimDuration(session.loop, duration: session.duration)
        )

        guard let animResource = try? AnimationResource.generate(with: animation) else {
            sendFailedEvent(session: session, command: "play", reason: "Failed to generate animation resource")
            session.markStopped()
            removeSession(session.animationId)
            return
        }

        // Play the animation
        let controller = entity.playAnimation(animResource, startsPaused: session.isPaused)
        session.playbackController = controller

        // Observe completion for non-looping animations
        let isLooping = session.loop?.isEnabled ?? false
        if !isLooping {
            // Use a subscription to listen for animation end
            observeAnimationCompletion(session: session, entity: entity)
        }
    }

    private func observeAnimationCompletion(session: EntityAnimationSession, entity: SpatialEntity) {
        // Poll for animation completion since RealityKit's animation events
        // require a scene subscription. We use a timer-based check.
        let checkInterval: TimeInterval = 0.05 // 50ms
        let totalDuration = session.duration

        /// Start a recurring check
        func scheduleCheck() {
            DispatchQueue.main.asyncAfter(deadline: .now() + checkInterval) { [weak self, weak entity] in
                guard let self = self, let entity = entity else { return }
                guard !session.isTerminal else { return }

                if let controller = session.playbackController {
                    // Check if the animation is still playing
                    if !controller.isPlaying, !session.isPaused {
                        // Animation completed naturally
                        session.markCompleted()
                        self.sendCompletedEvent(session: session, entity: entity)
                        self.removeSession(session.animationId)
                        return
                    }
                }

                // Continue polling if not terminal
                if !session.isTerminal {
                    scheduleCheck()
                }
            }
        }

        scheduleCheck()
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

    private func mapRepeatMode(_ loop: AnimateTransformLoopValue?) -> AnimationRepeatMode {
        guard let loop = loop, loop.isEnabled else {
            return .none
        }
        if loop.isReverse {
            return .autoReverse
        }
        return .repeat
    }

    /// For looping animations we pass nil (infinite). For non-looping, pass nil (use animation's own duration).
    private func mapTrimDuration(_ loop: AnimateTransformLoopValue?, duration: TimeInterval) -> TimeInterval? {
        guard let loop = loop, loop.isEnabled else {
            return nil
        }
        // For looping, return nil to let it loop indefinitely
        return nil
    }
}

// MARK: - Event Payloads

struct AnimationCompletedPayload: Encodable {
    let type: String
    let transform: [Double]
}

struct AnimationStoppedPayload: Encodable {
    let type: String
    let transform: [Double]
}

struct AnimationFailedPayload: Encodable {
    let type: String
    let animationId: String
    let command: String
    let reason: String
}
