## ADDED Requirements

### Requirement: Expose entity transform animation API

The SDK MUST provide an entity transform animation API consisting of a React `useAnimation(config)` hook, an entity `animation` prop, and an imperative playback object for controlling animation sessions.

#### Scenario: Hook return shape

- **WHEN** application code calls `useAnimation(config)`
- **THEN** the hook MUST return a two-item tuple of `[animation, api]`
- **AND** `api` MUST expose `play`, `pause`, `resume`, `stop`, and `isAnimating`

#### Scenario: Entity animation prop

- **WHEN** application code passes the returned `animation` object to an entity component
- **THEN** the component MUST treat that object as the animation input for transform playback
- **AND** the animation contract MUST be usable without spreading hidden animation fields into ordinary entity props

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
- **AND** the snapshot MUST NOT be taken at hook creation time or entity mount time

---

### Requirement: Define rotation units and interpolation

#### Scenario: Rotation values use degrees

- **WHEN** the animation config specifies `rotation` values
- **THEN** the SDK MUST interpret them as Euler angles in **degrees**, not radians

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

---

#### Scenario: Infinite loop with reset

- **GIVEN** the animation config sets `loop` to `true`
- **WHEN** playback reaches the target state
- **THEN** the animation MUST reset to the `from` state (or the initial state if `from` is omitted) and replay toward `to`, repeating indefinitely without ending after a single cycle

#### Scenario: Infinite reverse loop

- **GIVEN** the animation config sets `loop` to `{ reverse: true }`
- **WHEN** playback reaches either endpoint
- **THEN** the next cycle MUST reverse direction between `from` and `to`

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

---

### Requirement: Define isAnimating state semantics

`api.isAnimating` MUST reflect the animation session state according to the following model:

| State | `isAnimating` | Description |
|---|---|---|
| idle | `false` | No session, or session ended |
| delaying | `true` | `play()` called, delay period active, visual motion not yet started |
| running | `true` | Visual motion in progress |
| paused | `false` | Session paused via `api.pause()` |

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

- **WHEN** `api.play()` starts a new animation session
- **THEN** the configured `onStart` callback MUST be invoked once for that session

#### Scenario: Pause and resume

- **GIVEN** an animation session is active
- **WHEN** application code calls `api.pause()` and later `api.resume()`
- **THEN** the same session MUST continue from its paused progress instead of starting a fresh session

#### Scenario: Natural completion callback

- **WHEN** a non-looping animation finishes naturally
- **THEN** the configured `onComplete` callback MUST receive the entity's final transform state from the playback result

#### Scenario: Stop callback

- **WHEN** application code calls `api.stop()`
- **THEN** the configured `onStop` callback MUST receive the entity's current transform state at the stop point

#### Scenario: Play while session is already active

- **GIVEN** an animation session is already active
- **WHEN** application code calls `api.play()` again
- **THEN** the SDK MUST stop the existing session first and start a new session with the current config
- **AND** the `onStop` callback for the previous session MUST fire before the new session’s `onStart`

---

#### Scenario: Unsupported runtime warning

- **GIVEN** `supports('useAnimation')` is `false`
- **WHEN** application code still attempts to use `useAnimation`
- **THEN** the SDK MUST surface a warning indicating that entity transform animation is not supported in the current runtime
- **AND** the SDK MUST NOT begin native playback for that request

#### Scenario: API behavior in unsupported runtime

- **GIVEN** `supports('useAnimation')` is `false`
- **WHEN** application code calls `api.play()`
- **THEN** the call MUST be a no-op (no error thrown, no native command sent)
- **AND** `onStart`, `onComplete`, and `onStop` MUST NOT be invoked
- **AND** `api.isAnimating` MUST remain `false`

---

### Requirement: Prevent competing transform updates during playback

While an animation session controls a transform field, the SDK MUST avoid sending competing ordinary transform updates for that same field.

#### Scenario: Animated and non-animated fields coexist

- **GIVEN** an animation session controls `position`
- **WHEN** React re-renders the entity while the session is active
- **THEN** the SDK MUST suppress ordinary `position` transform synchronization for that session
- **AND** non-animated fields such as `rotation` or `scale` MUST continue to update normally if they are not part of the active animation

#### Scenario: Suppression release after animation ends

- **GIVEN** an animation session was controlling `position`
- **WHEN** the animation session ends via natural completion or `api.stop()`
- **THEN** the SDK MUST release the suppression for `position` before firing the lifecycle callback
- **AND** ordinary transform synchronization for `position` MUST resume on the next React render cycle after the callback

#### Scenario: Stop preserves the stop-point transform

- **GIVEN** an animation session is active and the entity is mid-flight
- **WHEN** application code calls `api.stop()`
- **THEN** the entity MUST remain at its current in-flight transform (the stop point)
- **AND** the entity MUST NOT jump to `from` or `to`

---

### Requirement: Clean up animation on unmount

#### Scenario: Entity unmounts during active animation

- **GIVEN** an animation session is in any active state (delaying, running, or paused)
- **WHEN** the entity component unmounts
- **THEN** the SDK MUST stop the native animation session and release associated resources
- **AND** lifecycle callbacks (`onStop`, `onComplete`) MUST NOT fire after unmount

#### Scenario: Entity unmounts during delay

- **GIVEN** an animation session is in the delay phase
- **WHEN** the entity component unmounts
- **THEN** the SDK MUST cancel the pending animation without starting visual motion
- **AND** no lifecycle callbacks MUST fire