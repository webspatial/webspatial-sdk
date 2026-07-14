import type { SpatializedMotionTimeline } from './spatializedMotion'
import type { SpatializedMotionPlayState } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'
import type { SpatializedVisualValues } from './spatializedVisual'

export interface CreateSpatializedElementAnimationCommand {
  elementId: string
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
