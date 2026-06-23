## ADDED Requirements

### Requirement: Advertise spatialized element animation support

The runtime capability API MUST document and resolve the key `useAnimation` with sub-tokens for spatialized element animation targets:

- `element` for `spatialized2d`
- `static3d` for `SpatializedStatic3DElement` / `<Model>`
- `dynamic3d` for `SpatializedDynamic3DElement` / `<Reality>`

Applications that need a concrete target MUST check `supports('useAnimation', [token])`. `supports('useAnimation')` remains a family-level check and MUST NOT be treated as proof that any specific spatialized target is available.

#### Scenario: 2D spatialized element target is supported

- **WHEN** the current runtime implements `CreateSpatializedElementAnimation`, `ControlSpatializedElementAnimation`, `SpatialAnimationStateChanged`, and element animating mask behavior for `spatialized2d`
- **THEN** `supports('useAnimation', ['element'])` MUST return `true`

#### Scenario: Static3D target is supported

- **WHEN** the current runtime implements the AnimationObject path and write sinks for `static3d`
- **THEN** `supports('useAnimation', ['static3d'])` MUST return `true`

#### Scenario: Dynamic3D target is supported

- **WHEN** the current runtime implements the AnimationObject path and write sinks for `dynamic3d`
- **THEN** `supports('useAnimation', ['dynamic3d'])` MUST return `true`

#### Scenario: Pure Web runtime returns false

- **WHEN** the current runtime is a pure Web runtime without the native AnimationObject bridge
- **THEN** `supports('useAnimation', ['element'])` MUST return `false`
- **AND** `supports('useAnimation', ['static3d'])` MUST return `false`
- **AND** `supports('useAnimation', ['dynamic3d'])` MUST return `false`

#### Scenario: Unsupported sub-token returns false

- **WHEN** application code passes a `useAnimation` sub-token other than a documented token such as `entity`, `element`, `static3d`, or `dynamic3d`
- **THEN** `supports('useAnimation', tokens)` MUST return `false`

#### Scenario: Multiple target tokens use AND semantics

- **WHEN** application code calls `supports('useAnimation', ['element', 'dynamic3d'])`
- **THEN** the result MUST be `true` only if both spatialized targets are supported by the current runtime
