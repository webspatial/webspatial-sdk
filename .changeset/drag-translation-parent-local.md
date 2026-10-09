---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
'@webspatial/platform-visionos': patch
---

Report `spatialDrag` `translation3D` in the target's direct parent space (CSS pixels for SpatialDiv, meters for Entity) so nested and transformed parents can add it to `translate` / `position` without a unit or axis conversion.
