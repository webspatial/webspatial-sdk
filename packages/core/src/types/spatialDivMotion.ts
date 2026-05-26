import type { TimingFunction } from './animation'
import type { SpatialDivPlaybackError } from './spatialDivPlayback'
import type { SpatialDivVisualValues } from './spatialDivVisual'

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

/** One animatable property path and its keyframes (config-only, not a runtime handle). */
export interface SpatialDivMotionTrack {
  property: SpatialDivMotionProperty
  keyframes: SpatialDivMotionKeyframe[]
  easing?: TimingFunction
}

/** Single-segment motion: `from` → `to` over `duration` (Plan A + `useSpatializedMotion.simple`). */
export interface SpatialDivSegmentConfig {
  to: SpatialDivVisualValues
  from?: SpatialDivVisualValues
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatialDivVisualValues) => void
  onCancel?: (values: SpatialDivVisualValues) => void
  onError?: (error: SpatialDivPlaybackError) => void
}

/** Multi-track timeline motion (Plan B). */
export interface SpatialDivMotionConfig {
  duration: number
  tracks: SpatialDivMotionTrack[]
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatialDivVisualValues) => void
  onCancel?: (values: SpatialDivVisualValues) => void
  onError?: (error: SpatialDivPlaybackError) => void
}

/** Normalized timeline wire payload for native playback. */
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

export type SpatialDivPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

/** One property path or a list (react-spring-style selective control). */
export type SpatialDivMotionPropertyKeys =
  | SpatialDivMotionProperty
  | readonly SpatialDivMotionProperty[]

/** Imperative playback surface (`SpatializedMotionController`, hooks). */
export interface SpatialDivPlaybackApi {
  play(): void
  pause(keys?: SpatialDivMotionPropertyKeys): void
  resume(keys?: SpatialDivMotionPropertyKeys): void
  cancel(keys?: SpatialDivMotionPropertyKeys): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatialDivPlayState
}
