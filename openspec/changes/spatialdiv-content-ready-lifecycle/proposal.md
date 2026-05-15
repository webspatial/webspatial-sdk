# Proposal: SpatialDiv content-ready lifecycle (`onSpatialContentReady`)

## Why

`enable-xr` / `SpatialDiv` does not behave like a plain `div` at the DOM level: the SDK maintains a hidden layout/sampling host tree and a separate visible content tree rendered via a portal / isolated `windowProxy`. When developers follow the common web pattern of `ref` + `useEffect([])` + child DOM `ref`, they can hit timing issues (`ref` is still `null`), miss later transitions, or attach external renderers (for example a Three.js `WebGLRenderer` canvas) to a host that is not the visible content surface.

We need an explicit, testable, and documentable lifecycle hook that fires when the visible content host is ready for imperative mounting, and that supports reliable teardown across unmounts, StrictMode remount probes, and internal recreation.

## What Changes

- Add a React prop: `onSpatialContentReady?: (ctx) => void | (() => void))` that notifies app code when the SpatialDiv **visible content host** is ready, and supports returning a cleanup function.
- Extend `WebSpatialJSX.IntrinsicElements` typings for `enable-xr` elements to include this prop alongside existing spatial gesture props (for example `onSpatialTap`).
- Invoke the callback from the `SpatializedContainer` / `PortalSpatializedContainer` lifecycle with a documented ordering contract relative to `ref` availability (see `design.md` / `spec.md`).
- Add documentation and `apps/test-server` examples that contrast SpatialDiv lifecycle with plain `div`, show a recommended Three.js integration, and document nested SpatialDiv parent/child ordering constraints.
- **BREAKING**: none (optional additive API; default rendering behavior stays the same).

## Capabilities

### New Capabilities

- `spatialdiv-content-host-lifecycle`: specifies `onSpatialContentReady` firing conditions, ordering contracts, cleanup semantics, nested behavior, and explicitly **non-guaranteed** behavior for child DOM `ref` usage inside `enable-xr`.

### Modified Capabilities

- None (`openspec/specs/` is currently empty, and this change is primarily additive).

## Impact

- `packages/react/src/jsx/jsx-namespace.ts` (IntrinsicElements typing extension)
- `packages/react/src/spatialized-container/*` (`SpatializedContainer`, `PortalSpatializedContainer`, `types.ts`, and related plumbing)
- `apps/test-server` (add or extend demo pages covering StrictMode and nested scenarios)
- Documentation: add a prominent SpatialDiv lifecycle note to the React SDK README or SpatialDiv guide (exact file chosen during implementation; not mandated by this proposal).
