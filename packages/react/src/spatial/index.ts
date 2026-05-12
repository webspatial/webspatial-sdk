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

import { initPolyfill } from '../spatialized-container'

export * from '../Model'
export * from '../reality'
export { useMetrics } from '../useMetrics'
export { withSpatialized2DElementContainer } from '../spatialized-container'
export { withSpatialMonitor } from '../spatialized-container-monitor'

// Spatial chunk bootstrap: install the CSS parser + default-style polyfill
// when the spatial chunk loads. Per spec tasks.md §7.2 this side effect
// MUST live inside the spatial chunk, NOT in the default entry — the
// default entry's previous top-level `if (typeof window !== 'undefined')
// initPolyfill()` was removed in this PR (per "No observable top-level
// side effects in default-entry modules" Scenario of the Tree-shake
// friendliness Requirement).
if (typeof window !== 'undefined') {
  initPolyfill()
}
