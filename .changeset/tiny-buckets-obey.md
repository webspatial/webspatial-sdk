---
'@webspatial/react-sdk': patch
---

Add a SpatialDiv-only `onSpatialContentReady` lifecycle with layout-effect timing and cleanup, ensure ref dispatch is deduplicated and available before ready callbacks, and include a Three.js test-server page for nested ready/cleanup verification.
