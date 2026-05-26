# Spatialized 2D motion (reference implementation)

## Scope

**Shipped** under `openspec/changes/spatial-div-motion-api/`. Normative scenarios remain in `specs/spatial-div-motion/spec.md` in that change.

## ADDED Requirements

### Requirement: 2D is the reference kind for timeline motion

The SDK MUST treat `Spatialized2DElement` motion as `kind: 'spatialized2d'`. Implementation uses the shared `SpatializedMotionController` with 2D policy (Web RAF + native `SpatialDivAnimationManager`).

#### Scenario: Public aliases

- **WHEN** authors import `useSpatializedMotion({ kind: 'spatialized2d', … })`
- **THEN** behavior MUST match `useSpatialDivMotion` for the same timeline config

#### Scenario: Deprecated hook parity

- **WHEN** authors import `useSpatialDivMotion` or construct `SpatialDivMotionController`
- **THEN** behavior MUST match `useSpatializedMotion` / `SpatializedMotionController` with `kind: 'spatialized2d'`
