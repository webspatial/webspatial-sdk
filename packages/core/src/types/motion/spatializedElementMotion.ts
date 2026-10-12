import type { SpatializedMotionTimeline } from './spatializedMotion'
import type { SpatializedMotionPlayState } from './spatializedMotion'
import type { SpatializedVisualValues } from './spatializedVisual'
import type { SpatialWebMsgType } from '../../WebMsgCommand'

/** Native playback error payload carried by the bridge event. */
interface SpatializedElementAnimationErrorDetail {
  /** Machine-readable native error code. */
  code: string
  /** Human-readable native error message. */
  message: string
}

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
    | 'start'
    | 'complete'
    | 'error'
  playState: SpatializedMotionPlayState
  finished: boolean
  values?: SpatializedVisualValues
  error?: SpatializedElementAnimationErrorDetail
}

export interface SpatialAnimationStateChangedMsg {
  type: SpatialWebMsgType.animationstatechange
  detail: SpatialAnimationStateChangedDetail
}
