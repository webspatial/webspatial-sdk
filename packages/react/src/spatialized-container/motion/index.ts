export { useAnimation } from './useAnimation'

// Types
export type {
  UseAnimationResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './useAnimation'

// Utilities
export {
  evaluateMotionTimeline,
  validateSpatializedMotionConfig,
  segmentConfigToMotionConfig,
} from '@webspatial/core-sdk'
export { valuesToMotionStyle } from './style'

// Internal binding types
export type { SpatializedMotionBindingInternal } from './motionBindingTypes'
