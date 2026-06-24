# Spatialized AnimationObject implementation invariants

## Added Requirements

### Requirement: AnimationObject identity is native-owned

`SpatializedElement.createAnimation(config)` MUST create the native `AnimationObject` first and then return a Core SDK `AnimationObject` handle whose `uuid` is the native-generated object identity.

Core SDK MAY use a temporary request id to match the async create response, but it MUST NOT treat a JavaScript-generated id as the final `AnimationObject.uuid`.

#### Scenario: Native returns animation uuid

- **WHEN** Core SDK calls `SpatializedElement.createAnimation(config)`
- **THEN** native MUST create an `AnimationObject : SpatialObject`
- **AND** native MUST generate the object uuid
- **AND** Core SDK MUST expose that uuid on the returned `AnimationObject` handle

### Requirement: AnimationObject destruction uses SpatialObject lifecycle

`AnimationObject.destroy()` MUST enter the common `SpatialObject` destroy lifecycle. Runtime cleanup MUST stop frame driving, clear target animating mask, unregister listeners, and remove the object from the native spatial object registry.

`ControlSpatializedElementAnimation` MUST NOT be the only normative destruction path. If a control-level `destroy` action exists for compatibility, it MUST delegate to the common `SpatialObject.destroy()` behavior.

#### Scenario: Destroy animation through common object lifecycle

- **WHEN** Core SDK calls `animationObject.destroy()`
- **THEN** SDK MUST dispatch the common spatial object destroy path for the animation uuid
- **AND** native MUST clean up the `AnimationObject` through the same lifecycle used by other `SpatialObject` instances

### Requirement: Core SDK exposes AnimationObject handle

Core SDK MUST expose an imperative `AnimationObject` handle returned by `SpatializedElement.createAnimation(config)`. The handle MUST include the native uuid and MUST provide `play`, `pause`, `resume`, `stop`, `reset`, `finish`, and `destroy`.

React SDK MAY continue to expose `[animation, api, style]`; that React-facing `api` MUST proxy to the underlying Core SDK `AnimationObject` after binding.

#### Scenario: Core imperative animation object

- **WHEN** a Core SDK consumer calls `element.createAnimation(config)`
- **THEN** the returned object MUST expose `uuid`
- **AND** it MUST expose playback controls equivalent to the React-facing playback API

### Requirement: Native playback state is authoritative

Native `AnimationObject` MUST own playback state. Core SDK `playState`, `isAnimating`, `isPaused`, and `finished` MUST be projected from `SpatialAnimationStateChanged` events.

Core SDK MAY keep pending command state before native acknowledgement, but it MUST reconcile to native state after receiving `SpatialAnimationStateChanged`. Core SDK MUST NOT independently complete, pause, finish, or reset a native-backed animation without native state confirmation.

#### Scenario: State projection from WebMsg

- **WHEN** native broadcasts `SpatialAnimationStateChanged(animationId, action, playState, values?)`
- **THEN** Core SDK MUST update the matching `AnimationObject` state from that message
- **AND** React-facing `api` state MUST reflect the Core SDK projection

### Requirement: Element animating mask is owned by SpatializedElement runtime

The animation-owned field mask MUST be maintained by the native `SpatializedElement` runtime or its target-specific write adapter. It MUST NOT depend on `PortalInstanceObject` as the source of truth.

While a field is marked animation-owned, regular JSB updates such as `UpdateSpatializedElementTransform` MUST NOT override that field. Terminal ownership handoff MUST clear or update the mask according to the terminal value rules.

#### Scenario: Ignore regular transform update during active animation

- **GIVEN** an `AnimationObject` is actively animating target transform
- **WHEN** Core SDK sends a regular transform update for the same `SpatializedElement`
- **THEN** native MUST ignore or defer the conflicting transform field according to the animating mask
- **AND** this decision MUST NOT require consulting `PortalInstanceObject`

### Requirement: React binding creates native AnimationObject

React SDK MUST NOT create a native `AnimationObject` when `useAnimation(config)` is called. Native object creation MUST happen only after the `xr-animation` binding resolves a concrete `SpatializedElement` target.

If the user calls `api.play()`, `api.pause()`, `api.resume()`, `api.stop()`, `api.reset()`, or `api.finish()` before binding, React SDK MUST record those explicit commands through a proxy and flush them after the native `AnimationObject` is created. `autoStart: false` MUST only disable implicit play-on-bind and MUST NOT drop explicit queued commands.

#### Scenario: Create after bind and flush explicit commands

- **GIVEN** `useAnimation(config)` has returned `[animation, api, style]`
- **AND** the application called `api.play()` before target bind
- **WHEN** `animation` is bound to a concrete `SpatializedElement` through `xr-animation`
- **THEN** React SDK MUST call `SpatializedElement.createAnimation(config)`
- **AND** after native returns `AnimationObject.uuid`, SDK MUST flush the queued explicit `play` command

### Requirement: Pure Web runtime has no Core RAF fallback

Core SDK target-state spatialized element animation MUST NOT include Web RAF playback fallback. If the runtime lacks native `AnimationObject` bridge support for a target token, `supports('useAnimation', [targetToken])` MUST return `false` and SDK MUST NOT run a JS RAF sampler for that target.

#### Scenario: Native bridge unavailable

- **WHEN** runtime has no native `AnimationObject` bridge
- **THEN** spatialized element animation target capability MUST be `false`
- **AND** Core SDK MUST NOT start Web RAF playback as fallback
