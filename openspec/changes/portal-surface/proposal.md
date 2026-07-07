## Why

Modal, command palette, toast, and similar app-level overlays often rely on a complete document-level DOM shape: wrapper, mask, dialog, footer, focus sentinels, theme styles, and internal portals all need to live in the same document. Spatializing only the already-rendered modal content with `modalRender` can split that DOM across the host page and a child webview, causing ancestor-dependent component styles and portal targets to break.

We need a first-class React primitive for "render this subtree inside a raised, viewport-sized spatial surface" so common overlay components can keep their ordinary web DOM structure while appearing in front of the main webview.

## What Changes

- Add a React SDK component, tentatively named `PortalSurface`, for viewport-sized raised UI:
  - renders its children into a child spatial webview document;
  - sizes the spatial surface to the main viewport by default;
  - exposes depth/ordering controls such as `zOffset`;
  - reuses the existing SpatialDiv portal window, head-style sync, and `SpatialWindowContext` machinery where possible.
- Define `PortalSurface` as an app-level overlay primitive, distinct from `SpatialOverlay`:
  - `SpatialOverlay` bridges floating UI or plugin content into an existing menu surface;
  - `PortalSurface` owns the full raised document surface for modal-like UI.
- Require portal-aware children to route their own internal portals to `useSpatialPortalContainer()` or an equivalent SDK-provided container hook/provider when they need same-document modal DOM.
- Document style inheritance boundaries:
  - existing host-to-portal head sync covers stylesheets, inline style tags, CSS-in-JS rules, and common root class/style inheritance;
  - `PortalSurface` does not promise to recreate arbitrary host-page ancestor DOM selectors such as `.app-shell .page .modal`.
- Add demo and verification coverage for a controlled modal rendered inside `PortalSurface`, including style correctness and close/confirm interaction.
- **BREAKING**: none. This is an additive React SDK API.

## Capabilities

### New Capabilities

- `portal-surface`: React SDK support for rendering modal-like overlay subtrees into a raised, viewport-sized spatial surface while preserving the subtree's document-local DOM, styles, portal container, and interaction semantics.

### Modified Capabilities

- None.

## Impact

- `packages/react`: new public component and related types/exports.
- `packages/react/src/spatialized-container`: reuse of the SpatialDiv low-level spatial webview creation, portal window style sync, `SpatialWindowContext`, and viewport sizing primitives without rendering `PortalSurface` children through the hidden standard host.
- `apps/test-server`: add a demo page or extend an existing overlay/modal page to verify `PortalSurface` with a controlled modal.
- `docs` / `packages/react/README.md`: document the API, style inheritance boundary, and portal container integration guidance.
- Tests: React SDK unit coverage for public exports, viewport sizing semantics, spatial portal container availability, and degraded/plain-web behavior; optional AVP smoke for click/close behavior.
