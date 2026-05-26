import type {
  SpatialDivMotionProperty,
  SpatialDivMotionTimeline,
} from './spatialDivMotion'
import type { SpatialDivVisualValues } from './spatialDivVisual'
import type { TimingFunction } from './animation'
import type { SpatializedMotionKind } from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'

/** Unified JSB command for spatialized2d / static3d / dynamic3d motion. */
export interface AnimateSpatializedElementMotionCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'cancel'
  targetKind: SpatializedMotionKind
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

/** Motion command without `targetKind` (filled in by element / bridge). */
export type ElementMotionCommand = Omit<
  AnimateSpatializedElementMotionCommand,
  'targetKind'
>

/** @deprecated Use {@link ElementMotionCommand}. */
export type ContainerElementMotionCommand = ElementMotionCommand
