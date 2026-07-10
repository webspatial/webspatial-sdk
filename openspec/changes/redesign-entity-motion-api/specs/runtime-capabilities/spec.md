## ADDED Requirements

### Requirement: Entity motion uses the documented top-level motion capability key

The documented target-state capability contract for Entity motion MUST use the top-level `supports('useEntityAnimation')` key. `supports('useEntityAnimation', ['entity'])` MUST be removed from the documented capability contract: no documentation, target-state guidance, or reserved sub-token MUST describe an `entity` sub-token of `useEntityAnimation`.

This capability represents that the current runtime supports Reality Entity components connecting `useEntityAnimation` through the `animation` binding.

#### Scenario: Entity motion capability guidance
- **WHEN** application documentation explains how to detect support for the new Entity motion API
- **THEN** it MUST use `supports('useEntityAnimation')` as the documented target-state capability check

#### Scenario: Legacy sub-token is removed from the contract
- **WHEN** capability documentation or code references Entity motion support
- **THEN** it MUST NOT use or reserve `supports('useEntityAnimation', ['entity'])`
- **AND** `supports('useEntityAnimation')` MUST be the only documented capability check for Entity motion