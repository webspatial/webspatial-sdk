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

export {
  SpatialDivMotionController,
  type SpatialDivMotionControllerOptions,
} from '../../spatialdiv/motion'

export {
  Static3DMotionController,
  type Static3DMotionControllerOptions,
} from '../../static3d/motion'

export {
  Dynamic3DMotionController,
  type Dynamic3DMotionControllerOptions,
} from '../../dynamic3d/motion'
