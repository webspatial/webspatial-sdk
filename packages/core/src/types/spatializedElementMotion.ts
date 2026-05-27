import type {
  SpatializedMotionProperty,
  SpatializedMotionTimeline,
} from './spatializedMotion'
import type { SpatializedVisualValues } from './spatializedVisual'
import type { TimingFunction } from './animation'
import type { SpatializedMotionKind } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'

/** Unified JSB command for spatialized2d / static3d / dynamic3d motion. */
export interface AnimateSpatializedElementMotionCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  targetKind: SpatializedMotionKind
  properties?: SpatializedMotionProperty[]
  elementId?: string
  to?: SpatializedVisualValues
  from?: SpatializedVisualValues
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  timeline?: SpatializedMotionTimeline
}

export interface AnimateSpatializedElementMotionResult {
  animationId: string
  finished: Promise<SpatializedVisualValues>
  canceled: Promise<SpatializedVisualValues>
  failed: Promise<SpatializedPlaybackError>
}

/** Motion command without `targetKind` (filled in by element / bridge). */
export type ElementMotionCommand = Omit<
  AnimateSpatializedElementMotionCommand,
  'targetKind'
>
