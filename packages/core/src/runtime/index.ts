export type { WebSpatialRuntimeSnapshot, WebSpatialRuntimeType } from './types'
export { WebSpatialRuntimeError } from './WebSpatialRuntimeError'
export {
  supports,
  getRuntime,
  resetRuntimeCacheForTests,
  VISIONOS_DEBUG_SHELL_VERSION_PLACEHOLDER,
} from './supports'
export { compareSemver, parseSemverOrNull } from './semver'
export { computeRuntimeFromUserAgent, parseShellToken } from './userAgent'
export type { CapabilityVersionRow } from './capability-data'
export { CAPABILITY_TABLE } from './capability-data'
export {
  TOP_LEVEL_KEYS,
  SUB_TOKENS_BY_NAME,
  COMPONENT_KEYS,
  CSS_KEYS,
  GESTURE_KEYS,
  JS_SCENE_KEYS,
  DOM_DEPTH_KEYS,
} from './keys'
