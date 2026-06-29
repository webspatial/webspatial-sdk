import type { TimingFunction } from '../animation'
import type { SpatializedPlaybackError } from './spatializedPlayback'
import type { SpatializedVisualValues } from './spatializedVisual'

/** Spatialized container kinds with declarative timeline motion. */
export type SpatializedMotionKind = 'spatialized2d' | 'static3d' | 'dynamic3d'

/** Scalar property path on the spatialized visual whitelist. */
export const SPATIALIZED_MOTION_PROPERTIES = [
  'opacity',
  'transform.translate.x',
  'transform.translate.y',
  'transform.translate.z',
  'transform.rotate.x',
  'transform.rotate.y',
  'transform.rotate.z',
  'transform.scale.x',
  'transform.scale.y',
  'transform.scale.z',
] as const

export type SpatializedMotionProperty =
  (typeof SPATIALIZED_MOTION_PROPERTIES)[number]

export interface SpatializedMotionKeyframe {
  /** Time in seconds from timeline start, in `[0, duration]`. */
  at: number
  value: number
  timingFunction?: TimingFunction
}

export type SpatializedMotionKeyframeValues = SpatializedVisualValues & {
  timingFunction?: TimingFunction
}

/** One animatable property path and its keyframes (config-only, not a runtime handle). */
export interface SpatializedMotionTrack {
  property: SpatializedMotionProperty
  keyframes: SpatializedMotionKeyframe[]
  timingFunction?: TimingFunction
}

/** Single-segment motion: `from` → `to` over `duration` (Plan A + `useAnimation`). */
export interface SpatializedMotionSegmentConfig {
  to: SpatializedVisualValues
  from?: SpatializedVisualValues
  tracks?: never
  timeline?: never
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
  from?: never
  to?: never
  timeline?: never
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

/** Percentage-keyframe timeline authoring shape before desugaring. */
export interface SpatializedMotionTimelineConfig {
  duration: number
  timeline: Record<string, SpatializedMotionKeyframeValues>
  from?: never
  to?: never
  tracks?: never
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

export type SpatializedMotionAuthorConfig =
  | SpatializedMotionSegmentConfig
  | SpatializedMotionConfig
  | SpatializedMotionTimelineConfig

/** Normalized timeline wire payload for native playback. */
export interface SpatializedMotionTimeline {
  duration: number
  delay?: number
  playbackRate?: number
  loop?: boolean | { reverse?: boolean }
  tracks: Array<{
    property: SpatializedMotionProperty
    keyframes: SpatializedMotionKeyframe[]
    timingFunction: TimingFunction
  }>
}

export type SpatializedMotionPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

/** Imperative playback surface shared by `AnimationBinding` and `AnimationObject`. */
export interface SpatializedPlaybackApi {
  play(): void
  pause(): void
  resume(): void
  stop(): void
  reset(): void
  finish(): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatializedMotionPlayState
}
