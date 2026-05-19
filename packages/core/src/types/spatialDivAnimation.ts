import type { TimingFunction } from './animation'

// ---- SpatialDiv Transform sub-fields ----

/**
 * Structured transform for SpatialDiv animation.
 * Composed in fixed order: translate → rotate → scale.
 * Does NOT support arbitrary CSS transform strings, skew, perspective, or matrix interpolation.
 */
export interface SpatialDivTransform {
  /** Translation in CSS pixels. */
  translate?: { x?: number; y?: number; z?: number }
  /** Rotation in degrees, aligning with CSS rotateX/Y/Z(). */
  rotate?: { x?: number; y?: number; z?: number }
  /** Scale as unitless multipliers, aligning with CSS scaleX/Y/Z(). */
  scale?: { x?: number; y?: number; z?: number }
}

// ---- SpatialDiv Animated Values ----

/**
 * Whitelisted property values for SpatialDiv animation.
 * Only visual fields that do NOT change the DOM layout box, native spatial
 * panel size, depth, or spatial-position semantics are allowed:
 *   - transform.translate.x/y/z
 *   - transform.rotate.x/y/z
 *   - transform.scale.x/y/z
 *   - opacity
 */
export interface SpatialDivAnimatedValues {
  transform?: SpatialDivTransform
  opacity?: number
}

// ---- SpatialDiv Animation Config ----

export interface SpatialDivAnimationConfig {
  /**
   * Target animation values (required).
   * Only whitelisted fields: transform (translate/rotate/scale) and opacity.
   * Layout-affecting fields (width, height, back, backOffset, depth) are
   * explicitly forbidden and will throw at validation time.
   */
  to: SpatialDivAnimatedValues

  /** Starting animation values. Omit to snapshot current state at play time. */
  from?: SpatialDivAnimatedValues

  /** Duration in seconds. Must be > 0 and finite. Default: 0.3 */
  duration?: number

  /**
   * Easing curve. Default: 'easeInOut'
   * Only these four values are valid; other strings will throw.
   */
  timingFunction?: TimingFunction

  /** Delay before playback starts, in seconds. Must be >= 0 and finite. Default: 0 */
  delay?: number

  /** Start automatically when element mounts. Default: true */
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
   * Must be a positive finite number (> 0).
   */
  playbackRate?: number

  /** Called when session is established successfully. */
  onStart?: () => void

  /** Called when a non-looping animation finishes naturally. */
  onComplete?: (finalValues: SpatialDivAnimatedValues) => void

  /** Called when canceled via api.cancel(). Receives the restored values. */
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
  /** Resolves when native sends an async _failed event. */
  failed: Promise<SpatialDivAnimationError>
}
