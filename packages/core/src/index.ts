export { SpatialObject } from './SpatialObject'
export { Spatial } from './Spatial'
export { SpatialSession } from './SpatialSession'
export { SpatialScene } from './SpatialScene'
export { SpatializedElement } from './SpatializedElement'
export { Spatialized2DElement } from './Spatialized2DElement'
export { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
export { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
export * from './reality'
export * from './types/types'

// side effects
import { injectSceneHook } from './scene-polyfill'
injectSceneHook()

import { spatialWindowPolyfill } from './spatial-window-polyfill'
spatialWindowPolyfill()
