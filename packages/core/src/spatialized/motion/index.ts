export {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from './SpatializedMotionController'
export type { SpatializedMotionHandle } from './SpatializedMotionHandle'
export { MOTION_KIND_POLICIES } from './motionKindPolicy'

export {
  evaluateMotionTimeline,
  validateSpatialDivMotionConfig as validateSpatialized2DMotionConfig,
  segmentConfigToMotionConfig as segmentConfigToSpatializedMotionConfig,
} from '../../spatialdiv/motion'
