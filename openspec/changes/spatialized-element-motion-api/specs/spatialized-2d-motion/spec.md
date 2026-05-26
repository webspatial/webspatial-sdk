# Spatialized 2D motion (reference implementation)

## Scope

**Shipped** under `openspec/changes/spatial-div-motion-api/`. Normative scenarios remain in `specs/spatial-div-motion/spec.md` in that change.

## ADDED Requirements

### Requirement: 2D is the reference kind for timeline motion

The SDK MUST treat `Spatialized2DElement` motion as `kind: 'spatialized2d'`. Implementation includes `useSpatialDivMotion`, `SpatialDivMotionController`, `Spatialized2DElement.motion()`, native `SpatialDivAnimationManager`, and Web RAF fallback.

#### Scenario: Public aliases

- **WHEN** authors import `useSpatializedMotion({ kind: 'spatialized2d', … })`
- **THEN** behavior MUST match `useSpatialDivMotion` for the same timeline config

#### Scenario: Documentation scope

- **WHEN** reading umbrella API.zh.md
- **THEN** 2D MUST be marked as the only kind fully shipped before Phase 2/3 land
