---
"@webspatial/react-sdk": patch
---

Remove the internal `withSSRSupported` wrapper from the real `Model` / `SpatializedContainer` implementations (and delete the now-unused `src/ssr/` module).

**Why:** On the default entry these real hosts are reached only through the facade delegate, which renders them only after `useSpatialReady()` reports ready — i.e. as a fresh client mount after hydration commits, never during the SSR or hydration pass. The facade's `useSpatialReady` (`useSyncExternalStore` + stable `getServerSnapshot`) already provides the hydration gate, so the extra internal wrapper was redundant on this path.

**Eager entry:** spatial primitives imported from `@webspatial/react-sdk/eager` remain CSR-only (per the spec "Entry routing" contract). They no longer carry an internal SSR gate; server-rendering them in a mixed SSR/CSR setup is out of scope for SDK guarantees — CSR-gate the subtree (e.g. `dynamic(..., { ssr: false })`) or import the same primitives from the default entry for SSR pages.

**Spec / docs:** Updated in `openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md` ("SSR and hydration safety"), `design.md`, and `docs/migration/lazy-load-spatial-runtime.md`.
