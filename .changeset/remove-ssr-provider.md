---
"@webspatial/react-sdk": major
---

Remove the public **`SSRProvider`** export and delete **`SSRContext` / `useSSRPhase`**.

**Why:** Facade SSR is already driven by `useSpatialReady` + `useSyncExternalStore`. Real `Model` / `SpatializedContainer` are reached only through the facade delegate and therefore mount as a fresh client render after hydration commits, so no app-level Context is required.

**Migration:** Delete `import { SSRProvider } from '@webspatial/react-sdk'` and any `<SSRProvider>` wrapper. No replacement.

**Spec / docs:** Updated in `openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`, `packages/react/README.md`, and `docs/migration/lazy-load-spatial-runtime.md`.
