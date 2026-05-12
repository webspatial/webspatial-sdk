---
'@webspatial/react-sdk': major
---

BREAKING — default-entry switchover for `openspec/lazy-load-spatial-runtime` (PR 4 of 6). Rewrites `packages/react/src/index.ts` so the default entry exposes ONLY the documented public surface: lazy-load runtime API (`bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`), spatial primitive **facades** (`Model`, `Reality`, `Entity`, `*Entity` family + aliases, materials / assets, `SceneGraph` / `World`), HOC facades (`withSpatialized2DElementContainer`, `withSpatialMonitor`), the `useMetrics` placeholder-or-real selector, stateless utilities (`enableDebugTool`, `convertCoordinate`, `getAbsoluteUrl`, `initScene`, `SSRProvider`), pure re-exports (`WebSpatialRuntime`, `WebSpatialRuntimeError`, `CapabilityKey`, `version`), and the deprecated `createElement` export retained for the classic JSX transform.

**Removed from default entry** (per proposal BREAKING bullet):

- `SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor` — facade-HOC implementation details; user code routes through `withSpatialized2DElementContainer` / `withSpatialMonitor` facades.
- Internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) — never documented public surface; ship inside the spatial chunk alongside their consumers.
- Other previously-leaked internals (`initPolyfill`, `SpatialCustomStyleVars`, `StandardSpatializedContainer`, `PortalSpatializedContainer`, `TransformVisibilityTaskContainer`, `eventMap`).

**Other changes in this PR**:

- Removes the top-level `if (typeof window !== 'undefined') initPolyfill()` side effect from the default entry; polyfill installation moves into the spatial chunk's bootstrap inside `src/spatial/index.ts` (executed when the spatial chunk dynamically loads), per spec tasks.md §7.2.
- After this PR, `@webspatial/react-sdk` self-imports in the JSX runtime (`packages/react/src/jsx/jsx-shared.ts`) resolve to the facade versions of `Model` / `withSpatialized2DElementContainer` / `withSpatialMonitor` (PR 3 already used a relative path; the resolution endpoint is identical after this switchover, per spec tasks.md §7.4).
- `createElement` retains its v1 behavior; the `@deprecated` JSDoc on it was added in PR 3.

**Migration guide** (planned for PR 6): existing apps that imported `Spatialized2DElementContainer` / `SpatializedStatic3DElementContainer` / `SpatializedContainer` / `SpatialMonitor` directly MUST switch to the HOC facades (`withSpatialized2DElementContainer(Component)` / `withSpatialMonitor(Element)`) or to the per-component facades (`Model`, `Reality`, etc.). Apps that imported internal reality hooks were doing so against undocumented API; the supported migration is to drop those imports — the facade-shaped public API covers the documented use cases.

Real spatial implementation modules (`./Model`, `./reality/*`, the `./spatialized-container/*` runtime values, the `./spatialized-container-monitor/*` runtime values, and the real `./useMetrics`) are now reachable ONLY from `src/spatial/index.ts` (the dynamic-import target). Physical file relocation under `src/spatial/` (spec tasks.md §3.1) is deferred to a follow-up cosmetic cleanup PR: the runtime module-graph contract (`tasks.md §7.3`) is satisfied by removing the static imports from the default entry, which this PR does. The corresponding build-time identifier scan + size budget assertion lives in PR 5 (`tasks.md §9.1` / §9.4).
