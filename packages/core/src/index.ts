// =============================================================================
// `@webspatial/core-sdk` ESM entry — side-effect-free.
//
// The previous top-level polyfill installation (`if (UA contains
// 'WebSpatial/') { injectSceneHook(); spatialWindowPolyfill(); }`) lived
// here historically and was extracted out per the lazy-load proposal
// `tasks.md §12.9` ("Pre-v1 budget calibration"). ESM bundlers cannot
// tree-shake observable top-level side effects, so the runtime UA guard
// was useless for bundle size — every consumer that imported anything
// from this package statically bundled `scene-polyfill.ts` + the
// `spatial-window-polyfill.ts` pair regardless of whether they ran in a
// WebSpatial browser. After this extraction, consumers opt in:
//
//   import '@webspatial/core-sdk/install-polyfills'
//
// `@webspatial/react-sdk` does this from inside its spatial chunk so the
// polyfills install only when `bootSpatial()` resolves, never in the
// lean default-entry bundle.
// =============================================================================

export type {} from './types/global'

export { SpatialObject } from './SpatialObject'
export { AnimationObject } from './motion/AnimationObject'
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
export * from './types/motion'
export * from './motion'
export * from './runtime'

export { composeSRT, decomposeSRT } from './utils'
export { isSSREnv } from './isSSREnv'
