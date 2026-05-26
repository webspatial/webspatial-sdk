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
export * from './types/spatialDivVisual'
export * from './types/spatialDivPlayback'
export * from './types/spatialDivMotion'
export * from './types/spatialDivAnimation'
export * from './types/spatializedVisual'
export * from './types/spatializedMotion'
export * from './types/spatializedPlayback'
export * from './types/spatializedStatic3dAnimation'
export * from './types/spatializedDynamic3dAnimation'
export * from './types/spatializedElementMotion'
export { parseSpatialDivVisualValues } from './spatialdiv/parseSpatialDivVisualValues'
export * from './spatialdiv/motion'
export * from './static3d/motion'
export * from './dynamic3d/motion'
export * from './spatialized/motion'
export type { SpatializedMotionHandle } from './spatialized/motion/SpatializedMotionHandle'
export { SpatializedMotionController } from './spatialized/motion/SpatializedMotionController'
export type { SpatializedMotionControllerOptions } from './spatialized/motion/SpatializedMotionController'
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
