import { initPolyfill } from './spatialized-container'

export { enableDebugTool } from './utils'
export * from './initScene'
export * from './spatialized-container'
export * from './spatialized-container-monitor'
export * from './reality'
export * from './Model'
export { SSRProvider } from './ssr'
export { usePhysicalMetrics } from './usePhysicalMetrics'

export const version = __WEBSPATIAL_REACT_SDK_VERSION__

if (typeof window !== 'undefined') {
  initPolyfill()
}
