# SpatialDiv motion (timeline API)

## Terminology

**WebSpatial runtime** means `runtime-capabilities` snapshot `type !== null`. **Plain Web** means `type === null` or `supports('useAnimation', ['element']) === false`.

## ADDED Requirements

### Requirement: Provide SpatialDiv motion API with a single style outlet

The SDK MUST provide `useSpatialDivMotion(config)` returning `{ style, api }`. The `style` object MUST carry only whitelisted animated fields (`opacity` and structured `transform` as a CSS string composed translate → rotate → scale). Applications MUST integrate motion by merging `style` onto spatialized HTML nodes (e.g. `<div enable-xr style={{ ...layout, ...motion.style }} />`). The motion API MUST NOT require an `animation` prop.

#### Scenario: Hook return shape

- **WHEN** application code calls `useSpatialDivMotion(config)`
- **THEN** the hook MUST return an object with `style` and `api`
- **AND** `api` MUST expose `play`, `pause`, `cancel`, `isAnimating`, `isPaused`, `finished`, and `playState`

#### Scenario: simple sugar desugars to a timeline

- **WHEN** application code calls `useSpatialDivMotion.simple({ from, to, duration, ... })`
- **THEN** the SDK MUST behave equivalently to a `useSpatialDivMotion` call whose `tracks` contain one track per animated scalar in `from`/`to` with keyframes at `at: 0` and `at: duration`

---

### Requirement: Timeline supports multi-track overlapping keyframes

The config MUST include a global `duration` (seconds, `> 0`, finite) and a non-empty `tracks` array. Each track MUST specify a `property` from the visual whitelist, at least two `keyframes` with `at` in seconds in `[0, duration]`, and MAY specify per-track `easing`.

#### Scenario: Overlapping tracks with different time ranges

- **GIVEN** `duration: 5` and tracks for `transform.translate.x` (0→100 from 0s to 5s) and `opacity` (0→1 from 3s to 5s)
- **WHEN** `api.play()` runs to completion on the Web backend or native backend
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

- **GIVEN** `supports('useAnimation', ['element'])` is `false`
- **WHEN** application calls `useSpatialDivMotion` with valid tracks and `api.play()`
- **THEN** `style` MUST update over time until the timeline completes
- **AND** `api.isAnimating` MUST be `true` while the timeline is running
- **AND** `onComplete` MUST fire when a non-looping timeline finishes

#### Scenario: Native backend when capable

- **GIVEN** `supports('useAnimation', ['element'])` is `true` and the motion controller has bound a `Spatialized2DElement`
- **WHEN** `api.play()` is called
- **THEN** the SDK MUST send a timeline `play` command through `animateSpatialDiv` (or successor) and apply suppression for animated fields per Plan A rules
- **AND** the Web backend MUST NOT run concurrently for the same hook instance

---

### Requirement: Imperative playback and lifecycle

`play`, `pause`, `cancel`, and lifecycle callbacks MUST follow the same semantics as `spatial-div-animation` session API where applicable: paused `play` resumes; running `play` is no-op; `cancel` restores start-of-session values; `onComplete`/`onCancel` mutual exclusion; `onError` for async native failures.

#### Scenario: play is no-op while running

- **GIVEN** a non-looping timeline is actively playing
- **WHEN** `api.play()` is called again without `cancel()`
- **THEN** the call MUST be a no-op

---

### Requirement: Motion does not use animation prop binding

The motion path MUST NOT require binding an opaque `animation` object to the element. Suppression and native binding MUST be owned by the motion controller internal to the SDK.

#### Scenario: No animation prop on motion path

- **WHEN** an application uses only `useSpatialDivMotion` and `style`
- **THEN** the element MUST NOT need an `animation` prop for motion to function
