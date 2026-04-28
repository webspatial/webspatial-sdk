## ADDED Requirements

### Requirement: Advertise entity transform animation support

The runtime capability API MUST document and resolve the top-level key `useAnimation` for the entity transform animation feature.

#### Scenario: Supported runtime

- **WHEN** the current runtime implements the entity transform animation API end to end
- **THEN** `supports('useAnimation')` MUST return `true`

#### Scenario: Unsupported runtime

- **WHEN** the current runtime lacks the native bridge or playback behavior required by the entity transform animation API
- **THEN** `supports('useAnimation')` MUST return `false`

#### Scenario: No sub-tokens for useAnimation

- **WHEN** application code passes any sub-token to `supports('useAnimation', tokens)`
- **THEN** the result MUST be `false`
- **AND** this is by design: the first version of entity transform animation exposes a single top-level capability with no sub-capability granularity