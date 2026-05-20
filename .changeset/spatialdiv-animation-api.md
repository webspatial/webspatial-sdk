---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
'web-content': patch
---

Add SpatialDiv animation support through the shared `useAnimation` API.

**Core SDK**
- Add SpatialDiv animation command/types and bridge support for `AnimateSpatialized2DElement`.
- Add `supports('useAnimation', ['entity'])` and `supports('useAnimation', ['element'])` capability sub-tokens.

**React SDK**
- Route `useAnimation(config)` to entity or SpatialDiv animation based on config keys.
- Add SpatialDiv animation props, validation, lifecycle callbacks, playback controls, and sync suppression for the visual-only whitelist: `transform.translate`, `transform.rotate`, `transform.scale`, and `opacity`.

**visionOS native**
- Add CADisplayLink-driven SpatialDiv animation playback for visual transform/opacity interpolation, including pause/resume/cancel, loop handling, and terminal events.

**Test server**
- Add SpatialDiv animation demo pages for visual animation cases such as opacity, transform, delay, and playback rate.
