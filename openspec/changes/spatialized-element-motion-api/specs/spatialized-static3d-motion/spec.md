# Spatialized Static3D motion

## ADDED Requirements

### Requirement: Static3D timeline animates model root transform and opacity

The SDK MUST support `SpatializedStatic3DElement` timeline motion applying sampled values to `modelTransform` (translate/rotate/scale) and `opacity` without animating layout fields on the spatialized element shell.

Implementation MUST use `SpatializedMotionController` with the `static3d` target, resolved when `animation` is bound to a `<Model>` component (native-only; no Web RAF).

#### Scenario: Native play sends timeline

- **GIVEN** `supports('useAnimation', ['static3d'])` is true
- **WHEN** `SpatializedStatic3DElement.animateMotion({ type: 'play', timeline })` runs
- **THEN** native MUST sample the timeline and update `modelTransform` / `opacity` until completion or session termination

#### Scenario: Model xr-animation binding

- **WHEN** `<Model xr-animation={binding} />` receives `animation` from `useAnimation(config)`, resolving the target to `static3d`
- **THEN** play before bind MAY queue; after bind native playback MUST drive transform without fighting React layout writes (suppression rules analogous to 2D)

### Requirement: Clip playback stays separate

USD embedded model playback (`ref.play()` / `pause()` on the model ref) MUST remain separate from transform timeline motion.

#### Scenario: ref.play does not start timeline

- **WHEN** application calls model ref `play()` for USD clip
- **THEN** timeline `xr-animation` session MUST NOT be implied; separate APIs
