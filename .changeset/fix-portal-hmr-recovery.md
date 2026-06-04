---
'@webspatial/react-sdk': minor
---

Fix portal content crash and blank webview when hot-reloading linked SDK source during local development.

Mount portal `<Content />` when `spatializedElement` exists (no longer gated on `portalInstanceObject.dom`). `onSpatialContentReady` still requires `dom` and a connected host; `useSync2DFrame` re-syncs the 2D frame on mount and when the element is replaced. Observable render timing in production may shift slightly earlier on first paint.
