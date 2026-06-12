## ADDED Requirements

### Requirement: Native motion backend gate

The native backend of `useSpatializedMotion` MUST be enabled only when `supports('useAnimation', ['element'])` is `true`. The Web backend MUST NOT depend on that capability.

#### Scenario: Capability false still allows Web motion

- **GIVEN** `supports('useAnimation', ['element'])` is `false`
- **WHEN** `useSpatializedMotion` is used with `api.play()`
- **THEN** motion MUST still run via the Web backend
- **AND** `supports` MUST NOT be required to return `true` for motion to function in a plain browser
