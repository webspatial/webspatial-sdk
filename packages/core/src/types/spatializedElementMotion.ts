import type { SpatializedMotionTimeline } from './spatializedMotion'
import type { SpatializedMotionKind } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'
import type { SpatializedVisualValues } from './spatializedVisual'

/** Unified JSB command for spatialized2d / static3d / dynamic3d motion. */
export interface AnimateSpatializedElementMotionCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'stop' | 'reset' | 'finish'
  targetKind: SpatializedMotionKind
  elementId?: string
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
