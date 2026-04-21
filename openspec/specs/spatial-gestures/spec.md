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
