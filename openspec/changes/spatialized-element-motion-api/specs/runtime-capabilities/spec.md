## ADDED Requirements

### Requirement: Advertise spatialized element animation support

The runtime capability API MUST document and resolve the key `useAnimation` as the public capability gate for released container motion. Target names such as `spatialized2d`, `static3d`, and `dynamic3d` are internal binding-resolution kinds and MUST NOT be exposed as `useAnimation` sub-tokens.

Applications MUST check `supports('useAnimation')` before relying on the motion API.

#### Scenario: Motion API is supported

- **WHEN** the current runtime implements `CreateSpatializedElementAnimation`, `ControlSpatializedElementAnimation`, `SpatialAnimationStateChanged`, element animating mask behavior, and the released Entity animation path
- **THEN** `supports('useAnimation')` MUST return `true`

#### Scenario: Pure Web runtime returns false

- **WHEN** the current runtime is a pure Web runtime without the native AnimationObject bridge
- **THEN** `supports('useAnimation')` MUST return `false`

#### Scenario: Container target sub-tokens return false

- **WHEN** application code passes `element`, `static3d`, or `dynamic3d` to `supports('useAnimation', tokens)`
- **THEN** `supports('useAnimation', tokens)` MUST return `false`
