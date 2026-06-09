# Tasks: spatialdiv-content-ready-lifecycle

> **Status legend:** ✅ Done · 🟡 Partial (gap listed) · ⬜ Not started.
> Each task is annotated with a **Resolution / Gap** note pointing at the
> implementing/covering file(s) so reviewers can see exactly what is complete.

## 1. Types & public surface

- 1.1 Add `SpatialContentReadyContext` type and `onSpatialContentReady` on `SpatializedContainerProps` / `Spatialized2DElementContainer` (SpatialDiv only; not on `Model` / `Reality` public types).
  - ✅ **Resolution:** `packages/react/src/spatialized-container/types.ts` (`SpatialContentReadyContext`, `SpatialContentReadyCallback`, prop on the SpatialDiv prop types; `Model` / `Reality` types do not advertise it).
- 1.2 Extend `WebSpatialJSX.IntrinsicElements['div']` in `packages/react/src/jsx/jsx-namespace.ts` to include `onSpatialContentReady?: ...` (other intrinsics: spatial gestures only).
  - ✅ **Resolution:** `packages/react/src/jsx/jsx-namespace.ts:128` (only the `div` intrinsic carries `onSpatialContentReady`).
- 1.3 Ensure degraded rendering paths strip/ignore `onSpatialContentReady` as a DOM attribute. **(Updated semantics)** Per the product-confirmed decision, `onSpatialContentReady` fires ONLY when a real WebSpatial spatial content host exists; degraded / plain-web / pre-boot paths MUST strip the attribute AND MUST NOT invoke the callback.
  - ✅ **Resolution:** both degraded paths strip the attribute and do **not** invoke the callback: real container `DegradedContainer` (`SpatializedContainer.tsx`, the prior fallback-firing `useLayoutEffect` + `enableOnSpatialContentReadyFallback` flag were removed) and the default-entry facade fallback (`facades/withSpatialized2DElementContainer.tsx`, transparent passthrough that strips spatial-only props). The spatial `ref` is still forwarded. Covered by `facades/spatial-content-ready-fallback.test.tsx` and the flipped case in `coverage-boost.test.ts`.

## 2. Runtime wiring (SpatializedContainer / Portal)

- 2.0 Update `SpatialContainerRefProxy.updateDomProxyToRef` so ref dispatches are deduplicated when the effective value does not change (`null`→`null` and same proxy→same proxy), for both object refs and callback refs.
  - ✅ **Resolution:** `spatialized-container/hooks/useDomProxy.ts` + `StandardSpatializedContainer.tsx`; covered by `spatialized-container/hooks/useDomProxy.coverage.test.ts`.
- 2.1 Plumb `onSpatialContentReady` through `SpatializedContainer` props into the portal pipeline without forwarding it to the underlying DOM component as an unknown attribute.
  - ✅ **Resolution:** `SpatializedContainer.tsx` destructures `onSpatialContentReady` out of the DOM `restProps` on both nested and root paths; portal readiness handled by `hooks/useSpatialContentReady.ts`.
- 2.2 Implement ready emission per spec: model `isReady` edge transitions; emit on `false → true` in `useLayoutEffect` after `ctx.host` is connected; run cleanup on `true → false`; do not re-emit while `isReady` remains continuously `true`; never emit during render.
  - ✅ **Resolution:** `hooks/useSpatialContentReady.ts` (rising-edge emit in `useLayoutEffect`, gated on `hostElement.isConnected`, deps keyed on `[spatializedElement, portalInstanceObject.dom, hostElement]`).
- 2.3 Implement cleanup bookkeeping: store last returned cleanup, invoke it on `isReady` falling edge, before a new rising-edge ready, on unmount, and on internal teardown paths (including StrictMode remount cases).
  - ✅ **Resolution:** `hooks/useSpatialContentReady.ts` returns the cleanup from the layout effect (React disposes it on falling edge / dep change / unmount). This is the only firing path, so cleanup bookkeeping lives solely there; degraded paths never fire and therefore have no cleanup to track.

## 3. Nested ordering & safety

- 3.1 Verify nested `enable-xr` scenarios: in WebSpatial runtime, parent ready must occur before child ready; parent recreation must dispose child cleanups depth-first before parent cleanup/next parent ready.
  - 🟡 **Partial:** implemented via layout-effect ordering in the portal pipeline. **Gap:** no dedicated automated test asserts parent-before-child ordering / depth-first child cleanup in a mocked WebSpatial runtime (see 4.1 gap).
- 3.3 Document nested ordering contract split: WebSpatial runtime guarantees parent-before-child ordering; non-WebSpatial fallback does not guarantee ordering.
  - ✅ **Resolution:** `packages/react/README.md` → "SpatialDiv lifecycle differs from a plain `<div>`" → "Nested ordering note".
- 3.2 Add defensive try/catch in dev around user-provided `onSpatialContentReady` and cleanup (log once; do not break React rendering).
  - ✅ **Resolution:** `hooks/useSpatialContentReady.ts` (`safeInvokeCleanup` + try/catch around the callback, dev-only `console.error`). The degraded paths no longer invoke the callback, so this is the only place that needs the guard.

## 4. Tests

- 4.1 Add focused unit/integration tests under `packages/react` (prefer existing test harness) that satisfy the **Acceptance test matrix** in `specs/spatialdiv-content-host-lifecycle/spec.md`.
  - 🟡 **Partial.** Covered by automated tests today:
    - **Sole firing path — `useSpatialContentReady` hook** (`spatialized-container/hooks/useSpatialContentReady.test.tsx`): fires once with the connected spatial host (layout-effect timing, `ctx.host.isConnected`); does NOT fire without a spatial element or when the host is not connected; stable re-render does not re-emit; cleanup runs on unmount.
    - **Default-entry facade plain-web fallback** (`facades/spatial-content-ready-fallback.test.tsx`): callback NOT invoked; attribute not leaked; spatial `ref` still forwarded to the connected fallback host; not invoked on re-render/unmount.
    - **Real `SpatializedContainer` degraded fallback** (`coverage-boost.test.ts`): attribute not leaked; callback NOT invoked (flipped from the old "invoked once" assertion to match the new semantics).
  - **Gaps (still to cover):**
    - Strict "no synchronous invocation **during render**" assertion (currently inferred via `host.isConnected` at call time).
    - **Attachment-degraded** path: dedicated test that the attribute is stripped AND the callback is not invoked (currently covered indirectly by the unified "degraded paths never fire" rule, not a named attachment test).
    - **Nested parent-before-child** ordering on the same rising edge in a mocked WebSpatial runtime (no end-to-end automated test yet).
    - `Model` / `Reality` "same spatial ref timing as SpatialDiv" scenario.
- 4.2 Regression: degraded container does not forward `onSpatialContentReady` to DOM attributes (and, per updated semantics, does not invoke it).
  - ✅ **Resolution:** asserted in both `coverage-boost.test.ts` (real container: stripped + not invoked) and `facades/spatial-content-ready-fallback.test.tsx` (facade path: stripped + not invoked).
- 4.3 Unit tests for ref deduplication: repeated internal updates must not re-invoke callback refs with the same `null` or same proxy object.
  - 🟡 **Partial:** proxy-level `updateDomProxyToRef` dedup covered in `hooks/useDomProxy.coverage.test.ts`; the facade fallback test confirms the spatial `ref` is forwarded to the connected host. **Gap:** no single test ties these to the exact spec scenarios "No duplicate callback for unchanged null/non-null state" by name.

## 5. Docs & demos

- 5.1 Update React SDK documentation with a prominent “SpatialDiv lifecycle differs from plain div” section and Do/Don’t examples.
  - ✅ **Resolution:** `packages/react/README.md` lifecycle section now states `onSpatialContentReady` fires **only** in a WebSpatial runtime, with a "Do — spatial path via `onSpatialContentReady`", a "Do — flat-web path via your own `ref` + effect", and a "Don't — `useEffect([])` + child ref" example, plus the child-DOM-ref warning and the (WebSpatial-only) nested-ordering note.
- 5.2 Add or extend a `apps/test-server` page demonstrating nested `enable-xr` + external renderer attach, with visible logging counters for ready/cleanup ordering.
  - ✅ **Resolution:** `apps/test-server/src/pages/spatial-content-ready-three/` (registered in `apps/test-server/index.tsx` + `Sidebar.tsx`). Updated for the new semantics: because `onSpatialContentReady` no longer fires on flat web, the demo attaches the renderer via its own `ref` + effect on flat web and via `onSpatialContentReady` in a WebSpatial runtime (a runtime badge shows which path is active) — demonstrating the correct split.

## 6. Verification

- 6.1 `pnpm -F @webspatial/react-sdk run build` (and the targeted tests above).
  - ✅ **Resolution:** `pnpm --filter @webspatial/react-sdk test` (tsc + tsup + vitest) green, including the new fallback suite; `dist/index.js` size budget unchanged.