## Why

The `withSSRSupported` higher-order component was introduced to make the real `Model` / `SpatializedContainer` hydration-safe on the **default entry**. But on the default entry those real hosts are reached **only** through the facade delegate (`facades/*`), which renders them only after `useSpatialReady()` reports ready — i.e. as a fresh client mount **after** hydration commits, never during SSR or the hydration pass. The facade's `useSpatialReady` (`useSyncExternalStore` + stable `getServerSnapshot`) already provides the hydration gate, so the additional internal wrapper is redundant on the only path that reaches it under the default entry. The eager entry is product-routed as CSR-only for spatial primitives, so it does not need an SDK-provided SSR gate either.

## What Changes

- Remove the `withSSRSupported` wrapper from the real `Model` (`packages/react/src/Model.tsx`) and `SpatializedContainer` (`packages/react/src/spatialized-container/SpatializedContainer.tsx`); both now export the plain `forwardRef` component (Model keeps its `markWebSpatialPrimitive` brand).
- Delete the now-unused `packages/react/src/ssr/` module (`withSSRSupported.tsx`, `index.tsx`) and its colocated test.
- **BREAKING (eager only):** spatial primitives imported from `@webspatial/react-sdk/eager` no longer carry an internal SSR gate. Server-rendering them in a mixed SSR/CSR setup may produce hydration mismatches; consumers MUST CSR-gate the subtree (e.g. `dynamic(..., { ssr: false })`) or import the primitives from the default entry for SSR pages. This is consistent with the existing "Entry routing" contract that already declares eager spatial primitives CSR-only.
- Default-entry behavior is unchanged: real hosts still mount post-hydration via the facade delegate's `useSpatialReady` gate.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `spatial-lazy-load`: the "SSR and hydration safety" Requirement is modified — the internal `withSSRSupported` wrapper constraint is replaced by a "real spatial hosts are reached only post-hydration through the facade delegate" constraint, and eager-entry SSR is explicitly out of scope for SDK guarantees.

## Impact

- **Code:** `packages/react/src/Model.tsx`, `packages/react/src/spatialized-container/SpatializedContainer.tsx`, deletion of `packages/react/src/ssr/*`.
- **Tests:** removal of `src/ssr/withSSRSupported.test.tsx`; comment-only updates in `parity.test.tsx`, `helpers/parity.tsx`, `eager-entry-shape.test.ts`, `default-entry-public-surface.test.ts`. The existing `ssr-hydration.test.tsx` suite is unaffected (it exercises the facade path with a bridge-injected sentinel impl).
- **Docs / changeset:** `docs/migration/lazy-load-spatial-runtime.md`, `docs/react-sdk-product-alignment.md`, `.changeset/remove-withssrsupported-wrapper.md`.
- **Dependency:** stacks on the unarchived `lazy-load-spatial-runtime` change, which introduces the `spatial-lazy-load` capability and the "SSR and hydration safety" Requirement this change modifies.
