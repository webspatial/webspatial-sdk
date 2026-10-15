## Context

The `spatial-lazy-load` capability (introduced by the unarchived `lazy-load-spatial-runtime` change) pins two hydration gates:

1. **Facade gate** — `useSpatialReady()` is built on `useSyncExternalStore` with a module-level `getServerSnapshot` that returns `false`. Every facade (`facades/Model.tsx`, `facades/withSpatialized2DElementContainer.tsx`, …) renders its degraded fallback during SSR and the client hydration pass, and only delegates to the real implementation once the bridge is ready.
2. **Internal host gate** — `withSSRSupported` wraps the real `Model` / `SpatializedContainer` with a second `useSyncExternalStore` whose `getServerSnapshot` also returns `false`, emitting a placeholder `<div>` during SSR + hydration.

On the **default entry** the real hosts are reachable only via the facade delegate. Because the facade gate already holds `false` through SSR and the hydration pass, the real host's first render is always a fresh client mount that happens **after** hydration commits — at which point `withSSRSupported`'s `getSnapshot` returns `true` on the very first render. The placeholder branch is therefore never exercised on the default entry: gate (2) is redundant given gate (1).

The **eager entry** statically links the real hosts and `useSpatialReadyEager()` is a constant `true`, so there is no facade gate in front of them. However, product routing already classifies eager spatial primitives as CSR-only and declares eager SSR out of scope for SDK guarantees.

## Goals / Non-Goals

**Goals:**

- Remove the redundant `withSSRSupported` wrapper from the real `Model` / `SpatializedContainer` and delete the dead `src/ssr/` module.
- Keep default-entry SSR / hydration behavior byte-identical (still gated by the facade's `useSpatialReady`).
- Update the `spatial-lazy-load` "SSR and hydration safety" Requirement to describe the facade-only gating model and make eager-entry SSR out-of-scope explicit.

**Non-Goals:**

- Adding an opt-in SSR helper for eager consumers. The accepted answer for eager SSR is CSR-gating (e.g. `dynamic(..., { ssr: false })`) or using the default entry. (An export-site wrapper was considered and rejected — see Decisions.)
- Changing the facade gate (`useSpatialReady`) or any default-entry public surface.

## Decisions

**Decision: drop the wrapper instead of re-wrapping at the eager export site.**
The eager entry exports many spatial hosts (`Box`, `Cone`, `Cylinder`, `Plane`, `Sphere`, the `*Entity` family, the 2D HOC) that build on `SpatializedContainer`, not just `Model`. Re-wrapping all of them at the eager export site would require covering every host and re-applying `markWebSpatialPrimitive` (the `withSSRSupported` `forwardRef` wrapper drops the brand) — high surface area for a path that product routing already declares CSR-only. Pushing eager SSR to explicit consumer CSR-gating is simpler and matches the existing "Entry routing" contract. Alternative (re-wrap at export site) rejected on cost/benefit.

**Decision: keep gating semantics in one place (`useSpatialReady`).**
Hydration safety on the default entry now has a single owner — the facade gate — instead of two overlapping `useSyncExternalStore` subscriptions. This removes the only consumer of `src/ssr/`, so the module and its test are deleted.

## Risks / Trade-offs

- **[Risk] A consumer server-renders an eager-imported spatial primitive without CSR-gating** → before this change the wrapper produced a placeholder `<div>` and swapped post-hydration; after this change they may hit a hydration mismatch (server renders the degraded branch, client renders the real container). **Mitigation:** this path was already declared out of scope by "Entry routing"; the migration guide documents `dynamic(..., { ssr: false })` and the default-entry alternative, and the modified Requirement makes the out-of-scope status explicit.
- **[Risk] A future code path mounts the real `Model` / `SpatializedContainer` during SSR/hydration without going through the facade** → would lose the wrapper's safety net. **Mitigation:** the default entry's module-graph contract keeps real hosts reachable only through the bridge/facade; the modified Requirement states the post-hydration-only invariant so regressions are caught at spec-review time. Verified by the existing `ssr-hydration.test.tsx` suite (facade path) which remains green.
