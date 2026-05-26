export {
  SpatialDivMotionController as SpatializedMotionController,
  type SpatialDivMotionControllerOptions as SpatializedMotionControllerOptions,
  evaluateMotionTimeline,
  validateSpatialDivMotionConfig as validateSpatialized2DMotionConfig,
  segmentConfigToMotionConfig as segmentConfigToSpatializedMotionConfig,
} from '../../spatialdiv/motion'

export {
  Static3DMotionController,
  type Static3DMotionControllerOptions,
} from '../../static3d/motion'

export {
  Dynamic3DMotionController,
  type Dynamic3DMotionControllerOptions,
} from '../../dynamic3d/motion'
