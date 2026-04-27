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
- **WHEN** playback starts
- **THEN** the animation MUST begin from the entity's current transform state for each animated field

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

#### Scenario: Infinite loop with reset

- **GIVEN** the animation config sets `loop` to `true`
- **WHEN** playback reaches the target state
- **THEN** the animation MUST continue repeating without ending after a single cycle

#### Scenario: Infinite reverse loop

- **GIVEN** the animation config sets `loop` to `{ reverse: true }`
- **WHEN** playback reaches either endpoint
- **THEN** the next cycle MUST reverse direction between `from` and `to`

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

---

### Requirement: Prevent competing transform updates during playback

While an animation session controls a transform field, the SDK MUST avoid sending competing ordinary transform updates for that same field.

#### Scenario: Animated and non-animated fields coexist

- **GIVEN** an animation session controls `position`
- **WHEN** React re-renders the entity while the session is active
- **THEN** the SDK MUST suppress ordinary `position` transform synchronization for that session
- **AND** non-animated fields such as `rotation` or `scale` MUST continue to update normally if they are not part of the active animation