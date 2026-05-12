---
'@webspatial/react-sdk': patch
---

Internal lazy-load foundation (PR 1 of 6 for `openspec/lazy-load-spatial-runtime`). Adds the runtime bridge, boot helper, runtime detection, `WebSpatialBootError`, and `useSpatialReady` under `packages/react/src/runtime/`, plus a bridge-facing `@webspatial/react-sdk/spatial` namespace that re-exports the existing spatial implementation modules. No public API surface changes in this release — the new modules are not yet wired into the default entry. Subsequent PRs replace the dual-build (`/web` and `/default` subpaths) with a single lean default bundle and lazy-loaded spatial chunk.
