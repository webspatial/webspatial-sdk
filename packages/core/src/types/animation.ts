import type { Vec3 } from './types'

// ---- Timing function ----

export type TimingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

// ---- Transform values ----

/**
 * Transform values used in animation callbacks (`onComplete`, `onCancel`).
 * Rotation values are Euler angles in **degrees**, matching the input convention
 * of `AnimationConfig` and the entity `rotation` prop.
 */
export interface TransformValues {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

// ---- Play state ----

/**
 * Represents the current state of an animation session as exposed by
 * `api.playState`. The internal `delaying` state maps to `'running'`
 * because from the developer's perspective the session is actively progressing.
 */
export type AnimationPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

// ---- Animation config ----

/**
 * Configuration for `useAnimation`.
 *
 * `to` is required and declares which transform fields are animated.
 * `from` is optional; omitting it causes the native layer to snapshot
 * the entity's current transform at playback time.
 */
export interface AnimationConfig {
  /**
   * Target transform values (required).
   * Rotation values are Euler angles in degrees.
   * Single-axis rotation > 180 deg may produce unexpected results (shortest-path SLERP).
   */
  to: TransformValues

  /** Starting transform values. Omit to animate from the entity's current state. */
  from?: TransformValues

  /** Duration in seconds. Default: 0.3 */
  duration?: number

  /**
   * Easing curve. Default: 'easeInOut'
   * Only these four values are valid; other strings will throw at validation time.
   */
  timingFunction?: TimingFunction

  /** Delay before playback starts, in seconds. Default: 0 */
  delay?: number

  /** Start automatically when the entity mounts. Default: true */
  autoStart?: boolean

  /**
   * Loop behavior.
   * - true: reset to `from` and replay (infinite reset loop)
   * - { reverse: true }: alternate direction each cycle (infinite reverse loop)
   * - undefined / false: play once
   */
  loop?: boolean | { reverse?: boolean }

  /**
   * Playback speed multiplier. Default: 1
   * Values > 1 speed up; values between 0 and 1 slow down.
   * Must be a positive finite number (> 0).
   * Applied at session creation time and remains constant for the session.
   * Maps to AnimationView.speed on the native (AVP) side.
   */
  playbackRate?: number

  /** Called when the session is established successfully. */
  onStart?: () => void

  /** Called when a non-looping animation finishes naturally. */
  onComplete?: (finalValues: TransformValues) => void

  /** Called when playback is canceled via api.cancel(). Receives the restored transform. */
  onCancel?: (currentValues: TransformValues) => void

  /**
   * Called when an asynchronous error occurs during a bridge or native operation.
   * If not provided, the SDK logs the error via console.error.
   */
  onError?: (error: AnimationError) => void
}

// ---- Animation error ----

export interface AnimationError {
  /** The session that encountered the error. */
  animationId: string
  /** The command that failed. */
  command: 'play' | 'pause' | 'resume' | 'cancel'
  /** Optional machine-readable error code. */
  code?: string
  /** Human-readable failure reason. */
  reason: string
}

// ---- Animation API (returned by useAnimation) ----

export interface AnimationApi {
  /** Start the animation, or continue it from paused progress. */
  play(): void

  /** Pause the animation at the current progress. */
  pause(): void

  /** Cancel the animation and restore `from`, or the start snapshot when `from` is omitted. */
  cancel(): void

  /** Whether the session is currently queued, delaying, or running (false while paused or idle). */
  readonly isAnimating: boolean

  /** Whether the animation is currently paused. */
  readonly isPaused: boolean

  /** Current session state. */
  readonly playState: AnimationPlayState

  /** Whether the most recent current session completed naturally. */
  readonly finished: boolean
}

// ---- Animated props (opaque, passed to entity `animation` prop) ----

/**
 * Opaque object returned as the first tuple element of `useAnimation`.
 * Pass it directly to the entity's `animation` prop.
 * Application code should not read or modify its internal fields.
 */
export interface AnimatedProps {
  /** @internal Unique identifier for this animation object. */
  readonly __animationObjectId: string
  /** @internal Transform fields targeted by this animation. */
  readonly __animatedFields: readonly ('position' | 'rotation' | 'scale')[]
  /** @internal Whether the animation currently has an alive session. */
  readonly __animating: boolean
}

// ---- Cross-layer command / result ----

/**
 * Float4x4 is a 16-element column-major matrix stored in a Float64Array,
 * matching `DOMMatrix.toFloat64Array()`.
 */
export type Float4x4 = Float64Array

/**
 * Unified command sent from React SDK -> Core SDK -> native.
 */
export interface AnimateTransformCommand {
  /**
   * Unique session identifier. A new `animationId` is generated for each
   * `play` command; `pause`, `resume`, and `stop` reuse the session's id.
   */
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  /** Required when type is 'play'; ignored otherwise. */
  entityId?: string
  toTransform?: Float4x4
  fromTransform?: Float4x4
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  loop?: boolean | { reverse?: boolean }
  /** Playback speed multiplier. Default: 1. Must be positive (> 0). Maps to AnimationView.speed on AVP. */
  playbackRate?: number
}

/**
 * Result returned by `SpatialEntity.animateTransform({ type: 'play' })`.
 */
export interface AnimateTransformResult {
  animationId: string
  /** Resolves when a non-looping animation completes naturally. */
  finished: Promise<TransformValues>
  /**
   * Resolves when the animation is canceled and restored to `from`.
   * After cancel, `finished` MUST remain pending (not rejected).
   */
  canceled: Promise<TransformValues>
  /**
   * Resolves when the animation fails due to a native or bridge error.
   * Optional because older native runtimes may not emit the failed event.
   */
  failed?: Promise<AnimationError>
}

// ---- Internal animated props (cross-layer communication) ----

/**
 * @internal
 * Extended interface for `AnimatedProps` used internally by the entity layer
 * to bind/unbind animations and query suppressed transform fields.
 * Application code should never use this interface directly.
 */
export interface AnimatedPropsInternal extends AnimatedProps {
  /** Called by the entity layer when the entity instance becomes available. */
  __bind: (
    entity: import('../reality/entity/SpatialEntity').SpatialEntity,
  ) => void
  /** Called by the entity layer when the entity is destroyed or animation prop changes. */
  __unbind: () => void
  /** Returns the transform fields currently suppressed by an alive animation session. */
  __getSuppressedFields: () =>
    | readonly ('position' | 'rotation' | 'scale')[]
    | null
}
