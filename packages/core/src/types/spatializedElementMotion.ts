import type {
  SpatialDivMotionProperty,
  SpatialDivMotionTimeline,
} from './spatialDivMotion'
import type { SpatialDivVisualValues } from './spatialDivVisual'
import type { TimingFunction } from './animation'
import type { SpatializedMotionKind } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'

/** Unified JSB command for Static3D / Dynamic3D container motion. */
export interface AnimateSpatializedElementMotionCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  targetKind: Exclude<SpatializedMotionKind, 'spatialized2d'>
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

export interface AnimateSpatializedElementMotionResult {
  animationId: string
  finished: Promise<SpatialDivVisualValues>
  canceled: Promise<SpatialDivVisualValues>
  failed: Promise<SpatializedPlaybackError>
}

export type ContainerElementMotionCommand = Omit<
  AnimateSpatializedElementMotionCommand,
  'targetKind'
>
