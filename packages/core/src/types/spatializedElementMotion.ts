import type { SpatializedMotionTimeline } from './spatializedMotion'
import type { SpatializedMotionKind } from './spatializedMotion'
import type { SpatializedMotionPlayState } from './spatializedMotion'
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

export interface CreateSpatializedElementAnimationCommand {
  elementId: string
  targetKind: SpatializedMotionKind
  timeline: SpatializedMotionTimeline
}

export type SpatializedElementAnimationControlType =
  | 'play'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'reset'
  | 'finish'
  | 'destroy'

export interface ControlSpatializedElementAnimationCommand {
  animationId: string
  type: SpatializedElementAnimationControlType
}

export interface SpatialAnimationStateChangedDetail {
  animationId: string
  action:
    | SpatializedElementAnimationControlType
    | 'created'
    | 'start'
    | 'complete'
    | 'completed'
    | 'failed'
  playState: SpatializedMotionPlayState
  finished: boolean
  values?: SpatializedVisualValues
  error?: SpatializedPlaybackError
}

export interface SpatialAnimationStateChangedMsg {
  type: 'spatialanimationstatechanged'
  detail: SpatialAnimationStateChangedDetail
}
