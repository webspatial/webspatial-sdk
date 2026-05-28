import type { TimingFunction } from './animation'
import type { SpatializedPlaybackError } from './spatializedPlayback'
import type { SpatializedVisualValues } from './spatializedVisual'

/** Spatialized container kinds with declarative timeline motion. */
export type SpatializedMotionKind = 'spatialized2d' | 'static3d' | 'dynamic3d'

/** Scalar property path on the spatialized visual whitelist. */
export type SpatializedMotionProperty =
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

export interface SpatializedMotionKeyframe {
  /** Time in seconds from timeline start, in `[0, duration]`. */
  at: number
  value: number
}

/** One animatable property path and its keyframes (config-only, not a runtime handle). */
export interface SpatializedMotionTrack {
  property: SpatializedMotionProperty
  keyframes: SpatializedMotionKeyframe[]
  easing?: TimingFunction
}

/** Single-segment motion: `from` → `to` over `duration` (Plan A + `useSpatializedMotion.simple`). */
export interface SpatializedMotionSegmentConfig {
  to: SpatializedVisualValues
  from?: SpatializedVisualValues
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatializedVisualValues) => void
  onStop?: (values: SpatializedVisualValues) => void
  onReset?: (values: SpatializedVisualValues) => void
  onError?: (error: SpatializedPlaybackError) => void
}

/** Multi-track timeline motion (Plan B). */
export interface SpatializedMotionConfig {
  duration: number
  tracks: SpatializedMotionTrack[]
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatializedVisualValues) => void
  onStop?: (values: SpatializedVisualValues) => void
  onReset?: (values: SpatializedVisualValues) => void
  onError?: (error: SpatializedPlaybackError) => void
}

/** Normalized timeline wire payload for native playback. */
export interface SpatializedMotionTimeline {
  duration: number
  delay?: number
  playbackRate?: number
  loop?: boolean | { reverse?: boolean }
  tracks: Array<{
    property: SpatializedMotionProperty
    keyframes: SpatializedMotionKeyframe[]
    easing: TimingFunction
  }>
}

export type SpatializedMotionPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

/** One property path or a list (react-spring-style selective control). */
export type SpatializedMotionPropertyKeys =
  | SpatializedMotionProperty
  | readonly SpatializedMotionProperty[]

/** Imperative playback surface (`SpatializedMotionController`, hooks). */
export interface SpatializedPlaybackApi {
  play(): void
  pause(keys?: SpatializedMotionPropertyKeys): void
  resume(keys?: SpatializedMotionPropertyKeys): void
  stop(): void
  reset(): void
  finish(): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatializedMotionPlayState
}
