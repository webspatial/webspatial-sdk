## ADDED Requirements

### Requirement: Declare SpatialDiv animation support

The runtime capability API MUST document and resolve the top-level key `spatialDivAnimation`, indicating whether the current runtime supports `SpatialDiv` whitelisted-property animation end-to-end.

#### Scenario: Supported runtime

- **WHEN** the runtime provides the React integration, Core command flow, JSBridge, and native playback behavior required for `SpatialDiv` animation
- **THEN** `supports('spatialDivAnimation')` MUST return `true`

#### Scenario: Unsupported runtime

- **WHEN** the runtime lacks any critical capability required for `SpatialDiv` animation
- **THEN** `supports('spatialDivAnimation')` MUST return `false`

#### Scenario: Stable supports results

- **WHEN** application code calls `supports('spatialDivAnimation')` multiple times within the same runtime process lifetime
- **THEN** the result MUST remain stable and MUST NOT change at runtime

#### Scenario: Independent from entity animation capability

- **WHEN** a runtime supports entity transform animation but not `SpatialDiv` animation, or vice versa
- **THEN** `supports('useAnimation')` and `supports('spatialDivAnimation')` MUST independently return their corresponding results
- **AND** one capability key result MUST NOT implicitly imply the other