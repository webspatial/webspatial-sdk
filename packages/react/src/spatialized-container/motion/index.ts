export { useMotionController } from './useMotionController'
export { useAnimation } from './useSpatializedMotion'
export type {
  UseSpatializedMotionResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './useSpatializedMotion'
export {
  SpatializedMotionController,
  evaluateMotionTimeline,
  validateSpatializedMotionConfig,
  segmentConfigToMotionConfig,
} from '@webspatial/core-sdk'
export type {
  SpatializedMotionHandle,
  Static3DMotionBindingInternal,
  Dynamic3DMotionBindingInternal,
} from '@webspatial/core-sdk'
export { valuesToMotionStyle } from './style'
export type { SpatializedMotionBindingInternal } from './motionBindingTypes'
