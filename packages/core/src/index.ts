export type {} from './types/global'

export { SpatialObject } from './SpatialObject'
export { Spatial } from './Spatial'
export { SpatialSession } from './SpatialSession'
export { SpatialScene } from './SpatialScene'
export { SpatializedElement } from './SpatializedElement'
export { Spatialized2DElement } from './Spatialized2DElement'
export { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
export { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
export * as PhysicalMetrics from './physicalMetrics'

export * from './reality'
export * from './types/types'
export * from './types/animation'
export * from './types/spatializedVisual'
export * from './types/spatializedPlayback'
export type {
  SpatializedMotionProperty,
  SpatializedMotionKeyframe,
  SpatializedMotionKeyframeValues,
  SpatializedMotionTrack,
  SpatializedMotionSegmentConfig,
  SpatializedMotionTimelineConfig,
  SpatializedMotionConfig,
  SpatializedMotionTimeline,
  SpatializedMotionPlayState,
  SpatializedMotionPropertyKeys,
  SpatializedPlaybackApi,
} from './types/spatializedMotion'
export * from './types/spatializedMotionBinding'
export * from './types/spatializedStatic3dAnimation'
export * from './types/spatializedDynamic3dAnimation'
export * from './types/spatializedElementMotion'
export * from './motion'
export * from './runtime'

export { composeSRT, decomposeSRT } from './utils'

// side effects
import { injectSceneHook } from './scene-polyfill'
import { isSSREnv } from './ssr-polyfill'
import { spatialWindowPolyfill } from './spatial-window-polyfill'

export { isSSREnv }

if (!isSSREnv() && navigator.userAgent.indexOf('WebSpatial/') > 0) {
  injectSceneHook()
  spatialWindowPolyfill()
}
