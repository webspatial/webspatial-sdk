# Tasks: spatialdiv-content-ready-lifecycle

## 1. Types & public surface

- [ ] 1.1 Add `SpatialContentReadyContext` type and `onSpatialContentReady` prop to `packages/react/src/spatialized-container/types.ts` (and any exported prop surfaces that should carry it consistently).
- [ ] 1.2 Extend `WebSpatialJSX.IntrinsicElements` in `packages/react/src/jsx/jsx-namespace.ts` to include `onSpatialContentReady?: ...` alongside existing spatial gesture props.
- [ ] 1.3 Ensure degraded rendering paths strip/ignore `onSpatialContentReady` so it never becomes a real DOM attribute (mirror `spatialEventOptions` stripping patterns).

## 2. Runtime wiring (SpatializedContainer / Portal)

- [ ] 2.1 Plumb `onSpatialContentReady` through `SpatializedContainer` props into the portal pipeline without forwarding it to the underlying DOM component as an unknown attribute.
- [ ] 2.2 Implement ready emission in `PortalSpatializedContainer` when `spatializedElement` exists and `portalInstanceObject.dom` is available, and portal content is about to/just mounted (exact timing per design: must satisfy spec ordering vs `ref`).
- [ ] 2.3 Implement cleanup bookkeeping: store last returned cleanup, invoke it before subsequent ready, on unmount, and on internal teardown paths (including StrictMode remount cases).
- [ ] 2.4 Implement `generation` + `reason` fields per spec; ensure monotonic `generation` across recreated streams for a single React component instance.

## 3. Nested ordering & safety

- [ ] 3.1 Verify nested `enable-xr` scenarios: parent ready must occur before child ready; parent recreation must dispose child cleanups depth-first before parent cleanup/next parent ready.
- [ ] 3.2 Add defensive try/catch in dev around user-provided `onSpatialContentReady` and cleanup (log once; do not break React rendering).

## 4. Tests

- [ ] 4.1 Add focused unit/integration tests under `packages/react` (prefer existing test harness) covering: first ready, cleanup on unmount, remount (StrictMode-like double invoke), nested ordering.
- [ ] 4.2 Add a regression test that degraded container does not forward `onSpatialContentReady` to DOM attributes.

## 5. Docs & demos

- [ ] 5.1 Update React SDK documentation with a prominent “SpatialDiv lifecycle differs from plain div” section and Do/Don’t examples (Three.js canvas attach via `onSpatialContentReady` + cleanup).
- [ ] 5.2 Add or extend a `apps/test-server` page demonstrating nested `enable-xr` + external renderer attach, with visible logging counters for ready/cleanup ordering.

## 6. Verification

- [ ] 6.1 `pnpm -F @webspatial/react-sdk run build` (and any targeted test command added in 4.x).
