import type {
  SpatialDivMotionConfig,
  SpatialDivMotionKeyframe,
  SpatialDivMotionProperty,
  SpatialDivMotionPropertyKeys,
  SpatialDivMotionTimeline,
  SpatialDivMotionTrack,
  SpatialDivPlayState,
  SpatialDivSegmentConfig,
} from './spatialDivMotion'

/** Spatialized container kinds with declarative timeline motion. */
export type SpatializedMotionKind = 'spatialized2d' | 'static3d' | 'dynamic3d'

export type SpatializedMotionProperty = SpatialDivMotionProperty

export type SpatializedMotionKeyframe = SpatialDivMotionKeyframe
export type SpatializedMotionTrack = SpatialDivMotionTrack
export type SpatializedSegmentConfig = SpatialDivSegmentConfig
export type SpatializedMotionConfig = SpatialDivMotionConfig
export type SpatializedMotionTimeline = SpatialDivMotionTimeline
export type SpatializedPlayState = SpatialDivPlayState
export type SpatializedMotionPropertyKeys = SpatialDivMotionPropertyKeys
