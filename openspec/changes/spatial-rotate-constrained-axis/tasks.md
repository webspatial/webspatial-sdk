# Tasks: spatial-rotate-constrained-axis

## 1. Spec & docs

- [x] Add OpenSpec change proposal, design, tasks, and delta spec under `openspec/changes/spatial-rotate-constrained-axis/`.

## 2. Core SDK

- [x] Add `rotateConstrainedToAxis?: Vec3` to `SpatializedElementProperties` in `packages/core/src/types/types.ts`.

## 3. React SDK

- [x] Export `SpatialEventOptions` and add `spatialEventOptions?` to `PortalSpatializedContainerProps` / container props.
- [x] Add `spatialEventOptions?` to JSX intrinsic elements (`jsx-namespace.ts`), `Spatialized2DElementContainerProps`, and `SpatializedStatic3DContainerProps`.
- [x] In `PortalSpatializedContainer`, sync axis via `updateProperties` in `useEffect` (not forwarded to DOM).
- [x] In `DegradedContainer` and `Model.tsx` degraded path, strip `spatialEventOptions` for non-XR fallback.

## 4. visionOS

- [x] Add `rotateConstrainedToAxis` to Swift `SpatializedElementProperties` protocol and update structs in `JSBCommand.swift`.
- [x] Add property on `SpatializedElement` and apply in `updateSpatializedElementProperties` in `SpatialScene.swift`.
- [x] Use `RotateGesture3D(constrainedToAxis:)` in `SpatializedElementView.swift` and `SpatializedDynamic3DView.swift` when axis is non-degenerate.

## 5. Verification

- [x] `pnpm -F @webspatial/core-sdk run build` and `pnpm -F @webspatial/react-sdk run build` (visionOS `xcodebuild` requires local simulator/Xcode).

## 6. Test page

- [x] Add `spatial-rotate-axis-constraint` page in test-server with scenario coverage (10 scenarios: omit, zero, ±X/Y/Z, unnormalized, tuple, object, oblique, near-zero).
