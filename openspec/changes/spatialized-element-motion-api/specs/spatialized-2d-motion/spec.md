# Spatialized 2D motion

## Scope

`Spatialized2DElement` (`enable-xr`) is the 2D target. Binding `animation` from `useAnimation` via `xr-animation` on an `enable-xr` node resolves to `spatialized2d`.

**Native only:** no Web RAF. When `supports('useAnimation', ['element'])` is false, `useAnimation` is unavailable.

## ADDED Requirements

### Requirement: 2D creates AnimationObject via createAnimation

After bind, the SDK MUST call `Spatialized2DElement.createAnimation(config)`. Native creates `AnimationObject` with a locked timeline. Playback MUST use `ControlSpatializedElementAnimation` to write `element.transform` and `element.opacity`.

#### Scenario: public React entry

- **WHEN** authors call `useAnimation(config)` and bind to `enable-xr`
- **THEN** the hook MUST return `[animation, api, style]`
- **AND** MUST `createAnimation` on bind when native is available

#### Scenario: style is initial preview only

- **WHEN** the hook first renders
- **THEN** `style` MAY reflect `from` values for layout preview
- **AND** playback visuals MUST be native-written, not React RAF

### Requirement: property whitelist

Tracks MUST use `opacity` and `transform.translate|rotate|scale.*` only.

### Requirement: element animating mask replaces Portal suppression

During 2D playback, native MUST set animating mask on `Spatialized2DElement`. MUST NOT use `PortalInstanceObject` or React style suppression as the primary motion path.

### Requirement: imperative playback and lifecycle

Follows umbrella spec; state from `SpatialAnimationStateChanged` WebMsg.

### Requirement: validate before create

`validateSpatializedMotionConfig` MUST run before `createAnimation`.

## Cross-reference

- Umbrella: `specs/spatialized-element-motion/spec.md`
