## ADDED Requirements

### Requirement: visionOS main-page host windows derive a default effective corner radius

The visionOS SDK MUST derive the main-page host window's effective corner radius from the scene background material until an explicit `UpdateSpatialSceneProperties.cornerRadius` override arrives.

#### Scenario: Non-transparent main page starts with rounded corners

- **WHEN** a visionOS main-page scene is initialized without an explicit `cornerRadius`
- **AND** the effective background material is not transparent
- **THEN** the effective main-page corner radius MUST default to `44`

#### Scenario: Transparent main page starts with square corners

- **WHEN** a visionOS main-page scene is initialized without an explicit `cornerRadius`
- **AND** the effective background material is transparent
- **THEN** the effective main-page corner radius MUST default to `0`

#### Scenario: Material changes update the derived default before explicit override

- **WHEN** a visionOS main-page scene has not received an explicit `cornerRadius`
- **AND** the background material changes between transparent and non-transparent states
- **THEN** the effective main-page corner radius MUST update between `0` and `44` to match the current material-derived default

### Requirement: Explicit main-page corner radius overrides the material-derived default

The visionOS SDK MUST treat `UpdateSpatialSceneProperties.cornerRadius` as a higher-priority explicit override than the material-derived default main-page corner radius.

#### Scenario: Explicit corner radius wins over non-transparent default

- **WHEN** a visionOS main-page scene currently uses the non-transparent default corner radius of `44`
- **AND** an explicit `cornerRadius` update arrives
- **THEN** the scene MUST apply the explicit corner radius instead of the material-derived default

#### Scenario: Explicit corner radius wins over transparent default

- **WHEN** a visionOS main-page scene currently uses the transparent default corner radius of `0`
- **AND** an explicit `cornerRadius` update arrives
- **THEN** the scene MUST apply the explicit corner radius instead of the material-derived default

### Requirement: SpatialDiv corner behavior remains unchanged

The visionOS SDK MUST keep `Spatialized2DElement` corner-radius behavior separate from the main-page host window default-corner logic.

#### Scenario: SpatialDiv default remains independent

- **WHEN** a `Spatialized2DElement` is created without an explicit `cornerRadius`
- **THEN** its corner radius behavior MUST remain unchanged by the main-page host window default-corner rules
