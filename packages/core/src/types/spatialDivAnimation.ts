import type { TimingFunction } from './animation'

// ---- SpatialDiv Animated Values ----

/**
 * Whitelisted property values for SpatialDiv animation.
 * Only these fields can be animated on spatialized 2D elements.
 */
export interface SpatialDivAnimatedValues {
  back?: number
  transform?: { translate?: { x?: number; y?: number; z?: number } }
  opacity?: number
  depth?: number
  width?: number
  height?: number
}

// ---- SpatialDiv Animation Config ----

export interface SpatialDivAnimationConfig {
  /**
   * Target animation values (required).
   * Only whitelisted fields: back, transform.translate.x/y/z, opacity, depth, width, height.
   */
  to: SpatialDivAnimatedValues

  /** Starting animation values. Omit to snapshot current state at play time. */
  from?: SpatialDivAnimatedValues

  /** Duration in seconds. Default: 0.3 */
  duration?: number

  /**
   * Easing curve. Default: 'easeInOut'
   * Only these four values are valid.
   */
  timingFunction?: TimingFunction

  /** Delay before playback starts, in seconds. Default: 0 */
  delay?: number

  /** Start automatically when element mounts. Default: true */
  autoStart?: boolean

  /**
   * Loop behavior.
   * - true: reset to `from` and replay (infinite)
   * - { reverse: true }: alternate direction each cycle (infinite)
   * - undefined / false: play once
   */
  loop?: boolean | { reverse?: boolean }

  /**
   * Playback speed multiplier. Default: 1
   * Must be non-zero and finite.
   */
  playbackRate?: number

  /** Called when session is established. */
  onStart?: () => void

  /** Called when a non-looping animation finishes naturally. */
  onComplete?: (finalValues: SpatialDivAnimatedValues) => void

  /** Called when canceled via api.cancel(). */
  onCancel?: (currentValues: SpatialDivAnimatedValues) => void

  /**
   * Called on async error. If not provided, SDK logs via console.error.
   */
  onError?: (error: SpatialDivAnimationError) => void
}

// ---- Error ----

export interface SpatialDivAnimationError {
  animationId: string
  command: 'play' | 'pause' | 'resume' | 'cancel'
  code?: string
  reason: string
}

// ---- API ----

export interface SpatialDivAnimationApi {
  play(): void
  pause(): void
  cancel(): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly playState: SpatialDivAnimationPlayState
  readonly finished: boolean
}

export type SpatialDivAnimationPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

// ---- Animated Props (opaque, passed to animation prop) ----

export interface SpatialDivAnimatedProps {
  readonly __animationObjectId: string
  readonly __kind: 'spatialDiv'
  readonly __animating: boolean
  /** @internal Fields being suppressed during animation. */
  readonly __suppressedFields: Set<string> | null
}

export interface SpatialDivAnimatedPropsInternal
  extends SpatialDivAnimatedProps {
  __getSuppressedFields: () => Set<string> | null
  __onBind?: (elementId: string) => void
  __onUnbind?: () => void
}

// ---- Cross-layer command ----

export interface AnimateSpatialDivCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  /** Required when type is 'play'; the Spatialized2DElement id. */
  elementId?: string
  /** Animated property values (only for play). */
  to?: SpatialDivAnimatedValues
  from?: SpatialDivAnimatedValues
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
}

// ---- Cross-layer result ----

export interface AnimateSpatialDivResult {
  animationId: string
  finished: Promise<SpatialDivAnimatedValues>
  canceled: Promise<SpatialDivAnimatedValues>
}
