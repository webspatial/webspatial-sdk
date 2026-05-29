# Proposal: Spatial rotate axis constraint (SpatialDiv)

## Intent

Allow developers to constrain spatial **rotate** interaction to a single axis (e.g. Z only) for `SpatialDiv` / spatialized containers, so rotation gestures do not affect other axes.

## Scope

- **In scope**
  - React API: `spatialEventOptions={{ constrainedToAxis: [x, y, z] }}` on spatialized containers that support `onSpatialRotate`.
  - Core: extend `SpatializedElementProperties` with `rotateConstrainedToAxis` (Vec3) carried by existing `UpdateSpatialized*ElementProperties` JSB commands.
  - visionOS: store axis on `SpatializedElement` and pass `RotationAxis3D` into `RotateGesture3D(constrainedToAxis:)` in `SpatializedElementView`.
- **Out of scope**
  - Android / other platforms (no change unless they read the same property later).
  - Changing quaternion payload or event shape for `spatialrotate`.

## Approach

- **Semantics**: `constrainedToAxis` is a direction vector in **scene/world space**; implementation normalizes non-zero vectors. **`[0, 0, 0]` or omission** means **unconstrained** (same as today).
- **Transport**: Same JSON field `rotateConstrainedToAxis: { x, y, z }` on partial updates from JS to native.
- **Extensibility**: `spatialEventOptions` is a container object designed to host future gesture/pointer options (e.g. drag axis constraints, magnify sensitivity) without polluting the element's top-level prop surface. `constrainedToAxis` is its first member.

## Risks

- **World vs local space**: The axis is always interpreted in **world space**. If an element has a CSS `transform` (e.g. `rotateX(45deg)`), the constraint axis does NOT rotate with the element. This may be unintuitive for some use cases; a future `constraintSpace: 'local'` option could address this if needed.
- **Mid-gesture reconfiguration**: Changing `constrainedToAxis` while a rotate gesture is in progress may not take effect until the next gesture session; this is platform-dependent and is documented as expected behavior.
- **visionOS API availability**: `RotateGesture3D(constrainedToAxis:)` requires visionOS 1.0+. If future platforms lack an equivalent API, they should fall back to unconstrained rotation.
