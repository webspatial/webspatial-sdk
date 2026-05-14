## ADDED Requirements

### Requirement: Declare SpatialDiv animation support

The runtime capability API MUST document and resolve the sub-token `useAnimation` + `['element']`, indicating whether the current runtime supports `SpatialDiv` visual-whitelist animation end-to-end.

#### Scenario: Supported runtime

- **WHEN** the runtime provides the React integration, Core command flow, JSBridge, and native playback behavior required for `SpatialDiv` animation
- **THEN** `supports('useAnimation', ['element'])` MUST return `true`

#### Scenario: Unsupported runtime

- **WHEN** the runtime lacks any critical capability required for `SpatialDiv` animation
- **THEN** `supports('useAnimation', ['element'])` MUST return `false`

#### Scenario: Stable supports results

- **WHEN** application code calls `supports('useAnimation', ['element'])` multiple times within the same runtime process lifetime
- **THEN** the result MUST remain stable and MUST NOT change at runtime

#### Scenario: Independent from entity animation capability

- **WHEN** a runtime supports entity transform animation but not `SpatialDiv` animation, or vice versa
- **THEN** `supports('useAnimation', ['entity'])` and `supports('useAnimation', ['element'])` MUST independently return their corresponding results
- **AND** one sub-token result MUST NOT implicitly imply the result of another sub-token
