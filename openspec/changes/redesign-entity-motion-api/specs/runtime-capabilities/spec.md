## ADDED Requirements

### Requirement: Entity motion uses the documented top-level motion capability key

The documented target-state capability contract for Entity motion MUST use the top-level `supports('useAnimation')` key. Documentation for the new Entity motion proposal MUST NOT describe `supports('useAnimation', ['entity'])` as the recommended target-state check.

This capability represents that the current runtime supports Reality Entity components connecting `useEntityAnimation` through the recommended `xr-animation` binding while remaining compatible with `animation`.

#### Scenario: Entity motion capability guidance
- **WHEN** application documentation explains how to detect support for the new Entity motion API
- **THEN** it MUST use `supports('useAnimation')` as the documented target-state capability check

#### Scenario: Legacy sub-token is not target-state guidance
- **WHEN** legacy Entity motion guidance is referenced during migration
- **THEN** `supports('useAnimation', ['entity'])` MUST be treated as migrated or replaced behavior rather than the recommended target-state contract