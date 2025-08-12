export { Spatial } from './refactor/Spatial'
export { SpatialSession } from './refactor/SpatialSession'
export { SpatialScene } from './refactor/SpatialScene'
export { Spatialized2DElement } from './refactor/Spatialized2DElement'
export { SpatializedStatic3DElement } from './refactor/SpatializedStatic3DElement'
export * from './refactor/types'

// side effects
import { injectSceneHook } from './refactor/scene-polyfill'
injectSceneHook()
