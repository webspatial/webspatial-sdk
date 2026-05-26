# Spatialized Static3D motion

## ADDED Requirements

### Requirement: Static3D timeline animates model root transform and opacity

The SDK MUST support `SpatializedStatic3DElement` timeline motion applying sampled values to `modelTransform` (translate/rotate/scale) and `opacity` without animating layout fields on the spatialized element shell.

Implementation MUST use `SpatializedMotionController` with `kind: 'static3d'` (native-only; no Web RAF).

#### Scenario: Native play sends timeline

- **GIVEN** `supports('useAnimation', ['static3d'])` is true
- **WHEN** `SpatializedStatic3DElement.animateMotion({ type: 'play', timeline })` runs
- **THEN** native MUST sample the timeline and update `modelTransform` / `opacity` until complete or cancel

#### Scenario: Model motion binding

- **WHEN** `<Model motion={binding} />` is wired from `useSpatializedMotion({ kind: 'static3d' })`
- **THEN** play before bind MAY queue; after bind native playback MUST drive transform without fighting React layout writes (suppression rules analogous to 2D)

### Requirement: Clip playback stays separate

#### Scenario: ref.play does not start timeline

- **WHEN** application calls model ref `play()` for USD clip
- **THEN** timeline `motion` session MUST NOT be implied; separate APIs
