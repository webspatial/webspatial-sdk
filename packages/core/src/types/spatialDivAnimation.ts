import type { TimingFunction } from './animation'
import type {
  SpatialDivMotionProperty,
  SpatialDivMotionTimeline,
} from './spatialDivMotion'
import type { SpatialDivVisualValues } from './spatialDivVisual'

// ---- Plan A: `animation` prop binding (opaque handle) ----

export interface SpatialDivAnimationBinding {
  readonly __animationObjectId: string
  readonly __kind: 'spatialDiv'
  readonly __animating: boolean
  /** @internal Fields being suppressed during animation. */
  readonly __suppressedFields: Set<string> | null
}

export interface SpatialDivAnimationBindingInternal
  extends SpatialDivAnimationBinding {
  __getSuppressedFields: () => Set<string> | null
  __onBind?: (elementId: string) => void
  __onUnbind?: () => void
}

// ---- Cross-layer bridge (internal; used by Spatialized2DElement) ----

export interface AnimateSpatialDivCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  /**
   * Optional subset of animated properties for pause/resume/cancel.
   * Native MAY ignore until supported; Web backend honors selective pause/resume.
   */
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

export interface AnimateSpatialDivResult {
  animationId: string
  finished: Promise<SpatialDivVisualValues>
  canceled: Promise<SpatialDivVisualValues>
  failed: Promise<import('./spatialDivPlayback').SpatialDivPlaybackError>
}
