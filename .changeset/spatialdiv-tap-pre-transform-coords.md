---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
'@webspatial/platform-visionos': patch
---

Fix SpatialDiv / `<Model>` `spatialtap` / `spatialdragstart` hit-point coordinates. Gestures are now captured in the SpatialScene coordinate space and inverted through the element's full placement chain, so `offsetX/Y/Z` is the pre-transform element-local point (CSS pixels, top-left origin, front face `z = 0`) and no longer leaks the element's own CSS `transform`. `clientX/Y/Z` is the true visual hit point in SpatialScene / window pixels, so it now accounts for CSS `transform`.
