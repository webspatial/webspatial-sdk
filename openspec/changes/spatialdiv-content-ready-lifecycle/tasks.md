# Tasks: spatialdiv-content-ready-lifecycle

## 1. Types & public surface

- 1.1 Add `SpatialContentReadyContext` type and `onSpatialContentReady` on `SpatializedContainerProps` / `Spatialized2DElementContainer` (SpatialDiv only; not on `Model` / `Reality` public types).
- 1.2 Extend `WebSpatialJSX.IntrinsicElements['div']` in `packages/react/src/jsx/jsx-namespace.ts` to include `onSpatialContentReady?: ...` (other intrinsics: spatial gestures only).
- 1.3 Ensure degraded rendering paths strip/ignore `onSpatialContentReady` as a DOM attribute; allow callback invocation only for non-WebSpatial plain `SpatialDiv` fallback host.

## 2. Runtime wiring (SpatializedContainer / Portal)

- 2.0 Update `SpatialContainerRefProxy.updateDomProxyToRef` so ref dispatches are deduplicated when the effective value does not change (`null`→`null` and same proxy→same proxy), for both object refs and callback refs.
- 2.1 Plumb `onSpatialContentReady` through `SpatializedContainer` props into the portal pipeline without forwarding it to the underlying DOM component as an unknown attribute.
- 2.2 Implement ready emission per spec: model `isReady` edge transitions; emit on `false → true` in `useLayoutEffect` after `ctx.host` is connected; run cleanup on `true → false`; do not re-emit while `isReady` remains continuously `true`; never emit during render.
- 2.3 Implement cleanup bookkeeping: store last returned cleanup, invoke it on `isReady` falling edge, before a new rising-edge ready, on unmount, and on internal teardown paths (including StrictMode remount cases).

## 3. Nested ordering & safety

- 3.1 Verify nested `enable-xr` scenarios: in WebSpatial runtime, parent ready must occur before child ready; parent recreation must dispose child cleanups depth-first before parent cleanup/next parent ready.
- 3.3 Document nested ordering contract split: WebSpatial runtime guarantees parent-before-child ordering; non-WebSpatial fallback does not guarantee ordering.
- 3.2 Add defensive try/catch in dev around user-provided `onSpatialContentReady` and cleanup (log once; do not break React rendering).

## 4. Tests

- 4.1 Add focused unit/integration tests under `packages/react` (prefer existing test harness) that satisfy the **Acceptance test matrix** in `specs/spatialdiv-content-host-lifecycle/spec.md`: layout-effect timing + `ctx.host.isConnected`; no invocation during render; stable `isReady` does not re-emit; falling-edge cleanup before next rising edge; StrictMode remount ordering; forwarded `ref` non-null when ready fires; ref callback deduplication; non-WebSpatial fallback strips attribute and **does invoke** `onSpatialContentReady`; attachment-degraded fallback strips attribute and does not invoke; nested parent-before-child on same rising edge in WebSpatial runtime.
- 4.2 Regression: degraded container does not forward `onSpatialContentReady` to DOM attributes (retain as explicit sub-case of 4.1 if redundant).
- 4.3 Unit tests for ref deduplication: repeated internal updates must not re-invoke callback refs with the same `null` or same proxy object.

## 5. Docs & demos

- 5.1 Update React SDK documentation with a prominent “SpatialDiv lifecycle differs from plain div” section and Do/Don’t examples (Three.js canvas attach via `onSpatialContentReady` + cleanup), explicitly noting nested callback ordering differs by runtime (WebSpatial: guaranteed parent-before-child; fallback web: unspecified).
- 5.2 Add or extend a `apps/test-server` page demonstrating nested `enable-xr` + external renderer attach, with visible logging counters for ready/cleanup ordering.

## 6. Verification

- 6.1 `pnpm -F @webspatial/react-sdk run build` (and any targeted test command added in 4.x).