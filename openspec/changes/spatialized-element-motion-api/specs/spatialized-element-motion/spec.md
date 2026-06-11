# SpatializedElement motion (umbrella)

## ADDED Requirements

### Requirement: Umbrella defines declarative motion with bind-time target resolution

The platform MUST document and implement declarative timeline motion for these targets: `spatialized2d`, `static3d`, and `dynamic3d`. Each target MUST have a sub-spec defining property whitelists, native backend, and React integration. The public hook MUST NOT require `config.kind`; the target is resolved automatically when the returned `animation` binding is passed as `xr-animation` prop to a component (`<div enable-xr>` → spatialized2d, `<Model>` → static3d, `<Reality>` → dynamic3d). `SpatialEntity` transform timelines are out of scope for this umbrella (use existing `useAnimation`).

#### Scenario: Capability matrix is normative

- **WHEN** a product owner reviews motion support
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST list each kind with shipped vs planned status

### Requirement: Shared playback API shape

All kinds that support declarative motion MUST expose `SpatializedPlaybackApi` (`play`, `pause`, `resume`, `stop`, `reset`, `finish`, `playState`, `isAnimating`, `isPaused`, `finished`). Controller-level `pause()` and `resume()` MUST be whole-session operations with no `keys` parameter. Selective per-track / per-action control is intentionally out of scope for this change and, if needed in the future, MUST be designed as a separate track/action-level API (for example `pauseTrack(trackId)`), not by extending controller `pause()` / `resume()`.

#### Scenario: Playback API is available regardless of binding target

- **WHEN** authors obtain a motion tuple from `useAnimation(config)`
- **THEN** the returned `api` MUST expose `play`, `pause`, `resume`, `stop`, `reset`, `finish`, `playState`, `isAnimating`, `isPaused`, and `finished` regardless of which component the `animation` is later bound to

#### Scenario: pause() and resume() do not accept extra arguments

- **WHEN** application code attempts to call `api.pause()` or `api.resume()` with an extra argument
- **THEN** the controller API MUST reject the call at the type level and MUST not expose any public overload that accepts additional controller-control parameters

#### Scenario: stop() freezes active session at current values

- **WHEN** `api.stop()` is called while the animation is running or paused
- **THEN** the active session MUST terminate, the style MUST freeze at the sampled values of the current playback time, `playState` MUST become `idle`, `finished` MUST become `false`, and `onStop` MUST be invoked with the frozen values

#### Scenario: reset() reverts to initial values

- **WHEN** `api.reset()` is called
- **THEN** the style MUST revert to the `from` (initial) values, `playState` MUST become `idle`, `finished` MUST become `false`, and `onReset` MUST be invoked with the initial values

#### Scenario: finish() jumps to final values

- **WHEN** `api.finish()` is called
- **THEN** the style MUST jump to the `to` (final) values, `playState` MUST become `finished`, `finished` MUST become `true`, and `onComplete` MUST be invoked with the final values

#### Scenario: reset() is not a no-op while idle

- **GIVEN** the motion is already `idle`
- **WHEN** `api.reset()` is called
- **THEN** the SDK MUST still emit the `from` values and MUST keep `playState` at `idle`

#### Scenario: finish() is not a no-op while idle

- **GIVEN** the motion is already `idle`
- **WHEN** `api.finish()` is called
- **THEN** the SDK MUST still emit the `to` values and MUST transition `playState` to `finished`

#### Scenario: Style value source is backend-symmetric

- **WHEN** a termination method (`stop`, `reset`, `finish`) is invoked
- **THEN** on Web backend the style values MUST be computed by the JS timeline evaluator; on native backend the style values MUST be provided by the native runtime (with JS evaluator as fallback if native does not return values)

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

- **WHEN** `api.finish()` is called
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

- **WHEN** `api.finish()` is called
- **THEN** the `finished` flag MUST be `true`

#### Scenario: Controller state is whole-session only

- **WHEN** authors pause or resume a motion controller
- **THEN** the controller state machine MUST only model whole-session states (`idle`, `queued`, `running`, `paused`, `finished`)
- **AND** the controller MUST NOT expose a partially-paused or key-level aggregated state

### Requirement: Unified config accepts three mutually exclusive shapes

The hook MUST accept a config that is one of three mutually exclusive shapes:

1. **Segment config** (recommended default): `{ from, to, duration, timingFunction? }`
2. **Tracks config** (advanced): `{ duration, tracks: [{ property, keyframes: [{ at, value, timingFunction? }], timingFunction? }], timingFunction? }`
3. **Timeline config** (CSS @keyframes style): `{ duration, timeline: { "0%": { ...values, timingFunction? }, ... "100%": { ...values } }, timingFunction? }`

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

### Requirement: Single Core controller implementation

The SDK MUST implement container motion with one `SpatializedMotionController` class parameterized by the binding target (resolved when `animation` is mounted on a component). Per-target controller class aliases MUST NOT be part of the public API.

#### Scenario: React single hook with bind-time resolution

- **WHEN** authors call `useAnimation(config)` and pass `animation` to a component via `xr-animation` prop
- **THEN** the SDK MUST resolve the target from the component type and route to the same controller implementation with the matching target policy

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
- **THEN** the SDK MUST resolve target to `spatialized2d` and activate the 2D policy (Web RAF + native)

#### Scenario: Binding to Model resolves static3d

- **WHEN** `animation` is passed as `xr-animation` to `<Model>`
- **THEN** the SDK MUST resolve target to `static3d` and activate native-only policy

#### Scenario: Binding to Reality resolves dynamic3d

- **WHEN** `animation` is passed as `xr-animation` to `<Reality>`
- **THEN** the SDK MUST resolve target to `dynamic3d` and activate native-only policy

#### Scenario: Single binding constraint

- **WHEN** the same `animation` binding is passed to more than one component simultaneously
- **THEN** the SDK MUST throw or warn and only the first bind MUST take effect

#### Scenario: Pre-bind playback queuing

- **WHEN** `api.play()` is called before `animation` is bound to any component
- **THEN** the play command MUST be queued and executed once the target is resolved
