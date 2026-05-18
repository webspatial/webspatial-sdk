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

// --- Core-sdk type re-exports (zero runtime cost) ---------------------------
// `@webspatial/core-sdk` is now a regular dependency (not a peer) of this
// package — consumers `pnpm add @webspatial/react-sdk` and the SDK's npm
// transitively installs core-sdk. To complete that "single-package
// installation, single-package import" experience, the documented
// user-facing TYPE surface of core-sdk is re-exported here so consumer code
// never needs `import from '@webspatial/core-sdk'`.
//
// IMPORTANT: only TYPE-only re-exports live here. Re-exporting heavy
// runtime classes (`Spatial`, `SpatialSession`, `SpatializedDynamic3DElement`,
// etc.) would inflate the §9.2 marginal-delta budget — every consumer that
// imports `@webspatial/react-sdk` would link the runtime class into their
// main bundle even when they only meant to use a facade. Power users who
// genuinely need the runtime classes (currently only the SDK's own demos
// like `apps/test-server`) can still `import from '@webspatial/core-sdk'`
// directly; the package is reachable through the dependency graph either
// way. See `openspec/changes/lazy-load-spatial-runtime/tasks.md` follow-up
// notes for the rationale.
//
// Names that already resolve to a richer parameterized type via
// `./spatialized-container/types` (the `SpatialTapEvent` / `SpatialDragEvent`
// family) intentionally do NOT appear here — re-exporting the simpler
// core-sdk version of the same name would shadow the more useful one in
// consumer IDEs.
export type {
  // Common scalar types not already covered by `spatialized-container/types`.
  CornerRadius,
  // Backplate / world configuration (consumer-facing scene properties).
  BackgroundMaterialType,
  BaseplateVisibilityType,
  WorldScalingType,
  WorldAlignmentType,
  SpatialSceneType,
  // Scene size / unit shapes.
  Size,
  Size3D,
  SceneUnit,
  SceneUnitPx,
  SceneUnitM,
  SpatialSceneCreationOptions,
  SpatialSceneProperties,
  // Element-level configuration (consumer-facing container props).
  SpatializedElementProperties,
  Spatialized2DElementProperties,
  SpatializedStatic3DElementProperties,
  // Geometry options (configure entity geometry from JS).
  SpatialGeometryType,
  SpatialGeometryOptions,
  SpatialBoxGeometryOptions,
  SpatialPlaneGeometryOptions,
  SpatialSphereGeometryOptions,
  SpatialConeGeometryOptions,
  SpatialCylinderGeometryOptions,
  // Material / texture options.
  SpatialMaterialType,
  SpatialUnlitMaterialOptions,
  SpatialTextureResourceOptions,
  // Model / asset options.
  ModelSource,
  ModelComponentOptions,
  ModelAssetOptions,
  SpatialModelEntityCreationOptions,
  // Entity-level types (configuration, user data, event taxonomy).
  SpatialEntityProperties,
  SpatialEntityUserData,
  SpatialEntityEventType,
  SpatialEntityOrReality,
  // Attachment options.
  AttachmentEntityOptions,
  AttachmentEntityUpdateOptions,
  // PWA manifest + scene config (used by builder tooling and consumer
  // manifest authoring).
  XRSceneSize,
  XRSceneResizability,
  XRMainSceneConfig,
  XRSpatialSceneDefaults,
  XRSpatialSceneOverrides,
  XRSpatialSceneConfig,
  XRPrdConfig,
  PWAManifest,
  // Runtime detection types (advanced: surfaces what
  // `WebSpatialRuntime.runtime` returns / what the bridge looks at).
  WebSpatialRuntimeSnapshot,
  WebSpatialRuntimeType,
  JsbAdapterPlatformKind,
} from '@webspatial/core-sdk'

// --- Stateless utilities (Group B: gracefully degrade via core-sdk session) --
// `enableDebugTool` is imported from its source file (NOT from `./utils`)
// so the `./utils/index.ts` barrel — which still re-exports `getSession`
// for spatial-chunk callers — does NOT enter the default-entry static
// module graph. This protects against bundler heuristics that may pull
// barrel re-exports as a unit. Per `tasks.md §12.9` calibration follow-up.
export { enableDebugTool } from './utils/debugTool'
export { convertCoordinate } from './utils/convertCoordinate'
// `getAbsoluteUrl` is `@deprecated` and will be removed in v2 — see the
// JSDoc on the function for the rationale. The export remains here in v1
// so existing consumers continue to compile (with an IDE strikethrough)
// and so `default-entry-public-surface.test.ts` / `eager-entry-shape.test.ts`
// keep asserting the v1 contract. Internal SDK callers (`Texture.tsx`,
// `ModelAsset.tsx`) reach the helper via a relative import and are
// unaffected by the public-surface removal.
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
