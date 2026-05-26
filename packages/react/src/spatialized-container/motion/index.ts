export { useMotionController } from './useMotionController'
export { useSpatializedMotion } from './useSpatializedMotion'
export type {
  UseSpatializedMotionResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './useSpatializedMotion'
export {
  SpatializedMotionController,
  evaluateMotionTimeline,
  validateSpatialDivMotionConfig,
  segmentConfigToMotionConfig,
} from '@webspatial/core-sdk'
export type { SpatializedMotionHandle } from '@webspatial/core-sdk'
export { valuesToMotionStyle } from './style'
export type { SpatialDivMotionBindingInternal } from './motionBindingTypes'
export type { Static3DMotionBindingInternal } from './static3dMotionBindingTypes'
export type { Dynamic3DMotionBindingInternal } from './dynamic3dMotionBindingTypes'
