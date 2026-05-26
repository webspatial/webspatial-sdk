# Spatialized 2D motion (reference implementation)

## Scope

**Shipped** under `openspec/changes/spatial-div-motion-api/`. Normative scenarios remain in `specs/spatial-div-motion/spec.md` in that change.

## ADDED Requirements

### Requirement: 2D is the reference kind for timeline motion

The SDK MUST treat `Spatialized2DElement` motion as `kind: 'spatialized2d'`. Implementation uses the shared `SpatializedMotionController` with 2D policy (Web RAF + native `SpatialDivAnimationManager`).

#### Scenario: Public React entry

- **WHEN** authors call `useSpatializedMotion({ kind: 'spatialized2d', … })` or `useSpatializedMotion.simple({ kind: 'spatialized2d', … })`
- **THEN** the hook MUST return `{ kind, style, api, motion?, controller }` with Web RAF when native motion is unavailable

#### Scenario: Core controller parity

- **WHEN** authors construct `SpatialDivMotionController` or `new SpatializedMotionController(config, 'spatialized2d')`
- **THEN** playback behavior MUST be equivalent for the same timeline config
