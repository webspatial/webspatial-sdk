## ADDED Requirements

### Requirement: Provide SpatialDiv animation API

The SDK MUST provide a `SpatialDiv` animation API consisting of a React `useAnimation(config)` hook, an `animation` prop that can be passed to a spatialized HTML node, and an imperative playback object for controlling the animation session.

#### Scenario: Hook return shape

- **WHEN** application code calls `useAnimation(config)` for `SpatialDiv`
- **THEN** the hook MUST return a tuple `[animation, api]`
- **AND** `api` MUST expose `play`, `pause`, `resume`, `stop`, `isAnimating`, and `isPaused`

#### Scenario: Bind animation prop to SpatialDiv

- **WHEN** application code passes the returned `animation` object to a spatialized HTML node with `enable-xr`
- **THEN** the SDK MUST treat it as the `SpatialDiv` animation input
- **AND** application code MUST NOT need to merge animation fields into normal `style` or DOM props

#### Scenario: animation applies only to spatialized HTML nodes

- **WHEN** application code passes the `animation` object to a non-`enable-xr` DOM node
- **THEN** the SDK MUST emit a warning
- **AND** the SDK MUST NOT start native playback

#### Scenario: animation object MUST NOT be reused across elements

- **GIVEN** the same `animation` object is already bound to one `SpatialDiv`
- **WHEN** application code attempts to bind it to a second `SpatialDiv`
- **THEN** the SDK MUST throw immediately
- **AND** it MUST throw at the moment the second element attempts to bind the `animation` prop, not delayed until `autoStart` or `api.play()`

#### Scenario: Replace or remove animation prop

- **GIVEN** a `SpatialDiv` is bound to `animationA` and may have an alive session
- **WHEN** a later render replaces the element's `animation` prop with `animationB`, or removes the `animation` prop
- **THEN** the SDK MUST first stop `animationA`'s session (if any) and invoke `animationA`'s `onStop`
- **AND** if `animationB` exists and its `autoStart` is `true` (or omitted), the SDK MUST start a new session for `animationB` after stopping the old one, and invoke `animationB`'s `onStart`
- **AND** the old session's `onStop` MUST fire before the new session's `onStart`
- **AND** the old session's stop command MUST be sent to the native bridge before the new session's play command

#### Scenario: Entity and SpatialDiv animation objects are not interchangeable

- **GIVEN** `useAnimation` returns an `animation` object with an internal kind tag derived from the `config.to` key set
- **WHEN** application code binds an entity-kind animation object to a `SpatialDiv`, or binds a SpatialDiv-kind animation object to an entity component
- **THEN** the SDK MUST throw immediately

---

### Requirement: Only whitelisted properties are animatable

`SpatialDiv` animation MUST support only these whitelisted fields: `back`, `transform.translate.x`, `transform.translate.y`, `transform.translate.z`, `opacity`, `depth`, `width`, `height`.

#### Scenario: Animate a subset of whitelisted fields

- **GIVEN** the config includes only one or more whitelisted fields
- **WHEN** the SDK validates and plays the config
- **THEN** the SDK MUST control only the declared fields
- **AND** undeclared fields MUST continue using the existing regular sync path

#### Scenario: transform is translation-only

- **WHEN** the config includes `transform`
- **THEN** the SDK MUST accept only the `translate: { x, y, z }` structure with three translation components
- **AND** the SDK MUST NOT interpret it as an arbitrary CSS transform string, rotation, scale, or matrix interpolation

#### Scenario: width and height semantics

- **WHEN** the config includes `width` or `height`
- **THEN** the SDK MUST interpret it as a direct override of native `SpatialDiv` size
- **AND** the SDK MUST NOT automatically mutate the DOM element's CSS layout size

#### Scenario: Unsupported animation fields

- **GIVEN** application code provides fields outside the whitelist, such as `backgroundMaterial`, `cornerRadius`, `color`, or any unknown field
- **WHEN** the SDK validates the config before playing
- **THEN** the SDK MUST throw
- **AND** the SDK MUST NOT silently ignore those fields

#### Scenario: Entity keys and SpatialDiv keys MUST NOT be mixed

- **GIVEN** `to` includes both entity keys (`position`, `rotation`, `scale`) and SpatialDiv keys (`back`, `transform`, `opacity`, `depth`, `width`, `height`)
- **WHEN** the SDK validates the config
- **THEN** the SDK MUST throw

---

### Requirement: Validate SpatialDiv animation config

The SDK MUST validate numeric values and shapes of the `SpatialDiv` animation config before playback. Invalid inputs MUST throw.

#### Scenario: Timing parameter validation

The SDK MUST enforce the following ranges during validation and throw when violated:

| Field | Valid range | Notes |
|---|---|---|
| `duration` | `> 0`, finite | `0`, negatives, `NaN`, and `Infinity` MUST be rejected. Default: `0.3` |
| `delay` | `>= 0`, finite | negatives, `NaN`, and `Infinity` MUST be rejected |
| `timingFunction` | one of `'linear'`, `'easeIn'`, `'easeOut'`, `'easeInOut'` | any other string MUST be rejected |
| `loop` | `true`, `false`, `undefined`, or `{ reverse?: boolean }` | any other shape MUST be rejected |

#### Scenario: Whitelisted numeric validation

The SDK MUST enforce the following ranges during validation and throw when violated:

| Field | Valid range | Notes |
|---|---|---|
| `back` | finite | `NaN` and `Infinity` MUST be rejected |
| `depth` | finite | `NaN` and `Infinity` MUST be rejected |
| `transform.translate.x/y/z` | finite | `NaN` and `Infinity` MUST be rejected |
| `width` | `>= 0`, finite | negatives, `NaN`, and `Infinity` MUST be rejected |
| `height` | `>= 0`, finite | negatives, `NaN`, and `Infinity` MUST be rejected |
| `opacity` | finite, inclusive `[0, 1]` | values outside `[0, 1]`, `NaN`, and `Infinity` MUST be rejected |

#### Scenario: Missing animation target

- **WHEN** `to` declares none of the whitelisted fields
- **THEN** the SDK MUST throw

---

### Requirement: Define isAnimating / isPaused state semantics

A session is **alive** when it is in any of these states: queued, delaying, running, paused. A session is **not alive** when idle (no session or the session has ended). `isAnimating` reflects whether the session is actively progressing; `isPaused` reflects whether the session is frozen while still alive.

`api.isAnimating` and `api.isPaused` MUST reflect the session state as follows:

| State | `isAnimating` | `isPaused` | Description |
|---|---|---|---|
| idle | `false` | `false` | no session, or the session has ended |
| queued | `true` | `false` | `play()` called before element binding; waiting to bind |
| delaying | `true` | `false` | `play()` called; in delay; visible motion has not started |
| running | `true` | `false` | visible motion is in progress |
| paused | `false` | `true` | session is paused via `api.pause()` |

A session exists (alive) iff `isAnimating || isPaused` is `true`. `pause()`, `resume()`, and `stop()` are no-op when `!isAnimating && !isPaused` (no alive session).

#### Scenario: isAnimating is true during delay

- **GIVEN** the config sets a positive `delay`
- **WHEN** `api.play()` is called and the session is in the delay phase
- **THEN** `api.isAnimating` MUST be `true`

#### Scenario: isAnimating is false after pause

- **GIVEN** the session is running or delaying
- **WHEN** `api.pause()` is called
- **THEN** `api.isAnimating` MUST be `false`
- **AND** `api.isPaused` MUST be `true`

#### Scenario: isAnimating is false after stop or natural completion

- **WHEN** the session ends via `api.stop()` or natural completion
- **THEN** `api.isAnimating` MUST become `false` before any lifecycle callback fires
- **AND** `api.isPaused` MUST be `false`

---

### Requirement: Provide imperative playback and lifecycle

The playback API MUST allow applications to start, pause, resume, and stop `SpatialDiv` animation sessions, and MUST provide `onStart`, `onComplete`, `onStop`, and `onError` lifecycle callbacks.

#### Scenario: Default autoStart

- **GIVEN** `autoStart` is omitted
- **WHEN** the target `SpatialDiv` finishes binding
- **THEN** playback MUST start automatically

#### Scenario: Manual start

- **GIVEN** `autoStart` is set to `false`
- **WHEN** the target `SpatialDiv` finishes binding
- **THEN** playback MUST remain idle until `api.play()` is called

#### Scenario: play() before element is bound

- **GIVEN** the `SpatialDiv` is not yet bound on the native side
- **WHEN** application code calls `api.play()`
- **THEN** the SDK MUST place the request into the queued state
- **AND** execute it in call order after binding completes
- **AND** if `from` is omitted, the start snapshot MUST be taken from the current value at actual playback execution time
- **AND** `delay` MUST only affect when visible motion begins and MUST NOT change snapshot timing
- **AND** the snapshot MUST cover only fields declared in `to`; fields absent from `to` MUST NOT be snapshotted or affected by the session
- **AND** `api.isAnimating` MUST be `true` while the request is queued
- **AND** the queued play MUST use the config at `play()` call time (not at bind time)
- **AND** if `api.stop()` is called while queued, the SDK MUST cancel the queued play and invoke `onStop`
- **AND** if `api.pause()` is called while queued, the session MUST be established in paused state after binding

#### Scenario: pause during queued then bind

- **GIVEN** `api.play()` entered queued before binding
- **AND** application code calls `api.pause()` while queued
- **WHEN** the element later binds and the session is successfully established
- **THEN** the first session state MUST be paused
- **AND** `onStart` MUST be invoked once for that session
- **AND** `api.isPaused` MUST be `true`

#### Scenario: onStart callback

- **WHEN** the session requested by `api.play()` is successfully established, with first state delaying, running, or paused due to queued pause
- **THEN** `onStart` MUST be invoked once for that session
- **AND** if the request is still queued (element not yet bound), `onStart` MUST NOT fire early
- **AND** if the request fails before the session is established, `onStart` MUST NOT fire

#### Scenario: pause and resume during delay

- **GIVEN** the config sets a positive `delay` and playback has been requested
- **WHEN** application code calls `api.pause()` and later `api.resume()`
- **THEN** the remaining delay time MUST be preserved
- **AND** after resume, delay MUST continue from the paused point (not restart the full delay)

#### Scenario: stop after pausing during delay

- **GIVEN** the session is in the delay phase
- **AND** application code calls `api.pause()`
- **WHEN** application code later calls `api.stop()`
- **THEN** `onStop` MUST fire once
- **AND** `onStop` MUST receive the element's current values at the stop moment

#### Scenario: stop during delay

- **GIVEN** the session is in the delay phase
- **WHEN** application code calls `api.stop()`
- **THEN** `onStop` MUST fire once
- **AND** `onStop` MUST receive the element's current values at the stop moment

#### Scenario: Reset loop

- **GIVEN** `loop` is `true`, or `{}` / `{ reverse: false }`
- **WHEN** the animation reaches the target state
- **THEN** it MUST instantly reset to `from` and replay
- **AND** if `from` is omitted, the "initial state" MUST be the start snapshot from the first `play` of the session, and MUST NOT be re-snapshotted each loop
- **AND** the reset from `to` back to `from` MUST be instantaneous (no easing/transition)

#### Scenario: Reverse loop

- **GIVEN** `loop` is `{ reverse: true }`
- **WHEN** the animation reaches either endpoint
- **THEN** the next iteration MUST play in reverse between `from` and `to`

#### Scenario: Natural completion callback

- **WHEN** a non-looping animation completes naturally
- **THEN** `onComplete` MUST receive the native final values
- **AND** the returned `SpatialDivAnimatedValues` MUST contain only the final values for fields declared in `to`; fields not declared in `to` MUST NOT appear in the return value

#### Scenario: Stop callback

- **WHEN** application code calls `api.stop()`
- **THEN** `onStop` MUST receive the native stop-point values
- **AND** the returned `SpatialDivAnimatedValues` MUST contain only the stop-point values for fields declared in `to`; fields not declared in `to` MUST NOT appear in the return value

#### Scenario: Callback mutual exclusion and counts

- **WHEN** `api.play()` starts an animation session
- **THEN** `onStart` MUST be called at most once for that session
- **AND** when the session ends, `onComplete` and `onStop` MUST be mutually exclusive and each called at most once for that session

#### Scenario: Asynchronous failure callback

- **WHEN** bridge or native fails asynchronously for `play`, `pause`, `resume`, or `stop`
- **THEN** the SDK MUST call `onError` with an `AnimationError` containing `animationId`, `command`, and `reason`
- **AND** if `onError` is not provided, the SDK MUST log via `console.error`

#### Scenario: onError counts and relationship to other callbacks

- **WHEN** an asynchronous bridge/native command fails
- **THEN** `onError` MUST be called at most once for that failed command
- **AND** if the failed command is `play`, `onStart`, `onComplete`, and `onStop` MUST NOT be called
- **AND** if the failed command is `pause`, `resume`, or `stop`, that failure MUST NOT itself trigger `onComplete` or `onStop`

#### Scenario: Config updates do not affect alive sessions

- **GIVEN** application code updates the config passed to `useAnimation(config)` during React re-renders
- **WHEN** the current session is delaying, running, or paused
- **THEN** the current session MUST NOT be affected by the config update
- **AND** the next `api.play()` MUST use the latest config

#### Scenario: Calling play again while an alive session exists

- **GIVEN** an alive session exists (queued, delaying, running, or paused)
- **WHEN** application code calls `api.play()` again
- **THEN** the SDK MUST stop the existing session first, then start a new session using the current config
- **AND** the previous session's `onStop` MUST fire before the new session's `onStart`
- **AND** `api.isAnimating` MUST be `false` when the previous `onStop` fires, and MUST be `true` when the new `onStart` fires

#### Scenario: Each play generates a new session id

- **WHEN** `api.play()` starts a new animation session
- **THEN** the SDK MUST generate a new globally unique `animationId` for that session
- **AND** subsequent `pause`, `resume`, and `stop` calls MUST use that `animationId`

#### Scenario: stop-old failure MUST block start-new

- **GIVEN** the SDK is executing the stop-old → start-new flow
- **WHEN** the old session's stop command fails asynchronously
- **THEN** the SDK MUST call `onError`
- **AND** the old session MUST remain in its pre-failure state
- **AND** the SDK MUST NOT start the new session
- **AND** the new session's `onStart` MUST NOT fire

#### Scenario: Serialize control commands

- **GIVEN** a hook instance calls `play`, `pause`, `resume`, and `stop` rapidly
- **WHEN** the SDK sends control commands to native
- **THEN** the SDK MUST send commands to the native bridge in call order, and the bridge MUST deliver them to native in the same order

#### Scenario: Control methods are no-op when no alive session exists

- **GIVEN** there is no alive session (`isAnimating` is `false` and `isPaused` is `false`)
- **WHEN** application code calls `api.pause()`, `api.resume()`, or `api.stop()`
- **THEN** the call MUST be a no-op (no throw, no lifecycle callbacks, no native commands)

---

### Requirement: Avoid competing with regular sync during playback

When an animation session controls a `SpatialDiv` field, the SDK MUST prevent regular DOM / computed-style sync for that field from overwriting animation mid-states.

#### Scenario: Property-level suppression

- **GIVEN** a session controls any of `back`, `opacity`, `depth`, `width`, or `height`
- **WHEN** `PortalInstanceObject` performs regular property sync while the session is alive
- **THEN** the SDK MUST suppress regular sync for those controlled fields
- **AND** uncontrolled fields MUST continue to update via the existing path
- **AND** the latest prop values for suppressed fields MUST be cached for recovery after suppression ends
- **AND** caches MUST be maintained per field and used to resume regular sync on the first React render after the session ends (using that render's latest props), then discarded

#### Scenario: Transform-wide suppression

- **GIVEN** a session controls `transform`
- **WHEN** React continues to produce regular DOM transform updates while the session is alive
- **THEN** the SDK MUST suppress regular `updateTransform(matrix)` sync as a whole
- **AND** those transform updates MUST resume taking effect on the next React render after the session ends

#### Scenario: Suppression release timing

- **GIVEN** a session controls some fields
- **WHEN** the session ends via natural completion or `api.stop()`
- **THEN** the SDK MUST release suppression flags before lifecycle callbacks fire
- **AND** the next React render after callbacks MUST resume regular sync

#### Scenario: stop keeps the stop point

- **GIVEN** a session is in a mid-state
- **WHEN** application code calls `api.stop()`
- **THEN** the `SpatialDiv` MUST remain at the stop point
- **AND** the SDK MUST NOT snap it back to `from` or jump directly to `to`

#### Scenario: width and height are not written back to DOM automatically

- **GIVEN** a session controls `width` or `height`
- **WHEN** the animation completes naturally or is stopped
- **THEN** the native final size MUST be returned via `onComplete` or `onStop`
- **AND** the SDK MUST NOT automatically modify the DOM element's CSS layout size

---

### Requirement: Behavior in unsupported runtimes

When `supports('spatialDivAnimation')` is `false`, the `SpatialDiv` animation API MUST provide stable and conservative fallback behavior.

#### Scenario: Warning when using the hook

- **GIVEN** `supports('spatialDivAnimation')` is `false`
- **WHEN** application code still attempts to use `useAnimation(config)` for `SpatialDiv`
- **THEN** the SDK MUST emit a warning
- **AND** the warning MUST be emitted at most once per hook instance

#### Scenario: play is a no-op when unsupported

- **GIVEN** `supports('spatialDivAnimation')` is `false`
- **WHEN** application code calls `api.play()`
- **THEN** the call MUST be a no-op
- **AND** the SDK MUST NOT send native commands
- **AND** `onStart`, `onComplete`, `onStop`, and `onError` MUST NOT be triggered
- **AND** `api.isAnimating` MUST remain `false`

#### Scenario: Async bridge/native failure on play

- **GIVEN** `supports('spatialDivAnimation')` is `true`
- **WHEN** the SDK receives a failure result from native or JSBridge while executing a play request
- **THEN** the SDK MUST call `onError` with an `AnimationError` containing `animationId`, command type, and a human-readable reason
- **AND** if `onError` is not provided, the SDK MUST log via `console.error`
- **AND** the SDK MUST NOT transition the session into an alive state
- **AND** the `animationId` MUST NOT subsequently receive `_completed` or `_stopped`

#### Scenario: Async bridge/native failure on pause/resume/stop

- **GIVEN** `supports('spatialDivAnimation')` is `true` and there is an alive session
- **WHEN** the SDK receives a failure result from native or JSBridge while executing `pause`, `resume`, or `stop`
- **THEN** the SDK MUST call `onError`
- **AND** if `onError` is not provided, the SDK MUST log via `console.error`
- **AND** the session MUST remain in its pre-failure state, allowing retries or other actions
- **AND** the failure MUST NOT terminate the alive session; `_completed` or `_stopped` MAY still arrive later

---

### Requirement: Clean up sessions on unmount

The SDK MUST stop or cancel alive animation sessions when a `SpatialDiv` unmounts, and release related listeners and resources.

#### Scenario: Unmount during an alive session

- **GIVEN** the session is queued, delaying, running, or paused
- **WHEN** the target `SpatialDiv` unmounts
- **THEN** the SDK MUST stop or cancel the session
- **AND** after unmount, the SDK MUST NOT trigger `onStart`, `onComplete`, `onStop`, or `onError`

#### Scenario: Unmount during delay

- **GIVEN** the session is in the delay phase
- **WHEN** the target `SpatialDiv` unmounts
- **THEN** the SDK MUST cancel the pending animation and MUST NOT start visible motion
- **AND** it MUST NOT trigger any lifecycle callbacks