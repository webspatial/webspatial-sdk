## 1. Remove the wrapper from real spatial hosts

- [x] 1.1 In `packages/react/src/Model.tsx`, drop the `withSSRSupported` import and export the plain `forwardRef(ModelBase)`; keep `markWebSpatialPrimitive(Model, 'Model')` and add a comment explaining why no SSR wrapper is needed.
- [x] 1.2 In `packages/react/src/spatialized-container/SpatializedContainer.tsx`, drop the `withSSRSupported` import and export the plain `forwardRef(SpatializedContainerBase)` (keep the generic type cast), with an explanatory comment.

## 2. Delete the dead module

- [x] 2.1 Delete `packages/react/src/ssr/withSSRSupported.tsx`, `packages/react/src/ssr/index.tsx`, and `packages/react/src/ssr/withSSRSupported.test.tsx`.
- [x] 2.2 Confirm no remaining `withSSRSupported` / `./ssr` imports exist in `packages/react/src` (only explanatory comments remain).

## 3. Update spec & docs

- [x] 3.1 Modify the `spatial-lazy-load` "SSR and hydration safety" Requirement (delta in this change) to replace the `withSSRSupported` constraint with the facade-only / post-hydration-only model and make eager SSR out-of-scope explicit.
- [x] 3.2 Update `docs/migration/lazy-load-spatial-runtime.md` and `docs/react-sdk-product-alignment.md` to describe the facade-only gating model and the eager CSR-gate guidance.
- [x] 3.3 Update stale `withSSRSupported` references in code/test comments (`packages/react/src/index.ts`, `default-entry-public-surface.test.ts`, `eager-entry-shape.test.ts`, `__tests__/parity.test.tsx`, `__tests__/helpers/parity.tsx`).
- [x] 3.4 Add `.changeset/remove-withssrsupported-wrapper.md` (patch) describing the change and the eager SSR contract.

## 4. Verify

- [x] 4.1 Run `tsc -p ./tsconfig.json --noEmit` for `@webspatial/react-sdk` (passes).
- [x] 4.2 Run the full `vitest` suite for `@webspatial/react-sdk` (377 passed, 4 todo); confirm `ssr-hydration.test.tsx` remains green.
- [ ] 4.3 Run `openspec validate remove-withssrsupported-wrapper --strict` and resolve any reported issues.
