import type { TimingFunction } from './animation'
import type { SpatialDivAnimatedValues } from './spatialDivAnimation'

/** Scalar property path on the SpatialDiv visual whitelist. */
export type SpatialDivMotionProperty =
  | 'opacity'
  | 'transform.translate.x'
  | 'transform.translate.y'
  | 'transform.translate.z'
  | 'transform.rotate.x'
  | 'transform.rotate.y'
  | 'transform.rotate.z'
  | 'transform.scale.x'
  | 'transform.scale.y'
  | 'transform.scale.z'

export interface SpatialDivMotionKeyframe {
  /** Time in seconds from timeline start, in `[0, duration]`. */
  at: number
  value: number
}

export interface SpatialDivMotionTrack {
  property: SpatialDivMotionProperty
  keyframes: SpatialDivMotionKeyframe[]
  easing?: TimingFunction
}

export interface SpatialDivMotionConfig {
  /** Global timeline length in seconds. Must be > 0 and finite. */
  duration: number
  tracks: SpatialDivMotionTrack[]
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatialDivAnimatedValues) => void
  onCancel?: (values: SpatialDivAnimatedValues) => void
  onError?: (error: import('./animation').AnimationError) => void
}

export interface SpatialDivMotionSimpleConfig {
  from?: SpatialDivAnimatedValues
  to: SpatialDivAnimatedValues
  duration?: number
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  timingFunction?: TimingFunction
  onStart?: () => void
  onComplete?: (values: SpatialDivAnimatedValues) => void
  onCancel?: (values: SpatialDivAnimatedValues) => void
  onError?: (error: import('./animation').AnimationError) => void
}

/** Normalized timeline sent to native (Phase 2). */
export interface SpatialDivMotionTimeline {
  duration: number
  delay?: number
  playbackRate?: number
  loop?: boolean | { reverse?: boolean }
  tracks: Array<{
    property: SpatialDivMotionProperty
    keyframes: SpatialDivMotionKeyframe[]
    easing: TimingFunction
  }>
}

export type SpatialDivMotionPlayState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'finished'

export interface SpatialDivMotionApi {
  play(): void
  pause(): void
  cancel(): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatialDivMotionPlayState
}
