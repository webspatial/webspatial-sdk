export { useMotionController } from './useMotionController'
export { useAnimation } from './useAnimation'
export type {
  UseAnimationResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './useAnimation'
export {
  evaluateMotionTimeline,
  validateSpatializedMotionConfig,
  segmentConfigToMotionConfig,
} from '@webspatial/core-sdk'
export { valuesToMotionStyle } from './style'
export { resolveMotionStyle } from './resolveMotionStyle'
export type { SpatializedMotionBindingInternal } from './motionBindingTypes'
