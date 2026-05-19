## ADDED Requirements

### Requirement: Advertise entity transform animation support

The runtime capability API MUST document and resolve the key `useAnimation` with its sub-token `entity` for the entity transform animation feature.

#### Scenario: Supported runtime

- **WHEN** the current runtime implements the entity transform animation API end to end
- **THEN** `supports("useAnimation", ["entity"])` MUST return `true`

#### Scenario: Unsupported runtime

- **WHEN** the current runtime lacks the native bridge or playback behavior required by the entity transform animation API
- **THEN** `supports("useAnimation", ["entity"])` MUST return `false`

#### Scenario: supports result is stable

- **WHEN** application code calls `supports("useAnimation", ["entity"])` multiple times within the same runtime process lifetime
- **THEN** the result MUST remain stable and MUST NOT change at runtime

#### Scenario: Only entity sub-token is supported for useAnimation

- **WHEN** application code passes any sub-token other than `["entity"]` to `supports("useAnimation", tokens)`
- **THEN** the result MUST be `false`
- **AND** this is by design: the first version of entity transform animation only supports the `["entity"]` sub-token; other sub-tokens (e.g. `["opacity"]`) are reserved for future versions