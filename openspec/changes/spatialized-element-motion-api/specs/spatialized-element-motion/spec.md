# Spatialized element motion (umbrella)

## ADDED Requirements

### Requirement: Umbrella declarative motion with bind-time target resolution

The platform MUST provide declarative timeline motion for `spatialized2d`, `static3d`, and `dynamic3d`. The public hook MUST NOT require `config.kind`; the target resolves when the `animation` binding is passed as `xr-animation` (`<div enable-xr>` → spatialized2d, `<Model>` → static3d, `<Reality>` → dynamic3d).

#### Scenario: Capability matrix is normative

- **WHEN** product reviews motion support
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST list delivery status per kind

### Requirement: AnimationObject created by SpatializedElement with native-generated uuid

`SpatializedElement` (and subclasses) MUST provide `createAnimation(config)`. The call MUST create native `AnimationObject : SpatialObject` via `CreateSpatializedElementAnimation` JSB and return a Core `AnimationObject` handle whose `id` equals the native uuid.

Timeline MUST be compiled to canonical `tracks` and locked at `createAnimation`; control commands MUST NOT carry timeline. Config changes MUST use `destroy()` then `createAnimation` again.

#### Scenario: create returns native uuid

- **WHEN** `await element.createAnimation(config)` succeeds
- **THEN** `AnimationObject.id` MUST be native-generated
- **AND** native `SpatialObject` registry MUST contain that id

#### Scenario: timeline locked at create

- **WHEN** `createAnimation(configA)` succeeds and `play()` runs
- **AND** the app later tries to apply `configB` to the same session
- **THEN** the SDK MUST NOT apply `configB` to the locked timeline
- **AND** the app MUST `destroy()` then `createAnimation(configB)`

### Requirement: AnimationObject destroy uses generic SpatialObject path

`AnimationObject.destroy()` MUST use generic `DestroyCommand`. Native MUST stop sampling, clear element animating mask, and remove the registry object.

### Requirement: Core exposes AnimationObject playback API

`AnimationObject` MUST expose `SpatializedPlaybackApi`: `play`, `pause`, `resume`, `stop`, `reset`, `finish`, `playState`, `isAnimating`, `isPaused`, `finished`. `pause()` / `resume()` are whole-session only; no `keys` parameter.

### Requirement: Native owns playback state and broadcasts via WebMsg

Native `AnimationObject` MUST own the state machine. Changes MUST broadcast via `SpatialAnimationStateChanged` with `animationId` and `action`. Core `AnimationObject` MUST treat native broadcast as the sole `playState` source.

### Requirement: Shared lifecycle callbacks

Config MUST support `onStart`, `onComplete`, `onStop`, `onReset`, `onError`. Terminal callbacks are mutually exclusive per session.

### Requirement: v1 authoring uses from/to and timeline

Hook MUST accept mutually exclusive shapes: `from/to` segment, `timeline` percentage keyframes, or advanced `tracks`. Internal compilation to canonical tracks MUST happen once at `createAnimation`.

### Requirement: useAnimation supported only on native runtime

`useAnimation` MUST work only when `supports('useAnimation', [subtoken])` is true. Pure web MUST NOT have a Core RAF backend; `useAnimation` MUST fail fast.

### Requirement: Element-level animating mask without Portal coupling

While playing, native `SpatializedElement` MUST mark animating fields. Conflicting transform/opacity JSB updates MUST be ignored on native. Suppression MUST NOT depend on `PortalInstanceObject`.

### Requirement: React creates AnimationObject on bind

`useAnimation` binding MUST call `element.createAnimation(config)` after bind. Pre-bind `api` calls MUST queue on `AnimationProxy` and flush after resolve.

### Requirement: Model clip playback stays separate

USD clip `ref.play()` / `pause()` MUST stay independent from `AnimationObject` timeline.

### Requirement: JSB protocol

JS → Native: `CreateSpatializedElementAnimation`, `ControlSpatializedElementAnimation`.

Native → JS: `SpatialAnimationStateChanged`.

`AnimateSpatializedElementMotion` MUST NOT be the target-state protocol.
