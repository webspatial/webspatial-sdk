---
'@webspatial/react-sdk': minor
---

Add Radix/floating-UI integration for SpatialDiv menus:

- `useSpatialPortalContainer()` returns the nearest SpatialDiv window document body so floating libraries (e.g. Radix) can portal content into the correct spatial window. `Spatialized2DElementContainer` now provides `SpatialWindowContext` for portal content, and degraded mode exposes the host window.
- `SpatialOverlay`, `useSpatialOverlay()`, and the `SpatialOverlayPortalOption` type bridge plugin-hosted overlay content into a same-document measurement target and a visible spatial portal target.
