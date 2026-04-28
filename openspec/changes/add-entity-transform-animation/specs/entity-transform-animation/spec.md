## ADDED Requirements

### Requirement: Expose entity transform animation API

The SDK MUST provide an entity transform animation API consisting of a React `useAnimation(config)` hook, an entity `animation` prop, and an imperative playback object for controlling animation sessions.

#### Scenario: Hook return shape

- **WHEN** application code calls `useAnimation(config)`
- **THEN** the hook MUST return a two-item tuple of `[animation, api]`
- **AND** `api` MUST expose `play`, `pause`, `resume`, `stop`, `isAnimating`, and `isPaused`

#### Scenario: Entity animation prop

- **WHEN** application code passes the returned `animation` object to an entity component
- **THEN** the component MUST treat that object as the animation input for transform playback
- **AND** the animation contract MUST be usable without spreading hidden animation fields into ordinary entity props

#### Scenario: animation object MUST NOT be bound to multiple entities

- **GIVEN** the same `animation` object is already bound to an entity
- **WHEN** application code attempts to bind that same `animation` object to a second entity
- **THEN** the SDK MUST throw immediately
- **AND** the throw MUST happen when the second entity attempts to bind the `animation` prop, not later at `autoStart` or `api.play()`

#### Scenario: Replace or remove animation prop on the same entity

- **GIVEN** an entity is already bound to `animationA`, and it may have an alive session
- **WHEN** a later render replaces the entity's `animation` prop with `animationB`, or removes the `animation` prop
- **THEN** the SDK MUST stop the session for `animationA` first (if any) and invoke `animationA`'s `onStop`
- **AND** if `animationB` exists and its `autoStart` is `true` (or omitted), the SDK MUST start a new session for `animationB` after stopping the old session and invoke `animationB`'s `onStart`
- **AND** the old session’s `onStop` MUST fire before the new session’s `onStart`
- **AND** the stop command for the old session MUST be sent to the native bridge before the play command for the new session

---

### Requirement: Animate transform subsets

The SDK MUST allow transform animation for `position`, `rotation`, and `scale`, either individually or in combination.

#### Scenario: Animate a subset of transform fields

- **GIVEN** the animation config targets only one or two transform fields
- **WHEN** playback starts
- **THEN** only the targeted fields MUST be controlled by the animation session
- **AND** untargeted transform fields MUST remain under ordinary entity prop control

#### Scenario: Omit from state

- **GIVEN** the animation config omits `from`
- **WHEN** `api.play()` is called (or autoStart triggers)
- **THEN** the native layer MUST snapshot the entity's current transform at that moment and use it as the starting state for each animated field
- **AND** the snapshot MUST NOT be taken earlier than that playback request moment (including hook creation time or entity mount time)
- **AND** the snapshot MUST only cover the transform fields declared in `to`; fields not present in `to` MUST NOT be snapshotted or affected by the animation session
- **AND** `delay` MUST only affect when visual motion begins and MUST NOT change when the start snapshot is captured

---

### Requirement: Define rotation units and interpolation

#### Scenario: Rotation values use degrees

- **WHEN** the animation config specifies `rotation` values
- **THEN** the SDK MUST interpret them as Euler angles in **degrees**, not radians
- **AND** the Euler rotation convention (axis order and coordinate system semantics) MUST match the existing entity `rotation` prop conventions (the SDK's established transform semantics)

#### Scenario: Rotation interpolation uses shortest-path quaternion SLERP

- **WHEN** the native layer interpolates rotation
- **THEN** it MUST use quaternion SLERP via the shortest path
- **AND** a single-axis rotation greater than 180° in one animation segment MAY produce unexpected results due to shortest-path behavior — this is a documented limitation of the first version

---

### Requirement: Support playback timing options

The animation config MUST support `duration`, `timingFunction`, `delay`, `autoStart`, and `loop`, where `loop` accepts either `true` or `{ reverse?: boolean }`.

#### Scenario: Auto-start by default

- **GIVEN** the animation config does not set `autoStart`
- **WHEN** the target entity is mounted and bound
- **THEN** playback MUST begin automatically

#### Scenario: Manual start

- **GIVEN** the animation config sets `autoStart` to `false`
- **WHEN** the entity is mounted
- **THEN** playback MUST remain idle until `api.play()` is called

#### Scenario: Call play before the entity is bound

- **GIVEN** the target entity is not yet mounted and bound
- **WHEN** application code calls `api.play()`
- **THEN** the SDK MUST queue the request and execute it after the entity is mounted and bound
- **AND** the playback request moment for the queued request MUST be the actual execution moment (when the entity is bound)
- **AND** if the entity transform is updated externally while queued, the start snapshot MUST use the entity's current transform at the execution moment
- **AND** `api.isAnimating` MUST be `true` while the request is queued
- **AND** the config used for the queued play MUST be the config at the time `play()` was called, not at the time the entity is bound
- **AND** if `api.pause()` or `api.stop()` is called while the request is queued, the SDK MUST process them in call order: `stop()` cancels the queued play and fires `onStop`; `pause()` causes the play to start in paused state once the entity is bound

#### Scenario: Delayed playback

- **GIVEN** the animation config sets a positive `delay`
- **WHEN** playback is requested
- **THEN** the animation MUST wait for that delay before visual motion begins
- **AND** the playback session MUST remain controllable during the delay period

#### Scenario: Pause during delay period

- **GIVEN** the animation config sets a positive `delay` and playback has been requested
- **WHEN** application code calls `api.pause()` before the delay period expires
- **THEN** the remaining delay time MUST be preserved
- **AND** when `api.resume()` is called, the delay MUST continue from where it was paused rather than restarting from the full delay duration

#### Scenario: stop during delay period

- **GIVEN** an animation session is in the delay phase
- **WHEN** application code calls `api.stop()`
- **THEN** `onStop` MUST fire once
- **AND** `onStop` MUST receive the entity's current transform state at the stop moment

---

#### Scenario: Infinite loop with reset

- **GIVEN** the animation config sets `loop` to `true`
- **WHEN** playback reaches the target state
- **THEN** the animation MUST reset to the `from` state (or the initial state if `from` is omitted) and replay toward `to`, repeating indefinitely without ending after a single cycle
- **AND** when `from` is omitted, the "initial state" MUST be the start snapshot captured at the session's first `play` moment and MUST NOT be re-snapshotted each cycle
- **AND** the reset from `to` back to `from` MUST be instantaneous with no easing or transition; applications that need smooth direction reversal SHOULD use `loop: { reverse: true }` instead

#### Scenario: Infinite reverse loop

- **GIVEN** the animation config sets `loop` to `{ reverse: true }`
- **WHEN** playback reaches either endpoint
- **THEN** the next cycle MUST reverse direction between `from` and `to`

#### Scenario: Default behavior for loop objects

- **GIVEN** the animation config sets `loop` to an object with `reverse` omitted or `false` (e.g. `{}` or `{ reverse: false }`)
- **WHEN** playback reaches the target state
- **THEN** the behavior MUST be equivalent to the reset loop of `loop: true`

#### Scenario: Invalid animation config

- **GIVEN** application code provides an invalid animation config such as missing transform targets or unsupported loop shape
- **WHEN** the SDK validates the config for playback
- **THEN** the SDK MUST throw instead of silently ignoring the invalid config

#### Scenario: Timing value validation

The SDK MUST enforce the following ranges at validation time and throw on violation:

| Field | Valid range | Notes |
|---|---|---|
| `duration` | `> 0`, finite | `0`, negative, `NaN`, and `Infinity` MUST be rejected |
| `delay` | `>= 0`, finite | Negative, `NaN`, and `Infinity` MUST be rejected |
| `timingFunction` | One of `'linear'`, `'easeIn'`, `'easeOut'`, `'easeInOut'` | Any other string MUST be rejected |
| `loop` | `true`, `false`, `undefined`, or `{ reverse?: boolean }` | Other shapes MUST be rejected |

#### Scenario: Transform value validation

The SDK MUST enforce the following ranges at validation time and throw on violation:

| Field | Valid range | Notes |
|---|---|---|
| `position.*` | finite | Any component being `NaN` or `Infinity` MUST be rejected |
| `rotation.*` | finite | Any component being `NaN` or `Infinity` MUST be rejected |
| `scale.*` | `>= 0`, finite | Negative, `NaN`, and `Infinity` MUST be rejected. Zero scale is permitted (e.g. for exit animations) but may produce a degenerate transform; animating **from** a zero-scale state is not recommended and may yield undefined interpolation results |

---

### Requirement: Define isAnimating state semantics

A session is **alive** when it is in any of the following states: queued, delaying, running, or paused. A session is **not alive** when idle (no session or session ended). `isAnimating` reflects whether the session is actively progressing, not whether it is alive. `isPaused` reflects whether the session is frozen but still alive.

`api.isAnimating` and `api.isPaused` MUST reflect the animation session state according to the following model:

| State | `isAnimating` | `isPaused` | Description |
|---|---|---|---|
| idle | `false` | `false` | No session, or session ended |
| queued | `true` | `false` | `play()` called before entity bound, waiting for bind |
| delaying | `true` | `false` | `play()` called, delay period active, visual motion not yet started |
| running | `true` | `false` | Visual motion in progress |
| paused | `false` | `true` | Session paused via `api.pause()` |

A session exists (is alive) when `isAnimating || isPaused` is `true`. No-op conditions for `pause()`, `resume()`, and `stop()` apply when `!isAnimating && !isPaused` (i.e. no alive session).

#### Scenario: isAnimating during delay

- **GIVEN** the animation config sets a positive `delay`
- **WHEN** `api.play()` is called and the delay period is active
- **THEN** `api.isAnimating` MUST be `true`

#### Scenario: isAnimating after pause

- **GIVEN** an animation session is running or delaying
- **WHEN** `api.pause()` is called
- **THEN** `api.isAnimating` MUST be `false`

#### Scenario: isAnimating after stop or completion

- **WHEN** the animation session ends via `api.stop()` or natural completion
- **THEN** `api.isAnimating` MUST be `false` before any lifecycle callback fires

---

### Requirement: Provide imperative playback lifecycle

The playback API MUST let applications start, pause, resume, and stop an animation session, and it MUST surface lifecycle callbacks for start, natural completion, and stop.

#### Scenario: Start callback

- **WHEN** the animation session requested by `api.play()` is established successfully and enters `delaying` or `running`
- **THEN** the configured `onStart` callback MUST be invoked once for that session
- **AND** if that request is still queued because the entity is not yet bound, `onStart` MUST NOT fire early
- **AND** if that request fails before the session enters `delaying` or `running`, `onStart` MUST NOT fire

#### Scenario: Pause and resume

- **GIVEN** an animation session is alive
- **WHEN** application code calls `api.pause()` and later `api.resume()`
- **THEN** the same session MUST continue from its paused progress instead of starting a fresh session

#### Scenario: Config updates apply to the next play only

- **GIVEN** application code updates the `config` passed to `useAnimation(config)` during React re-renders
- **WHEN** the current session is `delaying`, `running`, or `paused`
- **THEN** the current session MUST NOT be affected by the config update
- **AND** the next `api.play()` MUST use the latest `config`

#### Scenario: Natural completion callback

- **WHEN** a non-looping animation finishes naturally
- **THEN** the configured `onComplete` callback MUST receive the entity's final transform state from the playback result

#### Scenario: Stop callback

- **WHEN** application code calls `api.stop()`
- **THEN** the configured `onStop` callback MUST receive the entity's current transform state at the stop point

#### Scenario: TransformValues coordinate space and units

- **WHEN** `onComplete` or `onStop` delivers a `TransformValues` payload
- **THEN** all values MUST represent the entity's **local** transform
- **AND** `rotation` values MUST be Euler angles in **degrees**, consistent with the input convention of `AnimationConfig`

#### Scenario: Callback invocation count and exclusivity

- **WHEN** `api.play()` starts an animation session
- **THEN** `onStart` MUST be invoked at most once for that session
- **AND** when the session ends, `onComplete` and `onStop` MUST be mutually exclusive, and each MUST be invoked at most once for that session

#### Scenario: onError callback count and relation to other callbacks

- **WHEN** an asynchronous bridge or native command fails
- **THEN** `onError` MUST be invoked at most once for that failed command
- **AND** if the failed command is `play`, `onStart`, `onComplete`, and `onStop` MUST NOT be invoked for that failed request
- **AND** if the failed command is `pause`, `resume`, or `stop`, the failure itself MUST NOT trigger `onComplete` or `onStop`

#### Scenario: Control methods are no-op in invalid states

- **GIVEN** there is no alive session (`isAnimating` is `false` AND `isPaused` is `false`)
- **WHEN** application code calls `api.pause()`, `api.resume()`, or `api.stop()`
- **THEN** the call MUST be a no-op (no error thrown, no lifecycle callback invoked, no native command sent)

#### Scenario: Serialize control commands in call order

- **GIVEN** a hook instance calls control methods like `play`, `pause`, `resume`, and `stop` in quick succession
- **WHEN** the SDK sends control commands to the native layer
- **THEN** the SDK MUST send those commands to the native bridge in the same call order, and the bridge MUST deliver them to native in that order

#### Scenario: Play while an alive session already exists

- **GIVEN** an animation session is already alive (`queued`, `delaying`, `running`, or `paused`)
- **WHEN** application code calls `api.play()` again
- **THEN** the SDK MUST stop the existing session first and start a new session with the current config
- **AND** the `onStop` callback for the previous session MUST fire before the new session’s `onStart`
- **AND** `api.isAnimating` MUST be `false` when the previous session’s `onStop` fires, and MUST be `true` when the new session’s `onStart` fires

#### Scenario: Each play generates a new session id

- **WHEN** `api.play()` starts a new animation session
- **THEN** the SDK MUST generate a new globally-unique `animationId` for that session
- **AND** subsequent `pause`, `resume`, and `stop` calls MUST target the session identified by that `animationId`

---

#### Scenario: Unsupported runtime warning

- **GIVEN** `supports('useAnimation')` is `false`
- **WHEN** application code still attempts to use `useAnimation`
- **THEN** the SDK MUST surface a warning indicating that entity transform animation is not supported in the current runtime
- **AND** the warning MUST be emitted at most once per hook instance
- **AND** the SDK MUST NOT begin native playback for that request

#### Scenario: API behavior in unsupported runtime

- **GIVEN** `supports('useAnimation')` is `false`
- **WHEN** application code calls `api.play()`
- **THEN** the call MUST be a no-op (no error thrown, no native command sent)
- **AND** `onStart`, `onComplete`, `onStop`, and `onError` MUST NOT be invoked
- **AND** `api.isAnimating` MUST remain `false`

#### Scenario: Asynchronous bridge or native failure during play

- **GIVEN** `supports('useAnimation')` is `true`
- **WHEN** the SDK receives a failure result from native playback or the JSBridge while executing a play request
- **THEN** the SDK MUST invoke the configured `onError` callback with an `AnimationError` containing at least `animationId`, the command type, and a human-readable failure reason
- **AND** if `onError` is not configured, the SDK MUST log the error via `console.error`
- **AND** the SDK MUST NOT transition the session into an alive state

#### Scenario: Asynchronous bridge or native failure for pause/resume/stop

- **GIVEN** `supports('useAnimation')` is `true` and there is an alive session
- **WHEN** the SDK receives a failure result from native playback or the JSBridge while executing `pause`, `resume`, or `stop`
- **THEN** the SDK MUST invoke the configured `onError` callback with an `AnimationError` containing at least `animationId`, the command type, and a human-readable failure reason
- **AND** if `onError` is not configured, the SDK MUST log the error via `console.error`
- **AND** the session MUST remain in its state prior to the failed command, allowing application code to retry or take alternative action

---

### Requirement: Prevent competing transform updates during playback

While an animation session controls a transform field, the SDK MUST avoid sending competing ordinary transform updates for that same field.

#### Scenario: Animated and non-animated fields coexist

- **GIVEN** an animation session controls `position`
- **WHEN** React re-renders the entity while the session is alive
- **THEN** the SDK MUST suppress ordinary `position` transform synchronization for that session
- **AND** non-animated fields such as `rotation` or `scale` MUST continue to update normally if they are not part of the alive animation session
- **AND** the latest prop values received for suppressed fields MUST be cached for resuming ordinary synchronization after suppression is released
- **AND** the cache MUST be maintained per field (`position`, `rotation`, `scale`) and MUST be retained until the first React render cycle after the session ends, at which point ordinary synchronization resumes with the prop values from that render and the cache is discarded

#### Scenario: Suppression release after animation ends

- **GIVEN** an animation session was controlling `position`
- **WHEN** the animation session ends via natural completion or `api.stop()`
- **THEN** the SDK MUST release the suppression for `position` before firing the lifecycle callback
- **AND** ordinary transform synchronization for `position` MUST resume on the next React render cycle after the callback using the latest prop values in that render cycle

#### Scenario: Stop preserves the stop-point transform

- **GIVEN** an animation session is alive and the entity is mid-flight
- **WHEN** application code calls `api.stop()`
- **THEN** the entity MUST remain at its current in-flight transform (the stop point)
- **AND** the entity MUST NOT jump to `from` or `to`

---

### Requirement: Clean up animation on unmount

#### Scenario: Entity unmounts while an alive session exists

- **GIVEN** an animation session is in any alive state (queued, delaying, running, or paused)
- **WHEN** the entity component unmounts
- **THEN** the SDK MUST stop the native animation session and release associated resources
- **AND** lifecycle callbacks (`onStart`, `onStop`, `onComplete`, `onError`) MUST NOT fire after unmount

#### Scenario: Entity unmounts during delay

- **GIVEN** an animation session is in the delay phase
- **WHEN** the entity component unmounts
- **THEN** the SDK MUST cancel the pending animation without starting visual motion
- **AND** no lifecycle callbacks MUST fire