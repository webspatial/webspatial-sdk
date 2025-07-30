import {
  hijackWindowATag,
  hijackWindowOpen,
  // SceneManager,
} from './refactor/SceneManager'

export * from './core/index'
export { SpatialSession as SpatialSessionNew } from './refactor/SpatialSession'
export { Spatialized2DElement } from './refactor/Spatialized2DElement'
export { SpatialScene, type SpatialSceneOptions } from './refactor/SpatialScene'
export {
  defaultSceneConfig,
  hijackWindowATag,
  hijackWindowOpen,
} from './refactor/SceneManager'

// side effects
hijackWindowOpen(window)
hijackWindowATag(window)
