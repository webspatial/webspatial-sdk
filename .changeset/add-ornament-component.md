---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
---

Add Ornament support across the Core SDK, React SDK, and visionOS platform runtime.

**Core SDK**
- Add `SpatialSession.createOrnament()` and `SpatialScene.addOrnament()` for creating window-backed ornaments.
- Add Ornament option normalization, protocol serialization, update, and destroy support, including `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, and `backgroundMaterial`.

**React SDK**
- Add the `<Ornament />` component with window-level portal rendering and parent head/style synchronization.
- Treat Ornament content as non-spatial: nested SpatialDiv content renders as plain DOM, `Model` falls back to native `<model>`, `Reality` renders `null`, and Ornament inside Attachment or Ornament is ignored with a development warning.

**visionOS native**
- Add SwiftUI `.ornament(...)` hosting for WebSpatial Ornament windows.
- Apply background material and corner radius styling through the existing SpatialDiv material/corner pipeline.
