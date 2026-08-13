## Why

`convertCoordinate` currently returns the input position unchanged in non-WebSpatial browsers (and when no spatial session is reachable). That silent success hides misuse: callers believe a coordinate transform occurred when none did. The original `runtime-capabilities` contract and archived runtime-feature-detection change required `WebSpatialRuntimeError` on unsupported invocation; lazy-load temporarily switched to graceful degradation. Fail-fast restores predictable, debuggable behavior.

## What Changes

- **BREAKING:** `convertCoordinate` throws `WebSpatialRuntimeError` when `supports('convertCoordinate')` is `false` (non-WebSpatial browser, SSR / no `window`).
- **BREAKING:** `convertCoordinate` throws `WebSpatialRuntimeError` when the capability is supported but no `SpatialSession` / `SpatialScene` is reachable (for example before `bootSpatial()` resolves).
- **BREAKING:** Invalid `from` / `to` refs throw `WebSpatialRuntimeError` with diagnostic context instead of returning the input unchanged.
- Remove one-shot `console.warn` degradation latch from the React SDK implementation.
- Update unit tests, README, and `docs/convertCoordinate.md`.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `runtime-capabilities`: split `useMetrics` hook vs `convertCoordinate` unsupported contracts; pin fail-fast for `convertCoordinate`.
- `spatial-lazy-load`: update Group B utility table and scenarios for `convertCoordinate` (no longer graceful-degrades).

## Impact

- **Code:** `packages/react/src/utils/convertCoordinate.ts`
- **Tests:** `packages/react/src/__tests__/stateless-utilities.test.tsx`
- **Docs:** `packages/react/README.md`, `docs/convertCoordinate.md`
