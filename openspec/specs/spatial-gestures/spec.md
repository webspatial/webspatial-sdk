# Spatial gestures (spatialized elements)

## Requirements

### Requirement: Rotate gesture axis constraint

The system MUST allow constraining spatial **rotate** gestures to a single axis defined by a 3D direction vector.

On visionOS, `constrainedToAxis` uses the coordinate space where the native recognizer is attached. SpatialDiv/Model attach it to the target view, so the vector is in the target's pre-transform direct-parent axes. Entity gestures attach it to the Reality view, so the vector is in Reality/scene axes. This input constraint is distinct from the returned rotation delta, which is always parent-local.

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

Continuous `spatialDrag` `translation3D` space is specified in the following requirement.

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

### Requirement: Drag translation is parent-local

The system MUST report `spatialDrag` `translation3D` as the cumulative displacement of the hit point from drag-start to the current sample, expressed in the event target's **direct parent** local space. Native MUST compute this from converted hit points and MUST NOT forward the gesture recognizer's view-space `translation3D`.

The target's own transform MUST NOT be folded into `translation3D`. A parent transform MUST be, because that is the space in which the target's `position` / child `translate` is written. If the target has no parent SpatialDiv / SpatialEntity, parent space is SpatialScene (CSS pixels, Y-down) or the Reality scene (meters, Y-up) respectively.

#### Scenario: Root SpatialDiv translation matches scene displacement

- **GIVEN** a SpatialDiv whose parent is the SpatialScene (no ancestor CSS rotate/scale)
- **WHEN** the user drags it
- **THEN** `translation3D` MUST equal the SpatialScene displacement of the hit from drag-start, in CSS pixels
- **AND** adding it to the element's CSS `translate3d` MUST move the element with the hand

#### Scenario: Nested SpatialDiv translation follows the parent axes

- **GIVEN** a child SpatialDiv whose parent has a CSS `rotate` or `scale`
- **WHEN** the user drags the child
- **THEN** `translation3D` MUST be the hit displacement in the **parent** SpatialDiv's pre-transform local space (CSS pixels)
- **AND** it MUST NOT be the raw SpatialScene displacement (which would move the child along the parent's local axes instead of with the hand once added to the child's `translate`)

#### Scenario: Entity translation is parent-local meters

- **GIVEN** a SpatialEntity with `enableInput`, possibly nested under a rotated/scaled parent entity
- **WHEN** the user drags it
- **THEN** `translation3D` MUST be in the parent entity's local space in meters (Reality scene space if there is no parent), Y-up
- **AND** `position = dragStartPosition + translation3D` MUST move the entity with the hand without a points-to-meters scale or a Y flip

### Requirement: Rotation delta is parent-local

The system MUST report `spatialRotate` `quaternion` as a cumulative rotation from gesture start, expressed in the event target's **direct parent** axes. With no spatial parent, the basis is SpatialScene for SpatialDiv/Model or Reality scene for Entity. Native MUST convert the recognizer's local rotation into that basis, including the SwiftUI-to-Reality axis convention for Entity.

The target's own rotation and scale MUST NOT change the delta's basis. Consumers MUST compose `orientation = deltaQuaternion * gestureStartOrientation`; they MUST NOT repeatedly accumulate the cumulative delta or add its Euler angles to the current orientation. Scaling is not a rotation and MUST NOT be applied to the quaternion's angle.

#### Scenario: Rotation under a rotated parent

- **GIVEN** a target under a rotated parent, with its own non-identity orientation
- **WHEN** a rotate sample is delivered
- **THEN** the quaternion MUST express the gesture about the parent's axes
- **AND** left-multiplying the gesture-start orientation MUST apply that parent-local delta
- **AND** an identity gesture delta MUST remain identity

#### Scenario: Rotation hits a model child mesh

- **GIVEN** the recognizer targets an internal mesh below a Web-facing SpatialEntity
- **WHEN** rotate or rotate-end is delivered
- **THEN** the event MUST target the nearest Web-facing SpatialEntity, as tap and drag do
- **AND** the rotation basis MUST be that SpatialEntity's parent, not the internal mesh's parent

#### Scenario: Non-invertible SpatialDiv parent

- **GIVEN** a parent transform with a zero scale axis
- **WHEN** the parent-local rotation basis cannot be computed
- **THEN** native MUST NOT emit a quaternion containing invalid values or silently label a scene-space rotation as parent-local
