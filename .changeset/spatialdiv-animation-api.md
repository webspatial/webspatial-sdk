---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
'web-content': patch
---

Add spatialized element motion support through the React `useAnimation` API.

**Core SDK**
- Add canonical spatialized motion config, validation, timeline sampling, and playback controller.
- Add web/native playback backends and native timeline serialization for spatialized motion.
- Add runtime capability routing for spatialized2d, static3d, and dynamic3d motion.

**React SDK**
- Add `useAnimation` support for spatialized element/container motion.
- Add spatialized-container motion binding, playback controls, lifecycle callbacks, and sync suppression for transform/opacity motion.
- Keep entity animation on the existing `useEntityAnimation` entrypoint.

**visionOS native**
- Add native spatialized element motion sessions, timeline sampling, transform adapters, and terminal event callbacks.

**Test server**
- Add spatialized element motion demo pages covering opacity, transform, delay, looping, playback rate, and native-backed containers.
