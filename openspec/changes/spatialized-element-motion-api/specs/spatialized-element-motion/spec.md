# SpatializedElement motion (umbrella)

## ADDED Requirements

### Requirement: Umbrella defines declarative motion with bind-time target resolution

The platform MUST document and implement declarative timeline motion for these targets: `spatialized2d`, `static3d`, and `dynamic3d`. Each target MUST have a sub-spec defining property whitelists, native backend, and React integration. The public hook MUST NOT require `config.kind`; the target is resolved automatically when the returned `animation` binding is passed as `xr-animation` prop to a component (`<div enable-xr>` → spatialized2d, `<Model>` → static3d, `<Reality>` → dynamic3d). `SpatialEntity` transform timelines are out of scope for this umbrella and continue to use `useEntityAnimation` on the separate entity stack.

#### Scenario: Capability matrix is normative

- **WHEN** a product owner reviews motion support
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST list each kind with shipped vs planned status

### Requirement: Native-first AnimationObject architecture

Spatialized element motion MUST use a native-first `AnimationObject` target architecture. Each bound `SpatializedElement` MUST expose `createAnimation(config)`, which creates an `AnimationObject : SpatialObject` associated with exactly one spatialized element target. Creation MUST send `CreateSpatializedElementAnimation` with the normalized timeline payload and element identity. The Core SDK MUST still resolve target kind before creation for target-specific validation, while the native runtime MUST resolve the effective target kind from the concrete native element type. Runtime control MUST use `ControlSpatializedElementAnimation` commands (`play`, `pause`, `resume`, `stop`, `reset`, `finish`, `destroy`). Native runtime state changes MUST be observed through `SpatialAnimationStateChanged`.

The target-state architecture MUST NOT depend on Web RAF playback, `SpatializedMotionController`, `NativePlaybackBackend`, Portal suppression, or `AnimateSpatializedElementMotion` as normative execution primitives. Existing authoring and playback semantics remain normative, but the execution owner is the native `AnimationObject`.

#### Scenario: SpatializedElement.createAnimation creates an AnimationObject

- **WHEN** an `animation` binding resolves to a concrete spatialized element target
- **THEN** the SDK MUST call `SpatializedElement.createAnimation(config)` for that target
- **AND** the returned handle MUST represent an `AnimationObject : SpatialObject`

#### Scenario: Create locks timeline config

- **WHEN** `CreateSpatializedElementAnimation` succeeds
- **THEN** the created `AnimationObject` MUST lock the normalized timeline config used for creation
- **AND** subsequent terminal commands for that object MUST use the locked timeline until the object is destroyed and recreated

#### Scenario: Config changes destroy and recreate

- **GIVEN** an `AnimationObject` has already been created for a binding
- **WHEN** the authoring config changes in a way that changes the normalized timeline or target validation result
- **THEN** the SDK MUST destroy the existing `AnimationObject`
- **AND** the SDK MUST create a new `AnimationObject` instead of mutating the previous object's locked timeline in place

#### Scenario: Control commands use the animation object channel

- **WHEN** authors call `api.play()`, `api.pause()`, `api.resume()`, `api.stop()`, `api.reset()`, or `api.finish()`
- **THEN** the SDK MUST send the matching `ControlSpatializedElementAnimation` command to the current `AnimationObject`
- **AND** playback state MUST be reconciled from `SpatialAnimationStateChanged`

#### Scenario: Element animating mask owns animated sync fields

- **WHEN** an `AnimationObject` is active or holds a terminal visual value
- **THEN** the target element MUST expose an animating mask for the animated fields
- **AND** ordinary element sync MUST NOT overwrite fields that are masked as animation-owned

#### Scenario: Pure Web runtime does not run a RAF fallback

- **WHEN** runtime capability for the resolved target is unavailable, including a pure Web runtime
- **THEN** `supports('useAnimation')` MUST return `false`
- **AND** the SDK MUST NOT start Web RAF playback as a fallback for the target-state `useAnimation` path

### Requirement: Shared playback API shape

All kinds that support declarative motion MUST expose `SpatializedPlaybackApi` (`play`, `pause`, `resume`, `stop`, `reset`, `finish`, `playState`, `isAnimating`, `isPaused`, `finished`). Controller-level `pause()` and `resume()` MUST be whole-session operations with no `keys` parameter. Selective per-track / per-action control is intentionally out of scope for this change and, if needed in the future, MUST be designed as a separate track/action-level API (for example `pauseTrack(trackId)`), not by extending controller `pause()` / `resume()`.

#### Scenario: Playback API is available regardless of binding target

- **WHEN** authors obtain a motion tuple from `useAnimation(config)`
- **THEN** the returned `api` MUST expose `play`, `pause`, `resume`, `stop`, `reset`, `finish`, `playState`, `isAnimating`, `isPaused`, and `finished` regardless of which component the `animation` is later bound to

#### Scenario: pause() and resume() do not accept extra arguments

- **WHEN** application code attempts to call `api.pause()` or `api.resume()` with an extra argument
- **THEN** the controller API MUST reject the call at the type level and MUST not expose any public overload that accepts additional controller-control parameters

### Requirement: Returned style outlet closes host visual state

For any host-bound target, the returned `style` from `useAnimation(config)` MUST be treated as required API output and merged back onto the same host element or component that receives `xr-animation`. This merge closes animation-emitted values through later rerender, terminal commands, and host resync.

#### Scenario: Merged style keeps terminal visual values stable across resync

- **GIVEN** a host-bound target merges the returned `style` back onto the same host that receives `xr-animation`
- **WHEN** `stop()`, `reset()`, `finish()`, or natural completion is followed by a later rerender or host resync
- **THEN** the host-side visual state MUST continue to reflect the last terminal values emitted by the animation session

#### Scenario: Omitting merged style leaves terminal persistence unspecified

- **GIVEN** a host-bound target does not merge the returned `style` back onto the same host that receives `xr-animation`
- **WHEN** playback still starts through the native animation path
- **THEN** the SDK MAY still play the animation
- **AND** the post-terminal visual persistence of `stop()`, `reset()`, `finish()`, or natural completion MUST be treated as unspecified

#### Scenario: stop() freezes active session at current values

- **WHEN** `api.stop()` is called while the animation is running or paused
- **THEN** the active session MUST terminate, the style MUST freeze at the sampled values of the current playback time, `playState` MUST become `idle`, `finished` MUST become `false`, and `onStop` MUST be invoked with the frozen values

#### Scenario: reset() reverts to initial values

- **WHEN** `api.reset()` is called
- **THEN** the style MUST revert to the `from` (initial) values, `playState` MUST become `idle`, `finished` MUST become `false`, and `onReset` MUST be invoked with the initial values

#### Scenario: finish() jumps to final values

- **GIVEN** a native-backed `AnimationObject` already exists for the controller
- **WHEN** `api.finish()` is called
- **THEN** the style MUST jump to the `to` (final) values, `playState` MUST become `finished`, `finished` MUST become `true`, and `onComplete` MUST be invoked with the final values

#### Scenario: reset() is not a no-op while idle

- **GIVEN** the motion is already `idle`
- **WHEN** `api.reset()` is called
- **THEN** the SDK MUST still emit the `from` values and MUST keep `playState` at `idle`

#### Scenario: pre-bind finish() is queued until native confirms the terminal state

- **GIVEN** the motion is `idle` and no native-backed `AnimationObject` exists yet
- **WHEN** `api.finish()` is called
- **THEN** the SDK MUST record an explicit queued `finish` command
- **AND** before native confirmation, the visible API `playState` MUST remain `queued`
- **AND** before native confirmation, the visible API `finished` MUST remain `false`
- **AND** once the native-backed `AnimationObject` is created, the SDK MUST flush that queued `finish` command
- **AND** only the subsequent native terminal state confirmation MAY transition the API to `playState=finished` and `finished=true`

#### Scenario: Only a new play session from idle or finished loads the latest config

- **GIVEN** the controller later receives `updateConfig(nextConfig)`
- **WHEN** `api.play()` starts a new playback session from `idle` or `finished`
- **THEN** the SDK MUST read and lock the latest config as the new session config
- **AND** terminal commands for that session MUST operate against that locked session config until another new session starts

#### Scenario: play() while paused resumes the current session without loading updated config

- **GIVEN** the controller is `paused` with an existing session config snapshot
- **AND** application code calls `updateConfig(nextConfig)`
- **WHEN** application code calls `api.play()` again
- **THEN** that call MUST behave as `resume()`
- **AND** the SDK MUST NOT load `nextConfig` into the current session

#### Scenario: reset() after finish() uses the finished session config until the next new play

- **GIVEN** a playback session started from `configA`
- **AND** that session entered `finished` through `api.finish()`
- **AND** application code then calls `updateConfig(configB)`
- **WHEN** `api.reset()` is called before the next new `play()`
- **THEN** the SDK MUST restore the initial values from the finished session started with `configA`
- **AND** the SDK MUST NOT use the initial values from `configB`

#### Scenario: reset() after stop() keeps using the stopped session config until the next new play

- **GIVEN** a playback session started from `configA`
- **AND** that session entered `idle` through `api.stop()`
- **AND** application code then calls `updateConfig(configB)`
- **WHEN** `api.reset()` is called before the next new `play()`
- **THEN** the SDK MUST restore the initial values from the stopped session started with `configA`
- **AND** the SDK MUST NOT use the initial values from `configB`

#### Scenario: Terminal values come from the AnimationObject

- **WHEN** a termination method (`stop`, `reset`, `finish`) is invoked
- **THEN** terminal style values MUST be provided by the native `AnimationObject`
- **AND** JS timeline evaluation MAY be used only for config validation, test fixtures, or explicit non-runtime tooling, not as the target-state playback backend

#### Scenario: Explicit authored style.opacity wins terminal 2D handoff

- **GIVEN** a `spatialized2d` motion bound to a React node with an explicit `style.opacity`
- **WHEN** `stop()`, `reset()`, or `finish()` completes and the element animating mask releases or updates `opacity`
- **THEN** the post-terminal visual owner of `opacity` MUST become that explicit authored `style.opacity`
- **AND** terminal sampled/native values MUST still remain the source for callback payloads and terminal session semantics

#### Scenario: Non-authored CSS opacity does not qualify for terminal handoff

- **GIVEN** `opacity` is present only through `className`, stylesheet rules, inherited visual dimming, or `getComputedStyle()` output
- **WHEN** a `spatialized2d` motion reaches `stop()`, `reset()`, or `finish()`
- **THEN** the SDK MUST NOT treat that value as explicit authored opacity for terminal handoff purposes
- **AND** terminal `opacity` ownership MUST stay with the sampled/native result when no explicit React `style.opacity` exists

#### Scenario: Explicit authored style.transform wins terminal host-transform handoff

- **GIVEN** a host-transform target (`spatialized2d` or `dynamic3d`) is bound to a React node with an explicit `style.transform`
- **WHEN** `stop()`, `reset()`, or `finish()` completes and the element animating mask releases or updates host `transform`
- **THEN** the post-terminal visual owner of host `transform` MUST become that explicit authored `style.transform`
- **AND** terminal sampled/native transform values MUST still remain the source for callback payloads and terminal session semantics

#### Scenario: Non-authored CSS transform does not qualify for terminal handoff

- **GIVEN** host `transform` appears only through `className`, stylesheet rules, inherited layout effects, or `getComputedStyle()` output
- **WHEN** a host-transform target reaches `stop()`, `reset()`, or `finish()`
- **THEN** the SDK MUST NOT treat that value as explicit authored transform for terminal handoff purposes
- **AND** terminal host-transform ownership MUST stay with the sampled/native result when no explicit React `style.transform` exists

### Requirement: Shared lifecycle callbacks

The config MUST support the following lifecycle callbacks:

| Callback | Trigger | Parameter |
|----------|---------|-----------|
| `onStart` | First frame of playback after `play()` | none |
| `onComplete` | Natural playback end **or** `finish()` | `values: SpatializedVisualValues` (to values) |
| `onStop` | `stop()` invoked | `values: SpatializedVisualValues` (current values) |
| `onReset` | `reset()` invoked | `values: SpatializedVisualValues` (from values) |
| `onError` | Native bridge async failure | `error: SpatializedPlaybackError` |

Callbacks MUST be mutually exclusive per session termination: exactly one of `onComplete`, `onStop`, or `onReset` fires per session end. `onError` MAY fire independently on native failure.

The terminal methods MUST remain independent commands: `stop()` terminates an active session without seeking, `reset()` always seeks to the start values, and `finish()` always seeks to the end values. Calling one MUST NOT cause another terminal method's semantics to be skipped or absorbed.

#### Scenario: onComplete fires on natural end

- **WHEN** the animation reaches its `duration` without interruption
- **THEN** `onComplete` MUST be invoked with the final values and `playState` MUST be `finished`

#### Scenario: onComplete fires on finish()

- **WHEN** `api.finish()` is called and native confirms the terminal state
- **THEN** `onComplete` MUST be invoked with the `to` values (same as natural end)

#### Scenario: onStop fires on stop()

- **WHEN** `api.stop()` is called
- **THEN** `onStop` MUST be invoked with the current sampled values

#### Scenario: onReset fires on reset()

- **WHEN** `api.reset()` is called
- **THEN** `onReset` MUST be invoked with the initial (`from`) values

#### Scenario: finished flag resets on stop and reset

- **WHEN** `api.stop()` or `api.reset()` is called
- **THEN** the `finished` flag MUST be `false`

#### Scenario: finished flag becomes true on finish

- **WHEN** `api.finish()` is called and native confirms the terminal state
- **THEN** the `finished` flag MUST be `true`

#### Scenario: Controller state is whole-session only

- **WHEN** authors pause or resume a motion controller
- **THEN** the controller state machine MUST only model whole-session states (`idle`, `queued`, `running`, `paused`, `finished`)
- **AND** the controller MUST NOT expose a partially-paused or key-level aggregated state

#### Scenario: Terminal opacity handoff does not allow simultaneous ownership

- **GIVEN** a `spatialized2d` motion animates `opacity`
- **WHEN** the element animating mask releases or updates `opacity` after `stop()`, `reset()`, or `finish()`
- **THEN** the SDK MUST avoid a post-terminal state where native outer opacity and inner DOM opacity both continue to own the same visual `opacity`

#### Scenario: Terminal host-transform handoff does not allow simultaneous ownership

- **GIVEN** a host-transform target (`spatialized2d` or `dynamic3d`) animates host `transform`
- **WHEN** the element animating mask releases or updates host `transform` after `stop()`, `reset()`, or `finish()`
- **THEN** the SDK MUST avoid a post-terminal state where native host transform and DOM host transform both continue to own the same visual `transform`

#### Scenario: A new play session clears terminal host-transform ownership

- **GIVEN** a host-transform target previously entered a terminal host-transform ownership state through `stop()`, `reset()`, or `finish()`
- **WHEN** application code starts a new session with `api.play()` from `idle` or `finished`
- **THEN** the SDK MUST clear the prior terminal host-transform ownership decision
- **AND** the new active session MUST update the element animating mask according to the target kind

### Requirement: V1 public authoring centers on from/to and timeline, with tracks retained as the canonical internal model

The hook MUST accept a config that is one of three mutually exclusive shapes:

1. **Segment config** (recommended default): `{ from, to, duration, timingFunction? }`
2. **Timeline config** (recommended keyframe path): `{ duration, timeline: { "0%": { ...values, timingFunction? }, ... "100%": { ...values } }, timingFunction? }`
3. **Tracks config** (compatibility / advanced escape hatch): `{ duration, tracks: [{ property, keyframes: [{ at, value, timingFunction? }], timingFunction? }], timingFunction? }`

Passing more than one of `from`/`to`, `tracks`, or `timeline` in the same config object MUST be a type error (discriminated union). Internally, segment config and timeline config MUST compile to tracks before execution. When native playback is used for `useAnimation`, that unified path MUST continue executing the canonical tracks model and MUST NOT downgrade into a legacy native segment command.

All kinds MUST use visual transform paths (`transform.translate.*`, `opacity`, etc.) in all config shapes.

#### Scenario: from/to compiles to tracks

- **WHEN** authors pass `{ from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5 }`
- **THEN** the SDK MUST internally compile this to a single track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 1 }] }` before execution

#### Scenario: tracks config executes directly

- **WHEN** authors pass `{ duration, tracks: [...] }`
- **THEN** the SDK MUST execute the tracks directly without transformation

#### Scenario: timeline config compiles to tracks

- **WHEN** authors pass `{ duration: 2, timeline: { "0%": { opacity: 0 }, "50%": { opacity: 0.8 }, "100%": { opacity: 1 } } }`
- **THEN** the SDK MUST compile this to a single track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 1, value: 0.8 }, { at: 2, value: 1 }] }` before execution

#### Scenario: tracks is not the primary v1 review path

- **WHEN** user-facing API summary docs present v1 usage
- **THEN** they MUST prioritize `from/to` and `timeline` as the public authoring path
- **AND** `tracks` MAY remain documented only as the canonical internal model or a compatibility / advanced input retained by the current implementation and types

#### Scenario: passing both timeline and tracks is a type error

- **WHEN** authors pass `{ duration, timeline: {...}, tracks: [...] }`
- **THEN** the SDK MUST reject the config at type level and/or throw at validation

#### Scenario: passing both timeline and from/to is a type error

- **WHEN** authors pass `{ from, to, duration, timeline: {...} }`
- **THEN** the SDK MUST reject the config at type level and/or throw at validation

#### Scenario: Shared config shape is target-agnostic

- **WHEN** authors submit the same config (segment, tracks, or timeline) and the resulting `animation` is bound to any of `<div enable-xr>`, `<Model>`, or `<Reality>`
- **THEN** validation MUST accept the same config structure before target-specific playback begins

### Requirement: Timeline percentage keyframe config (CSS @keyframes style)

The hook MUST accept a config with a `timeline` field containing percentage keys (strings matching `/^\d+(\.\d+)?%$/`) mapped to `SpatializedMotionKeyframeValues` (`SpatializedVisualValues` extended with optional `timingFunction`). The `timeline` object MUST NOT contain non-percentage keys; all config-level options (`duration`, `timingFunction`, `delay`, `loop`, `playbackRate`, callbacks) remain on the outer config.

`timeline` is a single CSS `@keyframes`-style keyframe object. It is not a sequential choreography primitive. V1 does not support `timeline: []`, multiple actions, or multi-stage orchestration semantics.

Desugaring rules:
- Each percentage key is parsed to a normalized ratio in `[0, 1]` and multiplied by `duration` to obtain the `at` value in seconds.
- Each animated property is independently collected across all percentage frames to form one track per property.
- If a property is absent from a given percentage frame, no keyframe is generated for that property at that time point.
- The `timeline` object MUST contain at least 2 percentage keys; fewer MUST cause a validation error.
- Decimal percentages (e.g. `"30.33%"`) MUST be supported.

#### Scenario: Decimal percentage parsing

- **WHEN** authors pass `{ duration: 10, timeline: { "0%": { opacity: 0 }, "30.33%": { opacity: 0.5 }, "100%": { opacity: 1 } } }`
- **THEN** the SDK MUST compile to `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 3.033, value: 0.5 }, { at: 10, value: 1 }] }`

#### Scenario: Per-property independent collection

- **GIVEN** `{ duration: 2, timeline: { "0%": { opacity: 0, transform: { translate: { x: 0 } } }, "50%": { opacity: 1 }, "100%": { opacity: 0.5, transform: { translate: { x: 100 } } } } }`
- **THEN** the SDK MUST produce two tracks:
  - `opacity`: keyframes at `[{ at: 0, value: 0 }, { at: 1, value: 1 }, { at: 2, value: 0.5 }]`
  - `transform.translate.x`: keyframes at `[{ at: 0, value: 0 }, { at: 2, value: 100 }]` (no keyframe at `at: 1` because `"50%"` did not declare `transform.translate.x`)

#### Scenario: Missing property uses hold rule

- **GIVEN** a track compiled from timeline has its first keyframe at `at: 1` (from `"50%"` with `duration: 2`)
- **WHEN** evaluating at `t = 0.5`
- **THEN** the track value MUST equal the first keyframe's value (hold rule)

#### Scenario: Fewer than 2 percentage keys rejected

- **WHEN** authors pass `{ duration: 1, timeline: { "50%": { opacity: 1 } } }`
- **THEN** validation MUST throw before playback

#### Scenario: Invalid key in timeline rejected

- **WHEN** the `timeline` object contains a key that does not match `/^\d+(\.\d+)?%$/` (e.g. `"halfway"`, `"duration"`)
- **THEN** validation MUST throw before playback

#### Scenario: timeline array is rejected

- **WHEN** authors pass `timeline: []`
- **THEN** validation MUST reject the config before playback

#### Scenario: Per-keyframe timingFunction in timeline

- **WHEN** authors pass `{ duration: 2, timeline: { "0%": { opacity: 0, timingFunction: "easeInOut" }, "100%": { opacity: 1 } } }`
- **THEN** the compiled keyframe at `at: 0` MUST carry `timingFunction: "easeInOut"` (controlling interpolation from 0% to 100%)

#### Scenario: Last keyframe timingFunction is ignored

- **GIVEN** a timeline where only the `"100%"` frame has `timingFunction: "easeIn"`
- **WHEN** the timeline is compiled and evaluated
- **THEN** the `timingFunction` on the final keyframe MUST have no effect (there is no next keyframe to interpolate toward)

---

### Requirement: Three-level timingFunction cascade

When evaluating the interpolation curve between two adjacent keyframes, the SDK MUST resolve `timingFunction` with the following priority (highest to lowest):

1. `keyframe.timingFunction` -- per-keyframe (controls this keyframe -> next keyframe)
2. `track.timingFunction` -- per-track default
3. `config.timingFunction` -- global default
4. `'linear'` -- built-in fallback

This cascade applies uniformly to all three config shapes (segment, tracks, timeline). In timeline configs, the per-keyframe `timingFunction` within a percentage frame maps to level 1 after desugaring.

#### Scenario: Default fallback is linear

- **WHEN** no `timingFunction` is specified at any level
- **THEN** interpolation between keyframes MUST use `'linear'`

#### Scenario: Config-level timingFunction overrides default

- **WHEN** config specifies `timingFunction: 'easeInOut'` and no track or keyframe overrides
- **THEN** all keyframe pairs MUST use `'easeInOut'`

#### Scenario: Track-level overrides config-level

- **GIVEN** config `timingFunction: 'linear'` and a track with `timingFunction: 'easeIn'`
- **THEN** that track's keyframe pairs MUST use `'easeIn'`

#### Scenario: Keyframe-level overrides track-level

- **GIVEN** a track with `timingFunction: 'easeIn'` and a keyframe with `timingFunction: 'easeOut'`
- **THEN** the segment from that keyframe to the next MUST use `'easeOut'`

#### Scenario: Last keyframe timingFunction has no effect

- **GIVEN** the final keyframe (highest `at`) in a track has `timingFunction: 'easeIn'`
- **THEN** it MUST be ignored (no subsequent keyframe exists)

---

### Requirement: React API binds to one AnimationObject per binding

The SDK MUST implement container motion through one opaque React `animation` binding backed by at most one native `AnimationObject` at a time. Per-target controller class aliases MUST NOT be part of the public API.

#### Scenario: React single hook with bind-time AnimationObject creation

- **WHEN** authors call `useAnimation(config)` and pass `animation` to a component via `xr-animation` prop
- **THEN** the SDK MUST resolve the target from the component type and create an `AnimationObject` for that target

### Requirement: Separate clip playback on Model

USD embedded animation on `SpatializedStatic3DElement` (`play`/`pause` on model ref) MUST remain a separate API from transform timeline `motion.play()`.

#### Scenario: Model clip playback does not consume motion api

- **WHEN** authors call `ref.play()` on a `<Model>`
- **THEN** the motion tuple API MUST remain independent and MUST NOT be implied by the clip playback call

### Requirement: Target resolved at bind time

The public hook `useAnimation(config)` MUST NOT require a `kind` field in config. The returned `animation` binding MUST carry a deferred target. Target resolution MUST occur when the binding is passed as `xr-animation` prop to a component:

| Component | Resolved target |
|-----------|-----------------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` |
| `<Model>` | `static3d` |
| `<Reality>` | `dynamic3d` |

#### Scenario: Binding to enable-xr resolves 2D

- **WHEN** `animation` from `useAnimation(config)` is passed as `xr-animation` to `<div enable-xr>`
- **THEN** the SDK MUST resolve target to `spatialized2d` and create an element `AnimationObject`

#### Scenario: Binding to Model resolves static3d

- **WHEN** `animation` is passed as `xr-animation` to `<Model>`
- **THEN** the SDK MUST resolve target to `static3d` and create an element `AnimationObject`

#### Scenario: Binding to Reality resolves dynamic3d

- **WHEN** `animation` is passed as `xr-animation` to `<Reality>`
- **THEN** the SDK MUST resolve target to `dynamic3d` and create an element `AnimationObject`

#### Scenario: Single binding constraint

- **WHEN** the same `animation` binding is passed to more than one component simultaneously
- **THEN** the SDK MUST throw or warn and only the first bind MUST take effect

#### Scenario: Pre-bind playback queuing

- **WHEN** `api.play()` is called before `animation` is bound to any component
- **THEN** the play command MUST be queued and executed once the target is resolved

#### Scenario: autoStart false does not swallow explicit pre-bind play

- **GIVEN** `useAnimation({ ..., autoStart: false })` returns an unbound `animation`
- **WHEN** application code explicitly calls `api.play()` before binding
- **AND** the `animation` later binds to a supported target
- **THEN** the SDK MUST execute the queued explicit play
- **AND** `autoStart: false` MUST only prevent implicit play-on-bind

#### Scenario: explicit pre-bind finish flushes after binding

- **GIVEN** `useAnimation({ ..., autoStart: false })` returns an unbound `animation`
- **WHEN** application code explicitly calls `api.finish()` before binding
- **AND** the `animation` later binds to a supported target
- **THEN** the SDK MUST flush the queued explicit `finish` command after the native-backed `AnimationObject` is created
- **AND** the API MUST remain driven by native state confirmation rather than a locally synthesized `finished` state

#### Scenario: Static3D opacity is rejected during validation

- **GIVEN** an animation binding resolves to `static3d`
- **WHEN** the normalized config contains an `opacity` track
- **THEN** `validateSpatializedMotionConfig` MUST reject the config before `CreateSpatializedElementAnimation`
- **AND** the SDK MUST NOT silently ignore the `opacity` track