export { applyTimingFunction, motionTimeSec } from './timing'
export { setScalar, getScalar } from './scalarValues'
export { evaluateMotionTimeline } from './sample'
export { validateSpatializedMotionConfig } from './validate'
export { motionConfigToNativeTimeline } from '../native/serializeMotionTimeline'
export { getMotionSuppressedFields } from './suppressedFields'
export {
  desugarTimelineConfig,
  normalizeMotionConfig,
  segmentConfigToMotionConfig,
} from './normalize'
