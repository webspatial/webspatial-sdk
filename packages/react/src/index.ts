// =============================================================================
// `@webspatial/react-sdk` default entry — lazy-load v1.
//
// Per spatial-lazy-load spec tasks.md §7.1, the default entry exposes ONLY the
// documented public surface: bridge / boot / readiness API, the spatial
// primitive **facades** (which lazy-load the real implementation via
// `bootSpatial()`), the `useMetrics` placeholder-or-real selector, stateless
// utilities (Group B), pure re-exports (Group C), and the deprecated
// `createElement` export retained for the classic JSX transform.
//
// Notably absent (per the BREAKING bullet in the proposal): the four internal
// containers / monitors `SpatializedContainer`, `Spatialized2DElementContainer`,
// `SpatializedStatic3DElementContainer`, and `SpatialMonitor`. They were
// previously exposed via `export * from './spatialized-container'` /
// `./spatialized-container-monitor` and are now facade-HOC implementation
// details only reachable through the `withSpatialized2DElementContainer` /
// `withSpatialMonitor` facade HOCs.
//
// Real spatial implementation modules (`./Model`, `./reality/*`, the
// `./spatialized-container/*` and `./spatialized-container-monitor/*` runtime
// values, and the real `./useMetrics`) MUST NOT be statically reachable from
// this file. Per spec tasks.md §7.3 the only path from default entry to the
// spatial implementation is the bridge's dynamic `import('./spatial')` (PR 5
// publishes the corresponding `@webspatial/react-sdk/spatial` exports
// subpath). The top-level `initPolyfill()` side effect that previously lived
// here has been moved into `src/spatial/index.ts` (per spec tasks.md §7.2) so
// the polyfill installs when the spatial chunk loads, not on every default
// import.
// =============================================================================

// --- Lazy-load runtime: bridge / boot / readiness / error class --------------
export { bootSpatial } from './runtime/boot'
export { isSpatialReady, onSpatialLoadError } from './runtime/bridge'
export { useSpatialReady } from './runtime/useSpatialReady'
export { WebSpatialBootError } from './runtime/errors'

// --- Core infrastructure (Group C: pure re-exports / type re-exports) --------
export { WebSpatialRuntime } from './webSpatialRuntime'
export { WebSpatialRuntimeError } from '@webspatial/core-sdk'
export type { CapabilityKey } from '@webspatial/core-sdk'

// --- Stateless utilities (Group B: gracefully degrade via core-sdk session) --
// `enableDebugTool` is imported from its source file (NOT from `./utils`)
// so the `./utils/index.ts` barrel — which still re-exports `getSession`
// for spatial-chunk callers — does NOT enter the default-entry static
// module graph. This protects against bundler heuristics that may pull
// barrel re-exports as a unit. Per `tasks.md §12.9` calibration follow-up.
export { enableDebugTool } from './utils/debugTool'
export { convertCoordinate } from './utils/convertCoordinate'
export { getAbsoluteUrl } from './utils/urlUtils'
export { initScene } from './initScene'

// --- SSR --------------------------------------------------------------------
export { SSRProvider } from './ssr'

// --- Spatial primitive facades (Group A: lazy-loaded) -----------------------
export {
  AttachmentEntity,
  Box,
  BoxEntity,
  Cone,
  ConeEntity,
  Cylinder,
  CylinderEntity,
  Entity,
  Model,
  ModelEntity,
  Plane,
  PlaneEntity,
  Reality,
  SceneGraph,
  Sphere,
  SphereEntity,
  AttachmentAsset,
  Material,
  ModelAsset,
  Texture,
  UnlitMaterial,
  World,
  withSpatialMonitor,
  withSpatialized2DElementContainer,
} from './facades'
export type {
  AttachmentAssetProps,
  AttachmentEntityProps,
  BoxEntityProps,
  ConeEntityProps,
  CylinderEntityProps,
  EntityFacadeProps,
  EntityRefShape,
  MaterialProps,
  ModelAssetProps,
  ModelEntityProps,
  ModelProps,
  ModelRef,
  PlaneEntityProps,
  RealityProps,
  SceneGraphProps,
  SphereEntityProps,
  TextureProps,
  UnlitMaterialProps,
} from './facades'

// --- Hooks (placeholder-or-real selector per spec "Hook placeholders") ------
export { useMetrics } from './hooks-web/useMetrics'

// --- Public type surface (no runtime values) --------------------------------
// Spatial event + ref types — referenced by facade prop / ref typing.
// Using `export type` so TypeScript / esbuild fully erase these
// re-exports; the underlying `./spatialized-container/types.ts` module
// stays in the spatial chunk's runtime module graph, not default entry's
// (per spec tasks.md §7.3).
export type {
  ModelLoadEvent,
  ModelSpatialDragEndEvent,
  ModelSpatialDragEvent,
  ModelSpatialDragStartEvent,
  ModelSpatialMagnifyEndEvent,
  ModelSpatialMagnifyEvent,
  ModelSpatialRotateEndEvent,
  ModelSpatialRotateEvent,
  ModelSpatialTapEvent,
  Point3D,
  Quaternion,
  Spatialized2DElementContainerProps,
  SpatializedDivElementRef,
  SpatializedElementRef,
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementRef,
  SpatialContentReadyCallback,
  SpatialContentReadyContext,
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatialDragStartEvent,
  SpatialEventOptions,
  SpatialMagnifyEndEvent,
  SpatialMagnifyEvent,
  SpatialRotateEndEvent,
  SpatialRotateEvent,
  SpatialTapEvent,
  Vec3,
} from './spatialized-container/types'
// Entity event types and event handler shapes.
export type {
  EntityEventHandler,
  EntityProps,
  SpatialDragEndEntityEvent,
  SpatialDragEntityEvent,
  SpatialDragStartEntityEvent,
  SpatialMagnifyEndEntityEvent,
  SpatialMagnifyEntityEvent,
  SpatialRotateEndEntityEvent,
  SpatialRotateEntityEvent,
  SpatialTapEntityEvent,
} from './reality/type'
// `EntityRef` — the (class-shaped) public ref type for `*Entity` facades.
// Re-exported as type-only — the class value is a spatial-chunk implementation
// detail, not part of the default-entry runtime surface.
export type { EntityRef } from './reality/hooks/useEntityRef'

// --- Deprecated JSX runtime classic-transform export ------------------------
// Annotation lives on the named function in `./jsx/jsx-shared.ts`. See spec
// "createElement export is deprecated" Scenario; the export's v1 runtime
// behavior is unchanged (still calls `replaceToSpatialPrimitiveType` +
// `reactCreateElement`).
export { createElement } from './jsx/jsx-shared'

// --- Package version --------------------------------------------------------
export const version = __WEBSPATIAL_REACT_SDK_VERSION__
