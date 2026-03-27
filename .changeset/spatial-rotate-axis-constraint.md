---
"@webspatial/core-sdk": minor
"@webspatial/react-sdk": minor
"@webspatial/platform-visionos": minor
---

Spatial rotate axis constraint for spatialized elements.

- **Core**
  - `SpatializedElementProperties` adds optional `rotateConstrainedToAxis` (Vec3) on partial updates to native.
- **React**
  - `spatialEventOptions={{ constrainedToAxis: Vec3 | [number, number, number] }}` on spatialized containers and JSX intrinsics (`enable-xr`); omit or `[0,0,0]` means unconstrained.
  - `PortalSpatializedContainer` syncs axis via `updateProperties`; `Model` / degraded paths strip `spatialEventOptions` from DOM.
- **visionOS**
  - `RotateGesture3D(constrainedToAxis:)` when axis is non-zero; world-space axis, normalized on native.
