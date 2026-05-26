import { initPolyfill } from './spatialized-container'

export { WebSpatialRuntime } from './webSpatialRuntime'
export { WebSpatialRuntimeError } from '@webspatial/core-sdk'
export type { CapabilityKey } from '@webspatial/core-sdk'
export { enableDebugTool } from './utils'
export * from './initScene'
export * from './spatialized-container'
export * from './spatialized-container-monitor'
export * from './reality'
export { useAnimation } from './useAnimation'
export {
  useSpatialDivMotion,
  useStatic3DMotion,
  useDynamic3DMotion,
  useSpatializedMotion,
  SpatialDivMotionController,
  SpatializedMotionController,
} from './spatialized-container/motion'
export type { SpatializedMotionHandle } from '@webspatial/core-sdk'
export * from './Model'
export { SSRProvider } from './ssr'
export { useMetrics } from './useMetrics'
export { createElement } from './jsx/jsx-shared'
export { convertCoordinate } from './utils/convertCoordinate'
export { getAbsoluteUrl } from './utils/urlUtils'

export const version = __WEBSPATIAL_REACT_SDK_VERSION__

if (typeof window !== 'undefined') {
  initPolyfill()
}
