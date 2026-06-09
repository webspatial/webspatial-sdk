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
export {
  resolveJsbAdapterPlatform,
  type JsbAdapterPlatformKind,
} from './jsbAdapterPlatform'
export type { CapabilityVersionRow } from './capability-data'
export { CAPABILITY_TABLE } from './capability-data'
export type { CapabilityKey } from './keys'
