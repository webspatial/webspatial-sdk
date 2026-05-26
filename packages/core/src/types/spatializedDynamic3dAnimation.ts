import type {
  SpatialDivMotionProperty,
  SpatialDivMotionTimeline,
} from './spatialDivMotion'
import type { SpatialDivVisualValues } from './spatialDivVisual'
import type { TimingFunction } from './animation'
import type { SpatializedPlaybackError } from './spatializedPlayback'

export interface Dynamic3DMotionBinding {
  readonly __motionObjectId: string
  readonly __kind: 'dynamic3dMotion'
  readonly __animating: boolean
  readonly __suppressedFields: Set<string> | null
}

export interface Dynamic3DMotionBindingInternal extends Dynamic3DMotionBinding {
  __getSuppressedFields: () => Set<string> | null
  __setElement?: (
    element: import('../SpatializedDynamic3DElement').SpatializedDynamic3DElement,
  ) => void
  __onUnbind?: () => void
}

export interface AnimateSpatializedDynamic3DCommand {
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

export interface AnimateSpatializedDynamic3DResult {
  animationId: string
  finished: Promise<SpatialDivVisualValues>
  canceled: Promise<SpatialDivVisualValues>
  failed: Promise<SpatializedPlaybackError>
}
