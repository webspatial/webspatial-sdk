---
'@webspatial/react-sdk': patch
---

Internal lazy-load facades + hook placeholders (PR 2 of 6 for `openspec/lazy-load-spatial-runtime`). Adds the default-entry facade components for every public spatial primitive (`Model`, `Reality`, `Entity` / `*Entity` family, materials, assets, `SceneGraph` / `World`) and the HOC facades (`withSpatialized2DElementContainer`, `withSpatialMonitor`) under `packages/react/src/facades/`, together with the `useMetrics` placeholder + selector under `packages/react/src/hooks-web/`. Facades subscribe to bridge readiness via `useSpatialReady` (added in PR 1) and render the spec-pinned per-component fallback when the spatial chunk is not ready, delegating to the real implementation after `bootSpatial()` resolves. The new modules are not yet wired into `src/index.ts` (that switchover is PR 4); no public API surface changes in this release.
