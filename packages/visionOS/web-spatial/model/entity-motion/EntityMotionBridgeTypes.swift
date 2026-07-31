import Foundation

/// Supported per-segment easing functions for entity motion.
enum EntityMotionTimingFunction: String, Codable, CaseIterable, Equatable {
    /// Applies constant-speed interpolation.
    case linear
    /// Accelerates from rest.
    case easeIn
    /// Decelerates to rest.
    case easeOut
    /// Accelerates and then decelerates.
    case easeInOut
}

/// Exact canonical loop shape decoded from the JavaScript wire format.
enum EntityMotionLoopPayload: Equatable {
    /// Represents the boolean `false` wire shape.
    case disabled
    /// Represents the boolean `true` wire shape.
    case enabled
    /// Represents the object wire shape and preserves optional `reverse`.
    case options(reverse: Bool?)

    /// Runtime loop behavior independent from the preserved wire shape.
    var mode: EntityMotionLoopMode {
        switch self {
        case .disabled:
            .none
        case .enabled, .options(reverse: nil), .options(reverse: false):
            .reset
        case .options(reverse: true):
            .reverse
        }
    }
}

/// Runtime loop behavior used by native playback.
enum EntityMotionLoopMode: Equatable {
    /// Plays once.
    case none
    /// Repeats from the beginning.
    case reset
    /// Repeats in alternating directions.
    case reverse
}

extension EntityMotionLoopPayload: Codable {
    /// Decodes `false`, `true`, or the canonical loop option object.
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let enabled = try? container.decode(Bool.self) {
            self = enabled ? .enabled : .disabled
            return
        }

        let options = try container.decode(Options.self)
        self = .options(reverse: options.reverse)
    }

    /// Encodes the preserved canonical wire representation.
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .disabled:
            try container.encode(false)
        case .enabled:
            try container.encode(true)
        case let .options(reverse):
            try container.encode(Options(reverse: reverse))
        }
    }

    /// Object-form loop options.
    private struct Options: Codable {
        /// Alternates playback direction between iterations.
        let reverse: Bool?

        /// Creates object-form loop options.
        init(reverse: Bool? = nil) {
            self.reverse = reverse
        }

        /// Decodes only the closed `reverse` object key.
        init(from decoder: Decoder) throws {
            let allKeys = try decoder.container(keyedBy: AnyCodingKey.self).allKeys
            guard allKeys.allSatisfy({ $0.stringValue == CodingKeys.reverse.rawValue }) else {
                throw DecodingError.dataCorrupted(
                    .init(
                        codingPath: decoder.codingPath,
                        debugDescription: "Loop options contain an unknown key."
                    )
                )
            }

            let container = try decoder.container(keyedBy: CodingKeys.self)
            reverse = container.contains(.reverse)
                ? try container.decode(Bool.self, forKey: .reverse)
                : nil
        }

        /// Encodes the preserved object-form `reverse` presence.
        func encode(to encoder: Encoder) throws {
            var container = encoder.container(keyedBy: CodingKeys.self)
            if let reverse {
                try container.encode(reverse, forKey: .reverse)
            }
        }

        /// Closed object-form loop keys.
        private enum CodingKeys: String, CodingKey {
            /// Alternating-direction option.
            case reverse
        }

        /// Coding key used only to detect unsupported object keys.
        private struct AnyCodingKey: CodingKey {
            /// String key value.
            let stringValue: String
            /// Integer key value.
            let intValue: Int?

            /// Creates a string coding key.
            init?(stringValue: String) {
                self.stringValue = stringValue
                intValue = nil
            }

            /// Creates an integer coding key.
            init?(intValue: Int) {
                stringValue = String(intValue)
                self.intValue = intValue
            }
        }
    }
}

/// Sparse or complete three-axis values transported over JSB.
struct EntityMotionVector3Payload: Codable, Equatable {
    /// X-axis value.
    let x: Double?
    /// Y-axis value.
    let y: Double?
    /// Z-axis value.
    let z: Double?
}

/// Sparse or complete transform values transported over JSB.
struct EntityMotionTransformPayload: Codable, Equatable {
    /// Position values in meters.
    let position: EntityMotionVector3Payload?
    /// Euler rotation values in degrees.
    let rotation: EntityMotionVector3Payload?
    /// Per-axis scale values.
    let scale: EntityMotionVector3Payload?
}

/// Complete three-axis values transported in native confirmations.
struct EntityMotionConfirmedVector3Payload: Codable, Equatable {
    /// X-axis value.
    let x: Double
    /// Y-axis value.
    let y: Double
    /// Z-axis value.
    let z: Double
}

/// Complete nine-axis transform transported in native confirmations.
struct EntityMotionConfirmedTransformPayload: Codable, Equatable {
    /// Complete position in meters.
    let position: EntityMotionConfirmedVector3Payload
    /// Complete Euler rotation in degrees.
    let rotation: EntityMotionConfirmedVector3Payload
    /// Complete per-axis scale.
    let scale: EntityMotionConfirmedVector3Payload
}

/// One scalar keyframe in an entity-motion track.
struct EntityMotionKeyframePayload: Codable, Equatable {
    /// Timeline time in seconds.
    let at: Double
    /// Scalar value at the keyframe.
    let value: Double
    /// Optional easing override for the following segment.
    let timingFunction: EntityMotionTimingFunction?
}

/// One scalar property track in an entity-motion timeline.
struct EntityMotionTrackPayload: Codable, Equatable {
    /// Closed transform property name.
    let property: String
    /// Ordered scalar keyframes.
    let keyframes: [EntityMotionKeyframePayload]
    /// Default easing for this track.
    let timingFunction: EntityMotionTimingFunction
}

/// Canonical entity-motion timeline transported over JSB.
struct EntityMotionTimelinePayload: Codable, Equatable {
    /// Timeline duration in seconds.
    let duration: Double
    /// Start delay in seconds.
    let delay: Double
    /// Positive playback-speed multiplier.
    let playbackRate: Double
    /// Loop behavior.
    let loop: EntityMotionLoopPayload
    /// Scalar transform tracks.
    let tracks: [EntityMotionTrackPayload]
}

/// Request payload for `CreateEntityAnimation`.
struct CreateEntityAnimationCommand: CommandDataProtocol, Codable, Equatable {
    /// JSB command name.
    static let commandType = "CreateEntityAnimation"
    /// Spatial entity id.
    let id: String
    /// Canonical motion timeline.
    let timeline: EntityMotionTimelinePayload
}

/// Successful `CreateEntityAnimation` reply.
struct CreateEntityAnimationResult: Codable, Equatable {
    /// Created animation object id.
    let id: String
}

/// Closed control operations for an animation object.
enum EntityAnimationControlType: String, Codable, CaseIterable, Equatable {
    /// Starts or resumes playback.
    case play
    /// Pauses playback.
    case pause
    /// Stops playback.
    case stop
    /// Restores the initial pose.
    case reset
    /// Applies the final pose.
    case finish
    /// Destroys the animation object.
    case destroy
}

/// Request payload for `ControlEntityAnimation`.
struct ControlEntityAnimationCommand: CommandDataProtocol, Codable, Equatable {
    /// JSB command name.
    static let commandType = "ControlEntityAnimation"
    /// Animation object id.
    let id: String
    /// Requested control operation.
    let type: EntityAnimationControlType
}

/// Request payload for `SetEntityAnimation`.
struct SetEntityAnimationCommand: CommandDataProtocol, Codable, Equatable {
    /// JSB command name.
    static let commandType = "SetEntityAnimation"
    /// Animation object id.
    let id: String
    /// Sparse transform update.
    let update: EntityMotionTransformPayload
}

/// Successful `SetEntityAnimation` reply.
struct SetEntityAnimationResult: Codable, Equatable {
    /// Complete transform confirmed by native.
    let values: EntityMotionConfirmedTransformPayload
}

/// Closed error codes shared by synchronous replies and asynchronous errors.
enum EntityMotionErrorCode: String, Codable, CaseIterable, Equatable {
    /// Target id does not exist.
    case targetNotFound = "TARGET_NOT_FOUND"
    /// Target cannot run entity motion.
    case unsupportedTarget = "UNSUPPORTED_TARGET"
    /// Animation object id does not exist.
    case animationNotFound = "ANIMATION_NOT_FOUND"
    /// Timeline payload is invalid.
    case invalidTimeline = "INVALID_TIMELINE"
    /// Native animation compilation failed.
    case compilationFailed = "COMPILATION_FAILED"
    /// Control operation is invalid for the current state.
    case invalidControlState = "INVALID_CONTROL_STATE"
    /// Sparse transform update is invalid.
    case invalidSetValues = "INVALID_SET_VALUES"
}

/// Native playback states emitted to JavaScript.
enum EntityMotionPlayState: String, Codable, Equatable {
    /// Animation has not started or was reset.
    case idle
    /// Animation is playing.
    case running
    /// Animation is paused.
    case paused
    /// Animation reached its final pose.
    case finished
}

/// Lifecycle callback actions emitted to JavaScript.
enum EntityMotionCallbackAction: String, Codable, Equatable {
    /// Dispatches the playback-started callback.
    case start
    /// Dispatches the playback-completed callback.
    case complete
    /// Dispatches the playback-stopped callback.
    case stop
    /// Dispatches the playback-reset callback.
    case reset
}

/// Detail carried by `spatialanimationstatechanged`.
struct EntityMotionStateChangedDetail: Codable, Equatable {
    /// Animation object id.
    let id: String
    /// Native playback state after the transition.
    let playState: EntityMotionPlayState
    /// Optional lifecycle callback associated with the confirmation.
    let callbackAction: EntityMotionCallbackAction?
    /// Complete confirmed transform paired with `callbackAction`.
    let values: EntityMotionConfirmedTransformPayload?
}

/// Dedicated entity-motion state event.
struct EntityMotionStateChangedMessage: Codable, Equatable {
    /// Event channel name.
    let type: SpatialWebMsgType
    /// Event detail.
    let detail: EntityMotionStateChangedDetail

    /// Creates a canonical state event.
    init(detail: EntityMotionStateChangedDetail) {
        type = .spatialanimationstatechanged
        self.detail = detail
    }

    /// Decodes only the canonical state-event channel.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(SpatialWebMsgType.self, forKey: .type)
        guard type == .spatialanimationstatechanged else {
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unexpected entity-motion state channel."
            )
        }
        detail = try container.decode(EntityMotionStateChangedDetail.self, forKey: .detail)
    }

    /// State-event wire keys.
    private enum CodingKeys: String, CodingKey {
        /// Event channel key.
        case type
        /// Event detail key.
        case detail
    }
}

/// Asynchronous playback failure detail.
struct EntityAnimationPlaybackError: Codable, Equatable {
    /// Stable failure code.
    let code: EntityMotionErrorCode
    /// Human-readable diagnostic reason.
    let reason: String
}

/// Detail carried by `entityanimationerror`.
struct EntityAnimationErrorDetail: Codable, Equatable {
    /// Animation object id.
    let id: String
    /// Playback failure.
    let error: EntityAnimationPlaybackError
}

/// Dedicated asynchronous entity-motion error event.
struct EntityAnimationErrorMessage: Codable, Equatable {
    /// Event channel name.
    let type: SpatialWebMsgType
    /// Event detail.
    let detail: EntityAnimationErrorDetail

    /// Creates a canonical asynchronous error event.
    init(detail: EntityAnimationErrorDetail) {
        type = .entityanimationerror
        self.detail = detail
    }

    /// Decodes only the canonical asynchronous error channel.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(SpatialWebMsgType.self, forKey: .type)
        guard type == .entityanimationerror else {
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unexpected entity-motion error channel."
            )
        }
        detail = try container.decode(EntityAnimationErrorDetail.self, forKey: .detail)
    }

    /// Asynchronous error-event wire keys.
    private enum CodingKeys: String, CodingKey {
        /// Event channel key.
        case type
        /// Event detail key.
        case detail
    }
}
