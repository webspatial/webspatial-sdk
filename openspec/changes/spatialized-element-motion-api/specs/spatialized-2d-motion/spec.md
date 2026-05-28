# Spatialized 2D motion (reference implementation)

## Scope

`Spatialized2DElement` (HTML SpatialDiv / `enable-xr`) is the **reference target** for the unified motion system. When `animation` from `useSpatializedMotion` is bound to an `enable-xr` node via `motion` prop, the SDK resolves the target to `spatialized2d`. It is the only target that supports the **dual backend** (Web RAF + native).

## ADDED Requirements

### Requirement: 2D is the reference kind for timeline motion

The SDK MUST treat `Spatialized2DElement` motion as the 2D target, resolved when `animation` is bound to an `enable-xr` node. Implementation uses the shared `SpatializedMotionController` with 2D policy (Web RAF + native `SpatialDivAnimationManager`).

#### Scenario: Public React entry

- **WHEN** authors call `useSpatializedMotion(config)` (with `from/to` or `tracks`) and bind `animation` to an `enable-xr` node
- **THEN** the hook MUST return `[animation, api, style]` with Web RAF when native motion is unavailable

#### Scenario: Core controller parity

- **WHEN** authors call `element.motion(config)` on a `Spatialized2DElement` or `new SpatializedMotionController(config, 'spatialized2d')`
- **THEN** playback behavior MUST be equivalent for the same timeline config

---

### Requirement: Provide SpatialDiv motion API with a single style outlet

The SDK MUST provide `useSpatializedMotion(config)` returning `[animation, api, style]`. For `spatialized2d` (binding to `enable-xr`), `style` carries active animated values. The `style` object MUST carry only whitelisted animated fields (`opacity` and structured `transform` as a CSS string composed translate → rotate → scale). Applications MUST integrate motion by merging `style` onto spatialized HTML nodes.

#### Scenario: Hook return shape

- **WHEN** application code calls `useSpatializedMotion(config)` and binds `animation` to an `enable-xr` node
- **THEN** the hook MUST return a tuple with `animation`, `api`, and `style`
- **AND** `api` MUST expose `play`, `pause`, `cancel`, `isAnimating`, `isPaused`, `finished`, and `playState`

#### Scenario: from/to config compiles to tracks internally

- **WHEN** application code calls `useSpatializedMotion({ from, to, duration, ... })` and binds to an `enable-xr` node
- **THEN** the SDK MUST internally compile `from/to` to `tracks` containing one track per animated scalar with keyframes at `at: 0` and `at: duration`, then execute via the same timeline pipeline

---

### Requirement: Timeline supports multi-track overlapping keyframes

The config MUST include a global `duration` (seconds, `> 0`, finite) and a non-empty `tracks` array. Each track MUST specify a `property` from the visual whitelist, at least two `keyframes` with `at` in seconds in `[0, duration]`, and MAY specify per-track `easing`.

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

### Requirement: Dual backend — Web MUST animate

When the native motion backend is not active, the SDK MUST use a **Web backend** that drives the same `style` outlet via keyframe evaluation (e.g. `requestAnimationFrame`). The Web backend MUST NOT treat `play()` as a silent no-op.

#### Scenario: Plain browser play animates style

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` is `false`
- **WHEN** application binds `animation` to an `enable-xr` node with valid tracks and calls `api.play()`
- **THEN** `style` MUST update over time until the timeline completes
- **AND** `onComplete` MUST fire when a non-looping timeline finishes

#### Scenario: WebSpatial runtime uses native backend only

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` is `true`
- **WHEN** `api.play()` is called on a valid timeline bound to an `enable-xr` node
- **THEN** the SDK MUST use the native motion backend
- **AND** the Web RAF backend MUST NOT run for playback on the same hook instance

#### Scenario: play before bind does not fall back to Web RAF

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` is `true`
- **AND** `api.play()` runs before the `motion` binding has attached an element
- **THEN** the SDK MUST NOT start Web RAF playback as a fallback
- **AND** native playback MUST begin once the element is bound

---

### Requirement: Native timeline play (Phase 2b)

The bridge `play` command MUST accept an optional `timeline` field. When `timeline` is present, native MUST evaluate that document. When absent, native MUST use existing `from`/`to` segment interpolation.

#### Scenario: Wire shape matches motion config

- **WHEN** JS sends `play` with `timeline`
- **THEN** `timeline` MUST include `duration`, optional `delay`, optional `playbackRate`, optional `loop`, and non-empty `tracks`
- **AND** each track MUST include `property`, `keyframes` with `at` in seconds, and `easing`

#### Scenario: Segment and timeline are mutually exclusive

- **WHEN** `play` includes `timeline` — native MUST ignore `from`/`to`
- **WHEN** `play` omits `timeline` — native MUST use `from`/`to` segment

#### Scenario: Segment-equivalent timeline optimization

- **GIVEN** every track has exactly two keyframes at `at === 0` and `at === duration`, all tracks share one easing
- **THEN** the SDK MAY send native segment `from`/`to` instead of `timeline`

---

### Requirement: Native timeline evaluation matches Web evaluator

Native MUST sample each track independently at timeline time `t`, then assemble the target using the same rules as the Web `evaluateMotionTimeline`.

#### Scenario: Per-track segment interpolation

- **GIVEN** a track with keyframes `[{ at: a, value: va }, { at: b, value: vb }]` and easing `e`
- **WHEN** sampling at `t` with `a <= t <= b`
- **THEN** native MUST compute linear progress `(t - a) / (b - a)`, apply easing, and lerp

#### Scenario: Hold before first and after last keyframe

- **WHEN** `t` is before first keyframe → value equals first keyframe's value
- **WHEN** `t` is after last keyframe → value equals last keyframe's value

#### Scenario: Compose transform order

- **WHEN** multiple transform scalar tracks are active at time `t`
- **THEN** native MUST compose translate → rotate → scale in fixed order

---

### Requirement: Imperative playback and lifecycle

`play`, `pause`, `cancel`, and lifecycle callbacks MUST follow session semantics: paused `play` resumes; running `play` is no-op; `cancel` restores start-of-session values; `onComplete`/`onCancel` mutual exclusion; `onError` for async native failures.

#### Scenario: play is no-op while running

- **GIVEN** a non-looping timeline is actively playing
- **WHEN** `api.play()` is called again without `cancel()`
- **THEN** the call MUST be a no-op

---

### Requirement: Portal suppression during native playback

While a native session is alive, the SDK MUST suppress Portal DOM sync for animated fields.

#### Scenario: Suppression field set from tracks

- **GIVEN** a timeline with any `transform.*` track → `transform` in suppressed set
- **GIVEN** a timeline with `opacity` track → `opacity` in suppressed set

#### Scenario: Suppression cleared on terminal state

- **WHEN** session reaches finished or idle after cancel → suppression cleared

---

### Requirement: Motion binding for native sessions

Native sessions MUST use `motion` prop / `SpatializedMotionBinding`, not the legacy `animation` prop.

#### Scenario: Unbind cancels session

- **GIVEN** an active native session
- **WHEN** motion binding unbinds
- **THEN** SDK MUST cancel session; `onCancel` MUST NOT fire (aligned with unbind semantics)

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
