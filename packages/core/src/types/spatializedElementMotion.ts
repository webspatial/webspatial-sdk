import type { SpatializedMotionTimeline } from './spatializedMotion'
import type { SpatializedMotionPlayState } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'
import type { SpatializedVisualValues } from './spatializedVisual'
import type { SpatializedMotionKind } from './spatializedMotion'

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
