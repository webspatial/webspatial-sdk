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

`AnimationObject.destroy()` MUST use the common destroy lifecycle inherited from `SpatialObject`. Runtime cleanup MUST stop frame driving, clear target animating mask, unregister listeners, and remove the object from the existing native spatial object store such as `SpatialScene.spatialObjects`.

`ControlSpatializedElementAnimation` MUST NOT be the only normative destruction path. If a control-level `destroy` action exists for compatibility, it MUST delegate to the common `SpatialObject.destroy()` behavior.

#### Scenario: Destroy animation through common object lifecycle

- **WHEN** Core SDK calls `animationObject.destroy()`
- **THEN** SDK MUST dispatch the common spatial object destroy path for the animation uuid
- **AND** native MUST clean up the `AnimationObject` through the same lifecycle used by other `SpatialObject` instances

### Requirement: Core SDK exposes first-class AnimationObject

Core SDK MUST expose an imperative `AnimationObject` handle returned by `SpatializedElement.createAnimation(config)`. The handle MUST include the native uuid and MUST directly provide `play`, `pause`, `resume`, `stop`, `reset`, and `finish`; `destroy` MUST be inherited from `SpatialObject`.

The target state MUST NOT require public `AnimationObjectChannel`, `AnimationObjectBridge`, or `SpatialObjectBridge` architecture objects. Low-level JSB/WebMsg capabilities MAY exist as implementation details of `SpatialObject` / `AnimationObject`.

React SDK MAY continue to expose `[animation, api, style]`; that React-facing `api` MUST proxy to the underlying Core SDK `AnimationObject` after binding.

#### Scenario: Core imperative animation object

- **WHEN** a Core SDK consumer calls `element.createAnimation(config)`
- **THEN** the returned object MUST expose `uuid`
- **AND** it MUST expose playback controls equivalent to the React-facing playback API
- **AND** it MUST participate in destruction through inherited `SpatialObject.destroy()`

### Requirement: NativeWebMsg directly drives Core AnimationObject state

`SpatialAnimationStateChanged` MUST be modeled as a NativeWebMsg event payload, not as a separate Core SDK architecture object. Core SDK `AnimationObject` MUST subscribe to NativeWebMsg directly, filter `SpatialAnimationStateChanged` events by its native uuid, and update its own `playState`, `isAnimating`, `isPaused`, and `finished`.

Native `AnimationObject` MUST own playback state. Core SDK MAY keep pending command state before native acknowledgement, but it MUST reconcile to native state after receiving `SpatialAnimationStateChanged`. Core SDK MUST NOT independently complete, pause, finish, or reset a native-backed animation without native state confirmation.

#### Scenario: Core AnimationObject receives NativeWebMsg directly

- **WHEN** native sends `SpatialAnimationStateChanged(animationId, action, playState, values?)`
- **THEN** Core SDK `AnimationObject` MUST filter the event by its own `uuid`
- **AND** when matched, it MUST update that `AnimationObject` state
- **AND** React-facing `api` state MUST update by subscribing to that `AnimationObject` state

### Requirement: Element animating mask is owned by SpatializedElement runtime

The animation-owned field mask MUST be maintained by the native `SpatializedElement` runtime or its target-specific write adapter. It MUST NOT depend on `PortalInstanceObject` as the source of truth.

While a field is marked animation-owned, regular JSB updates such as `UpdateSpatializedElementTransform` MUST NOT override that field. Terminal ownership handoff MUST clear or update the mask according to the terminal value rules.

#### Scenario: Ignore regular transform update during active animation

- **GIVEN** an `AnimationObject` is actively animating target transform
- **WHEN** Core SDK sends a regular transform update for the same `SpatializedElement`
- **THEN** native MUST ignore or defer the conflicting transform field according to the animating mask
- **AND** this decision MUST NOT require consulting `PortalInstanceObject`

### Requirement: React AnimationBinding creates native-backed AnimationObject

React SDK MUST create `AnimationBinding` when `useAnimation(config)` is called, but it MUST NOT create a native-backed `AnimationObject` at that time. Native object creation MUST happen only after the `xr-animation` binding resolves a concrete `SpatializedElement` target.

If the user calls `api.play()`, `api.pause()`, `api.resume()`, `api.stop()`, `api.reset()`, or `api.finish()` before binding, React SDK MUST record those explicit commands through `AnimationBinding` and flush them after the native-backed `AnimationObject` is created. `autoStart: false` MUST only disable implicit play-on-bind and MUST NOT drop explicit queued commands.

#### Scenario: Create after bind and flush explicit commands

- **GIVEN** `useAnimation(config)` has returned `[animation, api, style]`
- **AND** the application called `api.play()` before target bind
- **WHEN** `animation` is bound to a concrete `SpatializedElement` through `xr-animation`
- **THEN** React SDK MUST call `SpatializedElement.createAnimation(config)`
- **AND** after native returns `AnimationObject.uuid`, SDK MUST flush the queued explicit `play` command

### Requirement: visionOS runtime manages native AnimationObject lifecycle

visionOS runtime MUST manage native `AnimationObject` instances through `SpatializedElementAnimationManager`. The manager MUST handle create/control lookup, animation registry, target element destroy cascading, animating mask coordination, and `SpatialAnimationStateChanged` emission.

Native `AnimationObject` MUST extend `SpatialObject`, MUST own the locked timeline sampler and playback state, and MUST implement the per-animation play/pause/resume/stop/reset/finish/tick behavior.

#### Scenario: Element destroy cascades to related animations

- **WHEN** a `SpatializedElement` is destroyed
- **THEN** visionOS runtime MUST destroy related native `AnimationObject` instances through `SpatializedElementAnimationManager.destroyAnimationsForElement(elementId)`
- **AND** each destroyed animation MUST clean up frame driving, animating mask, listeners, and registry entry

### Requirement: Native frame loop lifecycle is manager-owned

The native runtime MUST treat the frame loop as an internal scheduling capability of `SpatializedElementAnimationManager`, backed by a platform frame callback such as `CADisplayLink`. The frame driver MUST NOT own animation semantics, target element semantics, or WebMsg emission responsibilities.

`SpatializedElementAnimationManager` MUST start the frame loop when at least one native `AnimationObject` enters `running`, including `play` and `resume`. `CreateSpatializedElementAnimation` only creates a native `AnimationObject` and locks its timeline; create itself MUST NOT start frame sampling unless followed by implicit play-on-bind or a queued explicit `play` flush.

`SpatializedElementAnimationManager` MUST check whether the frame loop can stop after `pause`, `stop`, `reset`, `finish`, `destroy`, natural completion, `destroyAnimationsForElement`, and scene/page cleanup. The frame loop MUST stop when no native `AnimationObject` remains in `running`.

#### Scenario: Play starts the frame loop

- **WHEN** `SpatializedElementAnimationManager` handles `ControlSpatializedElementAnimation(play)`
- **AND** the corresponding native `AnimationObject` enters `running`
- **THEN** the manager MUST start the frame loop
- **AND** each frame callback MUST call `manager.tickAll(timestamp)`

#### Scenario: Stop the frame loop when no animation is running

- **WHEN** `pause`, `stop`, `reset`, `finish`, `destroy`, or natural completion leaves no native `AnimationObject` in `running`
- **THEN** the manager MUST stop the frame loop

### Requirement: Pure Web runtime has no Core RAF fallback

Core SDK target-state spatialized element animation MUST NOT include Web RAF playback fallback. If the runtime lacks native `AnimationObject` support for a target token, `supports('useAnimation', [targetToken])` MUST return `false` and SDK MUST NOT run a JS RAF sampler for that target.

#### Scenario: Native animation object unavailable

- **WHEN** runtime has no native `AnimationObject` support
- **THEN** spatialized element animation target capability MUST be `false`
- **AND** Core SDK MUST NOT start Web RAF playback as fallback
