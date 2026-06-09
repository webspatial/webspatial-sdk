export {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from './SpatializedMotionController'
export type { SpatializedMotionHandle } from './SpatializedMotionHandle'
export { MOTION_KIND_POLICIES } from './motionKindPolicy'

export {
  evaluateMotionTimeline,
  validateSpatializedMotionConfig as validateSpatializedMotionConfig,
  segmentConfigToMotionConfig as segmentConfigToMotionConfig,
} from '../compute'
