# Design: rotateConstrainedToAxis

## API (React)

- `spatialEventOptions?: { constrainedToAxis?: Vec3 | [number, number, number] }`
- Tuple form is normalized to `{ x, y, z }` before calling `updateProperties`.
- `spatialEventOptions` is surfaced on:
  - JSX intrinsic elements (via `WebSpatialJSX.IntrinsicElements` in `jsx-namespace.ts`)
  - `PortalSpatializedContainerProps`
  - `Spatialized2DElementContainerProps`
  - `SpatializedStatic3DContainerProps` (used by `<Model>`)
- `Model.tsx` degraded path (non-XR / insideAttachment) strips `spatialEventOptions` to prevent DOM leak.

## Core (TypeScript)

- Extend `SpatializedElementProperties` with optional `rotateConstrainedToAxis?: Vec3`.
- `PortalSpatializedContainer` runs an effect when `spatializedElement` or the normalized axis key changes and calls `spatializedElement.updateProperties({ rotateConstrainedToAxis })`.
- The dependency key is computed by normalizing to `Vec3` first, so `[0,1,0]` and `{x:0,y:1,z:0}` produce the same key and avoid spurious updates.
- Unconstrained: send `{ x: 0, y: 0, z: 0 }` (explicit) so native can reset without relying on "missing key" merge behavior.

## Coordinate space

- The constraint axis is in **world space** (scene space). It does NOT rotate with the element's CSS `transform`. This is consistent with how `RotateGesture3D(constrainedToAxis:)` interprets the axis on visionOS.

## Runtime axis change

- Changing `constrainedToAxis` at runtime triggers `updateProperties` on the native side. SwiftUI will rebuild the gesture configuration on the next view update.
- A gesture already in progress MAY continue using the previous axis; the new axis is guaranteed to apply from the next gesture session.

## visionOS (Swift)

- `SpatializedElement`: `var rotateConstrainedToAxis: Vec3?` — `nil` or zero-length vector → unconstrained.
- `SpatializedElementView` / `SpatializedDynamic3DView`: `makeRotateGesture3D()` returns `RotateGesture3D(constrainedToAxis: axis)` when axis is non-zero; else `RotateGesture3D()`.
- `RotationAxis3D`: built from normalized `Vec3` components (Double). Vectors with magnitude below `1e-9` are treated as zero (unconstrained).

## JSB

- Add optional `rotateConstrainedToAxis` to `SpatializedElementProperties` protocol and to `UpdateSpatialized2DElementProperties`, `UpdateSpatializedStatic3DElementProperties`, `UpdateSpatializedDynamic3DElementProperties` structs.
- `updateSpatializedElementProperties` applies the field when present.
