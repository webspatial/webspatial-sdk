export { applyTimingFunction, motionTimeSec } from './timing'
export {
  applyFrozenProperties,
  snapshotScalars,
  setScalar,
  getScalar,
} from './scalarValues'
export { evaluateMotionTimeline } from './sample'
export { validateSpatializedMotionConfig } from './validate'
export { motionConfigToNativeTimeline } from './nativeTimeline'
export { getMotionSuppressedFields } from './suppressedFields'
export {
  desugarTimelineConfig,
  normalizeMotionConfig,
  segmentConfigToMotionConfig,
} from './normalize'
export { normalizeMotionPropertyKeys } from './propertyKeys'
export type { SpatializedMotionPropertyKeys } from '../../types/spatializedMotion'
