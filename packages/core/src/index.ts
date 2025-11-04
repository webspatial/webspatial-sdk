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
export * from './types/global.d'

// side effects
import { injectSceneHook } from './scene-polyfill'
import { isSSREnv } from './ssr-polyfill'
export { isSSREnv }
if (!isSSREnv()) {
  injectSceneHook()
}

import { spatialWindowPolyfill } from './spatial-window-polyfill'
if (!isSSREnv()) {
  spatialWindowPolyfill()
}
