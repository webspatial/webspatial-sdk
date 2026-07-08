## ADDED Requirements

### Requirement: Entity motion uses the documented top-level motion capability key

The documented target-state capability contract for Entity motion MUST use the top-level `supports('useAnimation')` key. `supports('useAnimation', ['entity'])` MUST be removed from the documented capability contract: no documentation, target-state guidance, or reserved sub-token MUST describe an `entity` sub-token of `useAnimation`.

This capability represents that the current runtime supports Reality Entity components connecting `useEntityAnimation` through the recommended `xr-animation` binding while remaining compatible with `animation`.

#### Scenario: Entity motion capability guidance
- **WHEN** application documentation explains how to detect support for the new Entity motion API
- **THEN** it MUST use `supports('useAnimation')` as the documented target-state capability check

#### Scenario: Legacy sub-token is removed from the contract
- **WHEN** capability documentation or code references Entity motion support
- **THEN** it MUST NOT use or reserve `supports('useAnimation', ['entity'])`
- **AND** `supports('useAnimation')` MUST be the only documented capability check for Entity motion