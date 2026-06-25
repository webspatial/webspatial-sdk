# Spatialized 2D motion (reference implementation)

## Scope

`Spatialized2DElement` (HTML SpatialDiv / `enable-xr`) is the **reference target** for the unified motion system. When `animation` from `useAnimation` is bound to an `enable-xr` node via `xr-animation` prop, the SDK resolves the target to `spatialized2d` and creates a native `AnimationObject`.

## ADDED Requirements

### Requirement: 2D is the reference kind for timeline motion

The SDK MUST treat `Spatialized2DElement` motion as the 2D target, resolved when `xr-animation` is bound to an `enable-xr` node. Target-state execution uses `SpatializedElement.createAnimation(config)` and `AnimationObject : SpatialObject`.

#### Scenario: Public React entry

- **WHEN** authors call `useAnimation(config)` (with `from/to` or `tracks`) and bind `animation` to an `enable-xr` node
- **THEN** the hook MUST return `[animation, api, style]`
- **AND** runtime target availability MUST be reported through `supports('useAnimation', ['element'])`

#### Scenario: AnimationObject parity

- **WHEN** the binding flow resolves the target to `spatialized2d`
- **THEN** playback behavior MUST be driven by the created `AnimationObject` for the same timeline config

---

### Requirement: Provide SpatialDiv motion API with a single style outlet

The SDK MUST provide `useAnimation(config)` returning `[animation, api, style]`. For `spatialized2d` (binding to `enable-xr`), `style` carries active animated values. The `style` object MUST carry only whitelisted animated fields (`opacity` and structured `transform` as a CSS string composed translate → rotate → scale). Applications MUST integrate motion by merging `style` onto spatialized HTML nodes.

#### Scenario: Hook return shape

- **WHEN** application code calls `useAnimation(config)` and binds `animation` to an `enable-xr` node
- **THEN** the hook MUST return a tuple with `animation`, `api`, and `style`
- **AND** `api` MUST expose `play`, `pause`, `stop`, `reset`, `finish`, `isAnimating`, `isPaused`, `finished`, and `playState`

#### Scenario: from/to config compiles to tracks internally

- **WHEN** application code calls `useAnimation({ from, to, duration, ... })` and binds to an `enable-xr` node
- **THEN** the SDK MUST internally compile `from/to` to `tracks` containing one track per animated scalar with keyframes at `at: 0` and `at: duration`, then execute via the same timeline pipeline

---

### Requirement: Timeline supports multi-track overlapping keyframes

The config MUST include a global `duration` (seconds, `> 0`, finite) and a non-empty `tracks` array. Each track MUST specify a `property` from the visual whitelist, at least two `keyframes` with `at` in seconds in `[0, duration]`, and MAY specify per-track `timingFunction`.

#### Scenario: Overlapping tracks with different time ranges

- **GIVEN** `duration: 5` and tracks for `transform.translate.x` (0→100 from 0s to 5s) and `opacity` (0→1 from 3s to 5s)
- **WHEN** `api.play()` runs to completion
- **THEN** sampled values at `t=1.5` MUST have `translate.x` between 0 and 100 and `opacity` MUST equal `0`
- **AND** at `t=5` MUST have `translate.x === 100` and `opacity === 1`

#### Scenario: Hold outside keyframe range within a track

- **GIVEN** a track's first keyframe is at `at: 3`
- **WHEN** evaluating at `t=1`
- **THEN** the track's value MUST equal the first keyframe's `value`

---

### Requirement: Whitelisted properties only

Track `property` values MUST be limited to: `opacity`, `transform.translate.x`, `transform.translate.y`, `transform.translate.z`, `transform.rotate.x`, `transform.rotate.y`, `transform.rotate.z`, `transform.scale.x`, `transform.scale.y`, `transform.scale.z`. Layout or spatial-size fields MUST be rejected at validation.

#### Scenario: Reject layout property track

- **WHEN** a track references `width`, `height`, `back`, `backOffset`, or `depth`
- **THEN** validation MUST throw before playback

---

### Requirement: Native-first target path with no Web RAF fallback

For the target-state `useAnimation` path, the SDK MUST NOT use a Web RAF backend when native spatial animation is unavailable. Pure Web runtimes MUST report `supports('useAnimation', ['element']) === false`.

#### Scenario: Plain browser reports unsupported

- **GIVEN** `supports('useAnimation', ['element'])` is `false`
- **WHEN** application binds `animation` to an `enable-xr` node with valid tracks
- **THEN** the SDK MUST NOT start Web RAF playback as a fallback

#### Scenario: WebSpatial runtime uses AnimationObject only

- **GIVEN** `supports('useAnimation', ['element'])` is `true`
- **WHEN** `api.play()` is called on a valid timeline bound to an `enable-xr` node
- **THEN** the SDK MUST control the native `AnimationObject`

#### Scenario: play before bind does not fall back to Web RAF

- **GIVEN** `supports('useAnimation', ['element'])` is `true`
- **AND** `api.play()` runs before the `xr-animation` binding has attached an element
- **THEN** the SDK MUST NOT start Web RAF playback as a fallback
- **AND** native playback MUST begin once the element is bound

---

### Requirement: Native create uses the canonical tracks path

For `useAnimation`, `CreateSpatializedElementAnimation` MUST carry the canonical tracks document for native execution. Native MUST evaluate that locked tracks document and MUST NOT fall back to legacy `from`/`to` segment interpolation for this API.

#### Scenario: Wire shape matches the canonical tracks model

- **WHEN** JS sends `CreateSpatializedElementAnimation` for `useAnimation`
- **THEN** the payload MUST include the canonical tracks document with `duration`, optional `delay`, optional `playbackRate`, optional `loop`, and non-empty `tracks`
- **AND** each track MUST include `property`, `keyframes` with `at` in seconds, and `timingFunction`

#### Scenario: from/to authoring shape compiles to tracks before native send

- **WHEN** application code calls `useAnimation({ from, to, duration, ... })`
- **THEN** the SDK MUST compile that authoring shape to canonical `tracks` before native create

#### Scenario: timeline authoring shape compiles to tracks before native send

- **WHEN** application code calls `useAnimation({ duration, timeline, ... })`
- **THEN** the SDK MUST compile that authoring shape to canonical `tracks` before native create

#### Scenario: tracks authoring shape stays on the same execution path

- **WHEN** application code calls `useAnimation({ duration, tracks, ... })`
- **THEN** the SDK MUST execute native playback through the same canonical tracks path without a segment downgrade

#### Scenario: Segment downgrade is forbidden for useAnimation

- **WHEN** the canonical tracks document is ready for native playback
- **THEN** the SDK MUST NOT replace it with a legacy native `from`/`to` segment command

---

### Requirement: Native timeline evaluation matches Web evaluator

Native MUST sample each track independently at timeline time `t`, then assemble the target using the same rules as the Web `evaluateMotionTimeline`.

#### Scenario: Per-track segment interpolation

- **GIVEN** a track with keyframes `[{ at: a, value: va }, { at: b, value: vb }]` and `timingFunction` `e`
- **WHEN** sampling at `t` with `a <= t <= b`
- **THEN** native MUST compute linear progress `(t - a) / (b - a)`, apply `timingFunction`, and lerp

#### Scenario: Hold before first and after last keyframe

- **WHEN** `t` is before first keyframe → value equals first keyframe's value
- **WHEN** `t` is after last keyframe → value equals last keyframe's value

#### Scenario: Compose transform order

- **WHEN** multiple transform scalar tracks are active at time `t`
- **THEN** native MUST compose translate → rotate → scale in fixed order

---

### Requirement: Imperative playback and lifecycle

`play`, `pause`, `stop`, `reset`, `finish`, and lifecycle callbacks MUST follow session semantics: paused `play` resumes; running `play` is no-op; `stop` freezes the current sampled values and only terminates an active session; `reset` always seeks to start-of-session values; `finish` always seeks to terminal values; `onComplete`/`onStop`/`onReset` mutual exclusion; `onError` for async native failures.

#### Scenario: play is no-op while running

- **GIVEN** a non-looping timeline is actively playing
- **WHEN** `api.play()` is called again without `reset()`
- **THEN** the call MUST be a no-op

#### Scenario: idle reset still emits start values

- **GIVEN** the motion is already `idle`
- **WHEN** `api.reset()` is called
- **THEN** the SDK MUST emit the `from` values, MUST keep `playState` at `idle`, and MUST keep `finished` as `false`

#### Scenario: bound idle finish still emits end values

- **GIVEN** the motion is already `idle`
- **AND** a native-backed `AnimationObject` already exists
- **WHEN** `api.finish()` is called
- **THEN** the SDK MUST emit the `to` values, MUST move `playState` to `finished`, and MUST set `finished` to `true`

---

### Requirement: Element animating mask during native playback

While native playback is actively controlling the session, until the session reaches terminal state or unbinds, the SDK MUST use the element animating mask to prevent ordinary DOM sync from overwriting animated fields.

#### Scenario: Animating mask field set from tracks

- **GIVEN** a timeline with any `transform.*` track → `transform` in the animating mask
- **GIVEN** a timeline with `opacity` track → `opacity` in the animating mask

#### Scenario: Animating mask updates on terminal state

- **WHEN** session reaches terminal state, `stop`, `reset`, `finish`, or `unbind`
- **THEN** the animating mask MUST update according to terminal ownership

---

### Requirement: Terminal opacity handoff distinguishes explicit React authored opacity

For `spatialized2d`, terminal release or update of the `opacity` animating mask MUST distinguish between explicit React authored opacity and all other CSS sources. Explicit authored opacity means only `style.opacity` provided directly in React props on the bound node. Values that appear only through `className`, stylesheet rules, inherited visual dimming, or `getComputedStyle()` output MUST NOT be treated as explicit authored opacity.

#### Scenario: stop restores explicit authored opacity after mask release

- **GIVEN** an `opacity` motion is bound to an `enable-xr` node whose React props explicitly include `style.opacity`
- **WHEN** `api.stop()` completes
- **THEN** the post-terminal visual owner for `opacity` MUST become that explicit authored `style.opacity`
- **AND** the native/current sampled stop value MUST still be used for `onStop`

#### Scenario: finish restores explicit authored opacity after mask release

- **GIVEN** an `opacity` motion is bound to an `enable-xr` node whose React props explicitly include `style.opacity`
- **WHEN** `api.finish()` completes
- **THEN** the post-terminal visual owner for `opacity` MUST become that explicit authored `style.opacity`
- **AND** the native/final sampled finish value MUST still be used for `onComplete`

#### Scenario: reset restores explicit authored opacity after mask release

- **GIVEN** an `opacity` motion is bound to an `enable-xr` node whose React props explicitly include `style.opacity`
- **WHEN** `api.reset()` completes
- **THEN** the post-terminal visual owner for `opacity` MUST become that explicit authored `style.opacity`
- **AND** the reset start value MUST still be used for `onReset`

#### Scenario: native terminal opacity stays authoritative when no explicit React style.opacity exists

- **GIVEN** an `opacity` motion is bound to an `enable-xr` node without an explicit React `style.opacity`
- **WHEN** `api.stop()`, `api.reset()`, or `api.finish()` completes
- **THEN** the post-terminal visual result for `opacity` MUST continue to come from the terminal sampled/native value

#### Scenario: terminal handoff ignores computed CSS-only opacity

- **GIVEN** the bound node's visible `opacity` comes only from `className`, stylesheet rules, inherited visual dimming, or `getComputedStyle()`
- **WHEN** terminal handoff runs after `stop()`, `reset()`, or `finish()`
- **THEN** the SDK MUST NOT classify that value as explicit authored opacity

---

### Requirement: Motion binding for native sessions

Native sessions MUST use the `xr-animation` prop / `AnimationProxy`, not the legacy `animation` prop.

#### Scenario: Unbind cancels session

- **GIVEN** an active native session
- **WHEN** xr-animation binding unbinds
- **THEN** SDK MUST tear down the session; `onReset` MUST NOT fire (aligned with unbind semantics)

---

### Requirement: Validation before native send

Timeline configs MUST pass validation before any native `play` is sent.

#### Scenario: Reject duplicate property tracks

- **WHEN** two tracks share the same `property` → validation MUST throw

#### Scenario: Reject unsorted keyframes

- **WHEN** keyframes are not sorted by non-decreasing `at` → validation MUST throw

---

## Cross-references

- Detailed 2D scenarios (archived): `archive/spatial-div-motion-api/specs/spatial-div-motion/spec.md`
- Native timeline spec (archived): `archive/spatial-div-motion-api/specs/spatial-div-motion-native-timeline/spec.md`
- Legacy session spec: `specs/legacy-session-animation/spec.md`
- Umbrella: `specs/spatialized-element-motion/spec.md`