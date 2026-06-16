---
'@webspatial/react-sdk': minor
---

Add Radix/floating-UI integration for SpatialDiv menus:

- `useSpatialPortalContainer()` returns the nearest SpatialDiv window document body so floating libraries (e.g. Radix) can portal content into the correct spatial window. `Spatialized2DElementContainer` now provides `SpatialWindowContext` for portal content, and degraded mode exposes the host window.
- Nested floating menu surfaces can opt into child-surface overlay behavior with `data-xr-overlay` on the inner `enable-xr` element. WebSpatial keeps a hidden measurement host in the parent spatial window, attaches the visible menu surface to the parent SpatialDiv, and leaves placement to Radix or the floating UI library.
- `SpatialOverlay`, `useSpatialOverlay()`, and the `SpatialOverlayPortalOption` type bridge plugin-hosted overlay content into a same-document measurement target and a visible spatial portal target.
