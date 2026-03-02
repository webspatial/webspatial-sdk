---
'@webspatial/react-sdk': minor
---

Expose per-event convenience fields on Spatial Events to mirror `detail`:

- `SpatialDragEvent.translationX/Y/Z` (from `detail.translation3D`)
- `SpatialRotateEvent.quaternion` (from `detail.quaternion`)
- `SpatialMagnifyEvent.magnification` (from `detail.magnification`)
