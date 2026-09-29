# Spatial gestures (spatialized elements)

## Requirements

### Requirement: Rotate gesture axis constraint

The system MUST allow constraining spatial **rotate** gestures to a single axis defined by a 3D direction vector.

#### Scenario: Unconstrained rotation

- **GIVEN** the developer does not set `spatialEventOptions.constrainedToAxis`, or sets it to `[0, 0, 0]`
- **WHEN** the user performs a spatial rotate gesture on the element
- **THEN** the platform MUST behave as it did before this change (unconstrained 3D rotation where supported)

#### Scenario: Z-axis-only rotation

- **GIVEN** `spatialEventOptions.constrainedToAxis` is `[0, 0, 1]` (or any non-zero vector parallel to Z)
- **WHEN** the user performs a spatial rotate gesture
- **THEN** the visionOS implementation MUST pass the corresponding axis into `RotateGesture3D`'s `constrainedToAxis` parameter so rotation is measured about that axis

#### Scenario: Vector normalization

- **GIVEN** `constrainedToAxis` is a non-zero vector
- **WHEN** the value is applied on the native side
- **THEN** the implementation MUST use the **direction** of the vector only (normalize); magnitude MUST NOT change the axis semantics

#### Scenario: Dynamic axis change

- **GIVEN** the developer changes `spatialEventOptions.constrainedToAxis` at runtime (e.g. from `[0, 0, 1]` to `[1, 0, 0]`)
- **WHEN** the user performs a new spatial rotate gesture after the change
- **THEN** the platform MUST use the updated axis for the new gesture
- **AND** a gesture that is already in progress MAY continue using the previous axis until it ends (mid-gesture reconfiguration is not guaranteed)

#### Scenario: Reset to unconstrained

- **GIVEN** the developer changes `spatialEventOptions.constrainedToAxis` from a non-zero vector back to `[0, 0, 0]`, or removes `spatialEventOptions` entirely
- **WHEN** the user performs a new spatial rotate gesture
- **THEN** the platform MUST revert to unconstrained rotation behavior

#### Scenario: Near-zero vector

- **GIVEN** `constrainedToAxis` is a vector whose magnitude is below the platform's floating-point epsilon (e.g. `[1e-15, 0, 0]`)
- **WHEN** the value is applied on the native side
- **THEN** the implementation SHOULD treat it as unconstrained (same as zero vector) rather than producing undefined behavior

### Requirement: Tap and drag-start hit points

The system MUST report `spatialTap` and `spatialDragStart` hit points in two explicit spaces. Native MUST convert the platform gesture location into those spaces and MUST NOT forward the gesture recognizer's default `.local` coordinates as the web-facing local point.

`detail.location3D` (tap) and `detail.startLocation3D` (drag-start) are the target-local point (`offsetX/Y/Z` on the React event). `detail.globalLocation3D` is the same hit in SpatialScene / window space (`clientX/Y/Z`). Tap and drag-start MUST use the same target-local definition.

Continuous `spatialDrag` `translation3D` space is out of scope for this requirement.

#### Scenario: SpatialDiv tap ignores the element's own transform

- **GIVEN** a SpatialDiv (or independent Model) with `--xr-back` and a CSS `transform` that includes translation, rotation, scale, and a non-default `transform-origin`
- **WHEN** the user taps the top-left corner of the element's front face
- **THEN** `offsetX`, `offsetY`, and `offsetZ` MUST be approximately `0` (CSS pixels, top-left origin, front face `z = 0`)
- **AND** `clientX/Y/Z` MUST be the same hit in SpatialScene / window CSS pixels (so they DO move when the element is transformed)

#### Scenario: Entity tap is target-local meters

- **GIVEN** a Web-facing SpatialEntity with a non-zero `position` / `rotation` / `scale`, possibly under a Reality container that itself has CSS transform or `--xr-back`
- **AND** `enableInput` is true so the entity is hit-testable
- **WHEN** the user taps near the entity's local origin
- **THEN** `offsetX/Y/Z` MUST be approximately `(0, 0, 0)` in meters in that SpatialEntity's local space
- **AND** `clientX/Y/Z` MUST be the same hit in window CSS pixels

#### Scenario: Hit on a child mesh dispatches to the SpatialEntity

- **GIVEN** a SpatialEntity whose visible geometry is a child RealityKit mesh
- **WHEN** the gesture hits that child mesh
- **THEN** the event target MUST be the nearest Web-facing SpatialEntity
- **AND** `location3D` MUST be converted into that SpatialEntity's local space, not left in the child mesh's space or in the Reality view's SwiftUI local space
