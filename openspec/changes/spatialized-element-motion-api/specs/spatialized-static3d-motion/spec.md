# Spatialized Static3D motion

## ADDED Requirements

### Requirement: Static3D timeline animates model root transform only

The SDK MUST support `SpatializedStatic3DElement` timeline motion applying sampled values to `modelTransform` (translate/rotate/scale) without animating layout fields on the spatialized element shell.

Static3D root `opacity` is NOT part of the shipped timeline sink in this change. Authors MAY still set ordinary `opacity` on the element itself, but `xr-animation` bound to `<Model>` MUST reject opacity tracks during `validateSpatializedMotionConfig`; it MUST NOT silently ignore them.

Target-state execution MUST create an `AnimationObject` through `SpatializedElement.createAnimation(config)` when `animation` is bound to a `<Model>` component and resolves to `static3d`.

#### Scenario: Native create sends timeline

- **GIVEN** `supports('useAnimation')` is true
- **WHEN** `CreateSpatializedElementAnimation` runs for a `SpatializedStatic3DElement`
- **THEN** native MUST sample the timeline and update `modelTransform` until completion or session termination

#### Scenario: Static3D opacity tracks are rejected

- **WHEN** an `xr-animation` binding resolves to `static3d` and the normalized timeline contains `opacity`
- **THEN** `validateSpatializedMotionConfig` MUST reject the config before `CreateSpatializedElementAnimation`
- **AND** native MUST NOT receive a timeline with ignored Static3D opacity tracks

#### Scenario: Model xr-animation binding

- **WHEN** `<Model xr-animation={binding} />` receives `animation` from `useAnimation(config)`, resolving the target to `static3d`
- **THEN** play before bind MAY queue; after bind native playback MUST drive transform without fighting React layout writes through the element animating mask

### Requirement: Clip playback stays separate

USD embedded model playback (`ref.play()` / `pause()` on the model ref) MUST remain separate from transform timeline motion.

#### Scenario: ref.play does not start timeline

- **WHEN** application calls model ref `play()` for USD clip
- **THEN** timeline `xr-animation` session MUST NOT be implied; separate APIs
