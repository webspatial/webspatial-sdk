# Spatialized Static3D motion

## ADDED Requirements

### Requirement: Static3D timeline drives model root transform

The SDK MUST support `SpatializedStatic3DElement.createAnimation(config)` applying locked timeline samples to `modelTransform`. Root `opacity` is not a shipped sink; opacity tracks MUST be rejected at validation or ignored on native.

#### Scenario: createAnimation on bind

- **GIVEN** `supports('useAnimation', ['static3d'])` is true
- **WHEN** `<Model xr-animation={binding} />` finishes bind
- **THEN** the SDK MUST `createAnimation` and update `modelTransform` on `play()`

#### Scenario: play before bind queues

- **WHEN** `api.play()` runs before Model bind
- **THEN** Proxy MUST queue and flush after create

### Requirement: clip playback stays separate

#### Scenario: ref.play does not start AnimationObject

- **WHEN** model ref `play()` runs for USD clip
- **THEN** `AnimationObject` timeline MUST NOT start implicitly
