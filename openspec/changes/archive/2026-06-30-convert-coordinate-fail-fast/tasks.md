## 1. Specification

- [x] 1.1 Add `convert-coordinate-fail-fast` change with runtime-capabilities and spatial-lazy-load deltas

## 2. Implementation

- [x] 2.1 Update `convertCoordinate` to throw `WebSpatialRuntimeError` when unsupported, session missing, or refs invalid
- [x] 2.2 Update unit tests in `stateless-utilities.test.tsx`
- [x] 2.3 Update `packages/react/README.md` and `docs/convertCoordinate.md`

## 3. Verification

- [x] 3.1 Run `pnpm test` for `packages/react`
