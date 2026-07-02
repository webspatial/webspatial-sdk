# SpatialDiv motion — native timeline backend (Phase 2b)

## Terminology

- **WebSpatial runtime**: `supports('useAnimation', ['element']) === true` (visionOS / WebSpatial shell). Playback on this runtime MUST use the **native** backend only; the Web RAF backend MUST NOT run for timeline playback on the same hook instance.
- **Bound element**: a `Spatialized2DElement` attached via the hook’s `motion` binding (`__setElement`) on the same `enable-xr` node as `style`.
- **Queued session**: `api.play()` was called before bind; native playback starts when the element becomes available. This is **not** the Web motion backend.
- **Web motion backend**: RAF keyframe evaluation driving the `style` outlet — **plain browser only** (`supports('useAnimation', ['element']) === false`).
- **Native segment play**: existing `animateSpatialDiv` `play` with `from` / `to` (Phase 2a); MUST remain supported.
- **Native timeline play**: `animateSpatialDiv` `play` with a `timeline` payload (this spec).
- **Segment-equivalent timeline**: every track has exactly two keyframes at `at === 0` and `at === duration`, all tracks share one easing — MAY use native segment play instead of timeline play.

## ADDED Requirements

### Requirement: Extend bridge play command with optional timeline

The cross-layer `AnimateSpatialDivCommand` for `type: 'play'` MUST accept an optional `timeline` field. When `timeline` is present, native MUST evaluate that document. When `timeline` is absent, native MUST use existing `from` / `to` segment interpolation (unchanged Plan A behavior).

#### Scenario: Wire shape matches motion config

- **WHEN** JS sends `play` with `timeline`
- **THEN** `timeline` MUST include `duration` (seconds, `> 0`, finite), optional `delay`, optional `playbackRate`, optional `loop`, and non-empty `tracks`
- **AND** each track MUST include `property` (motion whitelist path), `keyframes` with `at` in seconds in `[0, duration]`, and `easing` (one of `linear`, `easeIn`, `easeOut`, `easeInOut`)
- **AND** keyframe `at` values MUST use **seconds**, not normalized `0..1`

#### Scenario: Segment and timeline are mutually exclusive on play

- **WHEN** `play` includes `timeline`
- **THEN** native MUST ignore `from` and `to` for interpolation (they MAY be omitted on the wire)
- **WHEN** `play` omits `timeline`
- **THEN** native MUST use `from` / `to` segment interpolation as today

#### Scenario: Non-play commands unchanged

- **WHEN** `type` is `pause`, `resume`, or `cancel`
- **THEN** the command MUST NOT carry `timeline`
- **AND** behavior MUST match `spatial-div-animation` session semantics for the same `animationId`

---

### Requirement: Native timeline evaluation matches Web evaluator

Native MUST sample each track independently at timeline time `t` (seconds, after `delay` and `playbackRate`), then assemble `SpatialDivAnimationTarget` (opacity + structured transform) using the same rules as the Web `evaluateMotionTimeline` implementation.

#### Scenario: Per-track segment interpolation

- **GIVEN** a track with keyframes `[{ at: a, value: va }, { at: b, value: vb }]` and easing `e`
- **WHEN** sampling at `t` with `a <= t <= b`
- **THEN** native MUST compute linear progress `(t - a) / (b - a)`, apply easing `e` to that progress, and lerp `va` → `vb`

#### Scenario: Hold before first and after last keyframe

- **GIVEN** a track whose first keyframe is at `at: 3`
- **WHEN** sampling at `t: 1`
- **THEN** the track value MUST equal the first keyframe's `value`
- **WHEN** sampling at `t` greater than the last keyframe's `at`
- **THEN** the track value MUST equal the last keyframe's `value`

#### Scenario: Canonical multi-track overlap (acceptance)

- **GIVEN** `duration: 5`, track `transform.translate.x`: `0` at `0s`, `100` at `5s`, `linear`; track `opacity`: `0` at `3s`, `1` at `5s`, `easeOut`
- **WHEN** native timeline play runs to completion in WebSpatial runtime
- **THEN** at `t = 1.5s` (after delay): `translate.x` MUST be `30` (±0.5) and `opacity` MUST be `0`
- **AND** at `t = 5s`: `translate.x` MUST be `100` and `opacity` MUST be `1`
- **AND** Web backend on the same config MUST produce the same values at the same `t` (±0.5 for translate, ±0.01 for opacity)

#### Scenario: Compose transform order

- **WHEN** multiple transform scalar tracks are active at time `t`
- **THEN** native MUST compose translate → rotate → scale in that fixed order when applying to the spatial entity
- **AND** units MUST match Plan A: translate in CSS pixels, rotate in degrees, scale unitless

---

### Requirement: WebSpatial runtime uses native playback only

When `supports('useAnimation', ['element'])` is `true`, `useSpatializedMotion` MUST use the **native** motion backend for `play` / `pause` / `cancel`. The Web RAF backend MUST NOT drive timeline playback on the same hook instance (no fallback, no concurrent RAF).

Native `play` payload selection on WebSpatial runtime:

1. If segment-equivalent → native **segment** `play` (`from` / `to`) — Phase 2a.
2. Else → native **timeline** `play` (`timeline` payload) — Phase 2b.

When `supports('useAnimation', ['element'])` is `false` (plain browser), only the **Web RAF** backend MAY run.

Applications on WebSpatial runtime MUST pass the `motion` binding handle on the same `enable-xr` node as `style` so the native session can attach before or when `api.play()` runs.

#### Scenario: multi-track uses timeline on AVP

- **GIVEN** the canonical multi-track config (translate `0–5s`, opacity `3–5s`)
- **AND** `supports('useAnimation', ['element'])` is `true`
- **WHEN** the element is bound and `api.play()` runs
- **THEN** the SDK MUST send `play` with `timeline` (not segment `from`/`to`)
- **AND** the Web RAF backend MUST NOT run

#### Scenario: simple entrance may use segment native path

- **GIVEN** `useSpatializedMotion.simple` with only `at: 0` and `at: duration` keyframes per property and one shared easing
- **WHEN** native play runs on AVP
- **THEN** the SDK MAY send segment `from`/`to` instead of `timeline`
- **AND** visual result MUST match timeline play within the tolerances above

#### Scenario: Plain Web uses RAF only

- **GIVEN** `supports('useAnimation', ['element'])` is `false`
- **WHEN** `api.play()` runs on any valid timeline config
- **THEN** only the Web RAF backend MUST run
- **AND** native `animateSpatialDiv` MUST NOT be invoked for that hook instance

#### Scenario: pause returns current sampled values

- **GIVEN** a native timeline session is `running`
- **WHEN** `api.pause()` succeeds on the bridge
- **THEN** the JSB pause response MUST include current animated values at the paused position
- **AND** the hook MUST apply those values to the public `style` outlet (not only a JS wall-clock estimate)

#### Scenario: play before bind queues native session (not Web RAF)

- **GIVEN** `supports('useAnimation', ['element'])` is `true`
- **AND** `api.play()` runs before `motion` has bound a `Spatialized2DElement`
- **WHEN** the session is in `queued`
- **THEN** the SDK MUST NOT start the Web RAF backend for playback
- **AND** native playback MUST start when `__setElement` attaches the element (or on a later `play()` after bind)
- **AND** applications MUST treat missing `motion` on spatial nodes as an integration error (no animation until bind)

---

### Requirement: Portal suppression during native timeline

While a native timeline session is delaying, running, or paused, the SDK MUST suppress Portal DOM sync for animated fields so layout sync does not overwrite native samples.

#### Scenario: Suppression field set from tracks

- **GIVEN** a timeline with any `transform.*` track
- **WHEN** native timeline is active
- **THEN** `transform` MUST be in the suppressed field set
- **GIVEN** a timeline with an `opacity` track
- **WHEN** native timeline is active
- **THEN** `opacity` MUST be in the suppressed field set

#### Scenario: Suppression cleared on terminal state

- **WHEN** the session reaches `finished` or `idle` after `cancel`
- **THEN** suppression MUST be cleared
- **AND** regular Portal sync MAY resume for those fields

---

### Requirement: Motion binding for native sessions

Native timeline MUST use the same element binding mechanism as Phase 2a (`motion` prop / `SpatialDivMotionBinding`), not the Plan A `animation` prop.

#### Scenario: Bind before play

- **GIVEN** `api.play()` is called before the spatial element is bound
- **WHEN** binding completes later
- **THEN** the queued native timeline play MUST start with the config captured at `play()` time

#### Scenario: Unbind cancels session

- **GIVEN** an active native timeline session
- **WHEN** the motion binding unbinds (unmount or `motion` prop removed)
- **THEN** the SDK MUST cancel the session and invoke `onCancel` per session rules

---

### Requirement: Imperative API and lifecycle parity with session API

`play`, `pause`, `cancel`, `delay`, `loop`, `playbackRate`, and callbacks for native timeline sessions MUST match `spatial-div-animation` / Plan A session semantics documented in `spatial-div-animation` spec (queued play, pause-resume without new `animationId`, running `play` no-op, callback mutual exclusion, `onError` for async failures).

#### Scenario: pause and resume timeline session

- **GIVEN** a native timeline session is `running`
- **WHEN** `api.pause()` then `api.play()` are called
- **THEN** native MUST pause and resume the same `animationId` without restarting the timeline from `t = 0`

#### Scenario: cancel restores start-of-session values

- **WHEN** `api.cancel()` is called on an active timeline session
- **THEN** native MUST restore values from the session start snapshot (fields present in tracks)
- **AND** `onCancel` MUST receive those restored values

#### Scenario: Config updates do not affect alive session

- **GIVEN** React re-renders with a new `useSpatializedMotion` config object
- **WHEN** a timeline session is delaying, running, or paused
- **THEN** the active session MUST continue with the config frozen at `play()` time

---

### Requirement: Style outlet during native timeline

While native timeline controls the entity, the hook MUST NOT drive animated fields through the Web RAF backend. The public `style` outlet MAY hold start-of-timeline values or omit animated keys during the run; it MUST NOT fight native samples.

#### Scenario: No concurrent Web and native animation

- **GIVEN** native timeline is `running`
- **WHEN** each animation frame fires in JS
- **THEN** the Web RAF loop MUST NOT call `setStyle` for animated properties

#### Scenario: After complete, style reflects terminal values

- **WHEN** a non-looping native timeline completes
- **THEN** `style` MAY reflect terminal evaluated values for app-owned merge
- **AND** `api.playState` MUST be `finished`

---

### Requirement: Validation before native send

Timeline configs MUST pass the same validation as Web (`validateSpatialDivMotionConfig`) before any native `play` is sent. Invalid configs MUST throw in JS; native MUST NOT receive malformed timelines.

#### Scenario: Reject duplicate property tracks

- **WHEN** two tracks share the same `property`
- **THEN** validation MUST throw before bridge send

#### Scenario: Reject unsorted keyframes

- **WHEN** keyframes on a track are not sorted by non-decreasing `at`
- **THEN** validation MUST throw before bridge send

---

### Requirement: Native implementation structure

visionOS MUST implement timeline evaluation inside the existing `SpatialDivAnimationSession` / `AnimateSpatialized2DElement` pipeline using `CADisplayLink` (or equivalent), replacing single-segment lerp when `timeline` is set.

#### Scenario: TimelineEvaluator ownership

- **WHEN** `play` includes `timeline`
- **THEN** native MUST construct a `TimelineEvaluator` (or equivalent) that owns per-track state
- **AND** each DisplayLink tick MUST sample all tracks at current `t`, assemble target values, and apply to the spatial entity

#### Scenario: DisplayLink tick applies entity properties

- **WHEN** a tick produces opacity and transform samples
- **THEN** native MUST update the `Spatialized2DElement` representation so the user sees motion in space (not only probe DOM)

---

### Requirement: Capability and version gate

Native timeline play MUST require the same capability gate as Plan A: `supports('useAnimation', ['element'])`. No new capability token is required for Phase 2b.

#### Scenario: Capability false falls back to Web

- **GIVEN** `supports('useAnimation', ['element'])` is `false`
- **WHEN** application uses multi-track timeline config
- **THEN** Web backend MUST animate
- **AND** native timeline MUST NOT be invoked

---

## Cross-references

- Phase 2a (segment native, no Swift timeline): [PHASE2-MINIMAL-NATIVE.md](../../PHASE2-MINIMAL-NATIVE.md)
- Web evaluator parity: `packages/react/src/spatialized-container/motion/evaluate.ts`
- Canonical demo: `/spatial-div-motion/multi-track`
- Plan A session semantics: `openspec/changes/spatial-div-animation-api/specs/spatial-div-animation/spec.md`
