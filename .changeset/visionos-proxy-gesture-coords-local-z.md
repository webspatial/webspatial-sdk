---
"@webspatial/platform-visionos": patch
---

Fix visionOS spatial element transform and gesture coordinates: use proxy transform only for local→scene (drop getBoundingClientCube); clarify location3D (element local) vs globalLocation3D (scene); define semantic local z with front face = 0 via localFrameOffsetZ (zIndex + backOffset, exclude translateZ). Rename GestureFlags to GestureState.
