import type {
  SpatialDivMotionProperty,
  SpatialDivMotionTimeline,
} from './spatialDivMotion'
import type { SpatialDivVisualValues } from './spatialDivVisual'
import type { TimingFunction } from './animation'
import type { SpatializedPlaybackError } from './spatializedPlayback'

export interface Static3DMotionBinding {
  readonly __motionObjectId: string
  readonly __kind: 'static3dMotion'
  readonly __animating: boolean
  readonly __suppressedFields: Set<string> | null
}

export interface Static3DMotionBindingInternal extends Static3DMotionBinding {
  __getSuppressedFields: () => Set<string> | null
  __setElement?: (
    element: import('../SpatializedStatic3DElement').SpatializedStatic3DElement,
  ) => void
  __onUnbind?: () => void
}

export interface AnimateSpatializedStatic3DCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  properties?: SpatialDivMotionProperty[]
  elementId?: string
  to?: SpatialDivVisualValues
  from?: SpatialDivVisualValues
  duration?: number
  timingFunction?: TimingFunction
  delay?: number
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  timeline?: SpatialDivMotionTimeline
}

export interface AnimateSpatializedStatic3DResult {
  animationId: string
  finished: Promise<SpatialDivVisualValues>
  canceled: Promise<SpatialDivVisualValues>
  failed: Promise<SpatializedPlaybackError>
}
