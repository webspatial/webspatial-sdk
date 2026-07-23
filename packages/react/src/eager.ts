'use client'

// IMPORTANT: this guard MUST be the first import so the mixed-entry
// registration/validation runs before `./spatial` (imported below) evaluates
// its polyfill side effects. ESM evaluates static imports in source order
// before the module body, so placing a `registerReactSdkEntry('eager')` call
// in this file's body would run AFTER `./spatial`'s side effects.
//
// We import a VALUE binding (not a bare side-effect import) and reference it
// below so consumer bundlers cannot tree-shake the registration chunk away.
// See `./runtime/registerEagerEntry` for the full rationale.
import { eagerEntryRegistered } from './runtime/registerEagerEntry'

// =============================================================================
// `@webspatial/react-sdk/eager` — eager-mode entry for spatial-only consumers.
//
// Purpose: applications that target ONLY WebSpatial runtimes (internal AVP /
// Pico enterprise apps, App Store apps shipped to fixed spatial devices,
// deeply spatial-first product surfaces) pay one network request instead of
// two and skip the `bootSpatial()` round-trip entirely. The lazy-load
// default entry (`@webspatial/react-sdk`) remains the right choice for
// web-first consumers who progressively enhance into spatial.
//
// This entry SHARES the entire packaging-hygiene contract set with the
// default entry (per the "Two distribution forms share packaging hygiene"
// Requirement) — the only differences are:
//
//   1. Spatial primitives resolve to the REAL implementations from
//      `./spatial` (statically linked), NOT to facade fallbacks.
//   2. The lazy-load runtime API (`bootSpatial` / `isSpatialReady` /
//      `useSpatialReady` / `onSpatialLoadError` / `WebSpatialBootError`)
//      is a no-op compatibility stub — see `./runtime/eagerStubs.ts`.
//
// All other surface (stateless utilities, type re-exports, JSX runtime
// behavior, `'use client'` RSC boundary) aligns with the default entry by
// re-exporting the same source modules the default entry uses, so the two
// entries stay in lockstep without pulling the default-entry facade chunk into
// the eager static closure.
//
// Normative product routing (see `openspec/.../spatial-lazy-load/spec.md`:
// "Entry routing", "CSR-only for spatial primitives"): spatial primitives
// from this entry MUST mount client-only; applications that server-render
// those primitives MUST use `@webspatial/react-sdk` instead (or CSR-gate
// their subtree). Packaging-hygiene overlaps with the default entry (ESM,
// peers, sideEffects, etc.) without extending full façade SSR semantics to
// eager-imported spatial components.
//
// Per spec `tasks.md §16` and the "Eager-mode entry for spatial-only
// consumers" Requirement.
// =============================================================================

// --- Step 1: statically link the spatial implementation into the bridge ----
// `import * as SpatialImpl from './spatial'` evaluates the spatial chunk
// at module-evaluation time, which (a) installs the polyfill side effects
// (`@webspatial/core-sdk/install-polyfills` + the container `initPolyfill()`
// bootstrap) and (b) gives us a namespace object containing every real
// spatial implementation. We hand that namespace to the bridge so any
// facade-equivalent path (e.g. JSX runtime → facade HOC → bridge lookup)
// also sees the bridge as ready and immediately commits the real
// implementation on first render.
//
// `__internalSetSpatialImpl` is an internal coupling between this entry
// and the bridge; it is NOT exported from the default-entry public surface
// (see `runtime/bridge.ts` for the rationale).
import * as SpatialImpl from './spatial'
import { __internalSetSpatialImpl } from './runtime/bridge'
// Keep registration binding live for downstream tree-shaking by passing it
// through the bridge setup call. A standalone `void eagerEntryRegistered` is
// pure enough for consumer bundlers to erase, which drops the registration
// chunk and disables mixed-entry detection.
__internalSetSpatialImpl(SpatialImpl, eagerEntryRegistered)

// --- Step 2: spatial primitives — REAL implementations from /spatial -------
// Per the "Spatial primitives mount real implementations on first render"
// Scenario, these MUST resolve to the real implementations, not the
// facade fallbacks. The names mirror the default entry's facade exports
// 1-to-1 so a consumer can switch import roots without renaming any
// symbol — see the "Migration from default to eager is import-root-only"
// Scenario.
// `withSpatialized2DElementContainer` and `withSpatialMonitor` USED to be
// re-exported here for default-entry parity. They were demoted to
// internal-only in the `internalize-hoc-factories` change — the
// `enable-xr` / `enable-xr-monitor` JSX markers remain the documented
// public mechanism, and consumers who need a wrapped component for
// composition with another HOC (e.g. `animated(...)`) should write a
// thin `forwardRef` shim around `<div enable-xr ref={ref} />`. See the
// migration guide for the recipe.
export {
  Model,
  Reality,
  Entity,
  AttachmentEntity,
  Box,
  BoxEntity,
  Cone,
  ConeEntity,
  Cylinder,
  CylinderEntity,
  ModelEntity,
  Plane,
  PlaneEntity,
  Sphere,
  SphereEntity,
  AttachmentAsset,
  Material,
  ModelAsset,
  Texture,
  UnlitMaterial,
  SceneGraph,
  World,
  useMetrics,
} from './spatial'

// --- Step 3: lazy-load runtime API as no-op compatibility stubs ------------
// Per the "`bootSpatial()` compatibility stub is a no-op",
// "`isSpatialReady` / `useSpatialReady` always report ready", and
// "`onSpatialLoadError` registers but never fires" Scenarios. These names
// are kept on the eager entry's surface for source compatibility — a
// consumer migrating from the default entry should not have to remove
// `await bootSpatial()` calls.
export {
  bootSpatialEager as bootSpatial,
  isSpatialReadyEager as isSpatialReady,
  useSpatialReadyEager as useSpatialReady,
  onSpatialLoadErrorEager as onSpatialLoadError,
  SpatialBootEager as SpatialBoot,
} from './runtime/eagerStubs'
// `WebSpatialBootError` is the same class definition the default entry
// exports — eager stubs simply never throw it, but the class remains
// importable for type-narrowing convenience and for consumers that catch
// boot errors generically.
export { WebSpatialBootError } from './runtime/errors'
export { WebSpatialMixedEntryError } from './runtime/entryRegistry'

// --- Step 4: stateless utilities — shared source modules with default entry -
// Per the "Two distribution forms share packaging hygiene" Requirement
// these MUST reuse the same source modules the default entry exposes (no
// redeclaration) so behavior parity remains byte-identical without importing
// the whole default-entry facade graph into the eager static closure.
export { enableDebugTool } from './utils/debugTool'
export { convertCoordinate } from './utils/convertCoordinate'
export { initScene } from './initScene'
export { WebSpatialRuntime } from './webSpatialRuntime'
export { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
export { createElement } from './jsx/jsx-shared'

export const version = __WEBSPATIAL_REACT_SDK_VERSION__

// --- Step 5: type-only re-exports — match the default entry surface --------
// `export type *` re-exports the type-side of every default-entry export
// (facade prop types, event types, refs, runtime types, core-sdk type
// re-exports). Zero runtime cost; satisfies the "named-export set is a
// strict superset of the default entry" half of the Eager Requirement
// for the type surface.
export type * from './index'
