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

    /// The to-transform matrix (column-major, 16 doubles).
    let toTransform: [Double]?

    /// The from-transform matrix (column-major, 16 doubles).
    let fromTransform: [Double]?

    /// Duration in seconds.
    let duration: TimeInterval

    /// Delay in seconds before playback starts.
    let delay: TimeInterval

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
        self.delay = delay
        self.timingFunction = timingFunction
        self.loop = loop
    }

    /// Whether this session has reached a terminal state.
    var isTerminal: Bool {
        return isStopped || isCompleted
    }

    func markCompleted() {
        isCompleted = true
    }

    func markStopped() {
        isStopped = true
    }

    func markPaused() {
        isPaused = true
    }

    func markResumed() {
        isPaused = false
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
