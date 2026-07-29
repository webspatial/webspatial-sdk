// =============================================================================
// `@webspatial/react-sdk/spatial` — bridge-facing spatial namespace.
//
// This module is the dynamic-import target invoked by
// `runtime/bridge.ts#loadSpatialImpl()`. It exposes ONLY the real
// implementations that default-entry facades need to resolve by name:
// real `Model`, `Reality`, `Entity`, all `*Entity` components,
// materials / assets, `SceneGraph` / `World`, the real
// `withSpatialized2DElementContainer` / `withSpatialMonitor` HOCs, and the
// real `useMetrics`. Per spec tasks.md §3.2, internal containers / monitors
// (`SpatializedContainer`, `Spatialized2DElementContainer`,
// `SpatializedStatic3DElementContainer`, `SpatialMonitor`) and internal
// reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`,
// `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`)
// are NOT exposed here even though they are reachable from the spatial
// chunk's static module graph — they are facade-HOC implementation details.
//
// Phasing note (spec tasks.md §3.2): until §3.1's physical file relocation
// lands, the re-export targets remain pointed at the existing source paths
// (`../Model`, `../reality`, etc.); the runtime module-graph contract is
// nevertheless satisfied because `src/index.ts` (the default entry) no
// longer statically imports any of these paths — they are reachable ONLY
// through this module, which the bridge dynamic-imports.
// =============================================================================

// Spatial chunk bootstrap: install the `@webspatial/core-sdk` scene hook +
// `window.spatial` polyfill. Per the lazy-load proposal `tasks.md §12.9`
// ("Pre-v1 budget calibration") this opt-in subpath replaces what used
// to be `core-sdk/index.ts`'s top-level side effect — the spatial chunk
// is the right place to install those polyfills because they are only
// observable in WebSpatial-capable browsers, AND because dynamic-loading
// them here means the SDK's lean default-entry bundle never has to pull
// `scene-polyfill.ts` (~636 LoC) into its static module graph.
import '@webspatial/core-sdk/install-polyfills'

import { initPolyfill } from '../spatialized-container'

export * from '../Model'
export * from '../reality'
export { useMetrics } from '../useMetrics'
export { useAnimation } from '../spatialized-container/motion'
export { useEntityAnimation } from '../reality/hooks/useAnimation'
export { withSpatialized2DElementContainer } from '../spatialized-container'
export { withSpatialMonitor } from '../spatialized-container-monitor'

// Re-export `getSession` so the default-entry utilities (`enableDebugTool`,
// `convertCoordinate`, `initScene`) can route their `getSession()` calls
// through the bridge instead of statically importing the real
// implementation. The static import would pull `Spatial` + `SpatialSession`
// — and through `SpatialSession`'s class body, every geometry creator,
// `SpatialEntity`, `realityCreator`, `Attachment`, etc. — into the
// default-entry bundle, blowing the marginal-delta budget. Routing
// through `getSpatialImpl()?.getSession?.()` keeps the chain reachable
// only via the dynamic `import('./spatial')` from the bridge.
//
// Per `tasks.md §12.9` calibration follow-up.
export { getSession } from '../utils/getSession'

// Spatial chunk bootstrap: install the CSS parser + default-style polyfill
// when the spatial chunk loads. Per spec tasks.md §7.2 this side effect
// MUST live inside the spatial chunk, NOT in the default entry — the
// default entry's previous top-level `if (typeof window !== 'undefined')
// initPolyfill()` was removed in PR 4 (per "No observable top-level
// side effects in default-entry modules" Scenario of the Tree-shake
// friendliness Requirement).
if (typeof window !== 'undefined') {
  initPolyfill()
}
