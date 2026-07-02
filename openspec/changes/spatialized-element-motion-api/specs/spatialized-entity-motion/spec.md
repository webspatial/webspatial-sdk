# Spatialized entity motion (timeline)

## ADDED Requirements

> **Status: deferred.** Container motion (`SpatializedMotionController` / `useAnimation`) does **not** include entity targets. Entity animation currently continues via `useEntityAnimation` + `AnimateTransform`. Requirements below are aspirational until a dedicated change lands.

### Requirement: Entity timeline uses transform property paths

Entity timeline tracks MUST use `position.x|y|z`, `rotation.x|y|z`, `scale.x|y|z` (degrees for rotation). They MUST NOT use `transform.translate.*` paths.

#### Scenario: Overlapping tracks

- **GIVEN** `duration: 2` with `position.x` 0→10 linear and `scale.x` 1→2 from 1s→2s
- **WHEN** `api.play()` completes on native
- **THEN** at `t=1.5` position.x MUST be between 0 and 10 and scale.x MUST be between 1 and 2

### Requirement: AnimateTransform accepts timeline payload

`SpatialEntity.animateTransform()` MUST accept timeline payloads and sample them through the entity animation manager.

#### Scenario: play with timeline

- **WHEN** `SpatialEntity.animateTransform({ type: 'play', timeline, entityId })` is sent
- **THEN** native `EntityAnimationManager` MUST interpolate per-track samples and drive RealityKit transform (segment `from`/`to` ignored for that play)

### Requirement: Segment API remains valid on the current entity entry

The legacy segment `useEntityAnimation` shape MUST continue to work for entity motion where no timeline is provided.

#### Scenario: segment play unchanged

- **WHEN** `useEntityAnimation({ to: { position: … }, duration })` is used without timeline
- **THEN** existing segment behavior MUST continue to work
