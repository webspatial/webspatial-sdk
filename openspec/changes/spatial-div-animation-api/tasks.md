## Phase 0: POC Verification (opacity single-property, end-to-end)

**Goal**: Run the complete vertical chain with a single `opacity` property to verify native `CADisplayLink` frame-driven architecture feasibility and suppression mechanism.

**Execution strategy**:

- **Core SDK + React SDK**: Ship formal implementation (API layer is uncontroversial, no rework expected)
- **Native (visionOS)**: Implement first version per design; await test page validation before extending to remaining properties
- **testServer**: Add test page for manual end-to-end verification

**Priority rationale**: Both independent feasibility assessments (`feasibility-visionOS.md` and `feasibility-visionOS-analysis.md`) confirm suppression is the first blocking point, while CADisplayLink interpolation itself has low technical uncertainty. Therefore the POC validates both simultaneously.

### 0.1 React SDK — useAnimation SpatialDiv Branch (formal implementation)

- [x] 0.1.1 Implement `resolveAnimationKind(config)` mutual exclusion check + `useSpatialDivAnimation(config, active)` skeleton (dual-path unconditional call pattern)
- [x] 0.1.2 Implement `SpatialDivAnimationConfig` validation (whitelist, numeric ranges, timingFunction, loop structure, entity/SpatialDiv key mutual exclusion)
- [x] 0.1.3 Implement `SpatialDivAnimatedProps` generation and `animation` prop binding (only opacity field live, rest stubbed)
- [x] 0.1.4 Implement `AnimationApi` (play/pause/cancel/isAnimating/isPaused/playState/finished) — sends commands via core-sdk, listens to events to update state

### 0.2 Core SDK — Bridge Session Flow (formal implementation)

- [x] 0.2.1 Add `animateSpatialDiv(command)` method to `Spatialized2DElement`, encapsulating play/pause/resume/cancel command dispatch
- [x] 0.2.2 Define `AnimateSpatialized2DElement` JSBridge command structure (type + from/to + duration + timingFunction + delay + loop + playbackRate)
- [x] 0.2.3 Register `{animationId}_completed` / `{animationId}_canceled` / `{animationId}_failed` event listeners, callback to React layer

### 0.3 Native — Suppression Infrastructure

- [x] 0.3.1 Introduce field-level suppression flag for `opacity` in `PortalInstanceObject` (or Swift-side equivalent) (`_suppressedFields: Set<string>`); during alive session `updateSpatializedElementProperties()` skips suppressed fields
- [x] 0.3.2 Verify: during suppression, React-side CSS opacity change → native does not respond; after release → normal sync resumes

### 0.4 Native — Animation Engine Skeleton

- [x] 0.4.1 Create `SpatialDivAnimationSession.swift`: holds `CADisplayLink`, implements `play()` / `pause()` / `resume()` / `cancel()` / `invalidate()` state machine
- [x] 0.4.2 Create `SpatialDivAnimationManager.swift`: manages sessions keyed by `animationId`, at most one active session per element
- [x] 0.4.3 Implement cubic approximation interpolation for 4 `timingFunction` variants
- [x] 0.4.4 Implement `opacity` frame-driven interpolation: per-frame `lerp(from.opacity, to.opacity, easedProgress)` → write to `SpatializedElement.opacity`

### 0.5 Native — Bridge Command Registration

- [x] 0.5.1 Register `AnimateSpatialized2DElement` command in `SpatialScene.setupJSBListeners()`, dispatch to `SpatialDivAnimationManager`
- [x] 0.5.2 Implement `{animationId}_completed` / `{animationId}_canceled` event callbacks to JS

### 0.6 testServer — Test Page

- [x] 0.6.1 Add `poc-spatial-div-animation.html` test page: SpatialDiv container + Play/Pause/Resume/Cancel buttons + event log panel
- [x] 0.6.2 Page uses `useAnimation` hook (formal API) to trigger opacity animation, demonstrating full DX flow
- [x] 0.6.3 Page includes suppression verification: auto-modifies CSS opacity during animation, observe whether native ignores it

### 0.7 End-to-End Verification (manual, run by you on test page)

- [x] 0.7.1 Play → native opacity animation visible
- [x] 0.7.2 Animation completes → `onComplete` callback fires, finalValues.opacity correct
- [x] 0.7.3 Cancel → opacity instantly restores to from, `onCancel` callback fires
- [x] 0.7.4 Pause → opacity freezes at intermediate value; Resume → continues from pause point
- [x] 0.7.5 Suppression active during animation (JS opacity modification does not affect animation)
- [x] 0.7.6 Normal opacity sync resumes after animation ends
- [x] 0.7.7 Opacity 0→1 animation smooth with no visible frame drops at 90Hz

### Go/No-Go Criteria

| Condition | Pass → | Fail → |
|---|---|---|
| 0.7.1–0.7.6 all pass | Extend to remaining whitelisted properties | Analyze failure cause, adjust native architecture |
| Systematic stuttering at 90Hz | — | Evaluate dropping to 60fps or switching to `TimelineView` approach |
| `@Observable` per-frame writes cause large-scale SwiftUI redraws | — | Evaluate batch write optimization or `objectWillChange` throttling |
| Flash-back unavoidable after suppression release | — | Evaluate delayed release strategy or forced state sync |

---

## 1. Public API And Capability Contract

- [x] 1.1 Define `SpatialDiv` `useAnimation` config types (`SpatialDivAnimationConfig`, `SpatialDivAnimatedValues`), return types (`SpatialDivAnimatedProps`, `AnimationApi`), and `AnimationError`, covering only the visual whitelist: `transform.translate.x/y/z`, `transform.rotate.x/y/z`, `transform.scale.x/y/z`, and `opacity`. Specify default `duration = 0.3`, `playbackRate = 1`, `opacity` in inclusive `[0, 1]`, `rotate` in degrees, and `scale` as unitless multipliers.
- [x] 1.2 Implement "dual-path unconditional call + active short-circuit" dispatch in `useAnimation`: top-level `resolveAnimationKind(config)` determines kind; `useEntityAnimation(config, active)` and `useSpatialDivAnimation(config, active)` called unconditionally in parallel (satisfying Rules of Hooks); inactive side effects short-circuit returning noop API
  - **Depends on** 1.1 (needs SpatialDiv config type definitions)
- [x] 1.3 Add public typing for the `animation` prop on spatialized HTML nodes and restrict it to the `enable-xr` path; add `__kind` binding validation (throw when binding entity animation to SpatialDiv or vice versa).
  - **Depends on** 1.2 (needs the `__kind` tagging mechanism)
- [x] 1.4 Extend runtime capability data and docs with the public contract for `supports('useAnimation', ['element'])`.
- [x] 1.5 Implement SpatialDiv animation config validation: visual whitelist restrictions, numeric ranges (including `opacity` inclusive `[0, 1]` and finite `transform.translate/rotate/scale` values), `timingFunction`, `loop` shape, entity/SpatialDiv key mutual exclusion, and rejection for `width`, `height`, `back` / `backOffset`, `depth`, or other layout/spatial-size fields.
  - **Depends on** 1.1 (needs type definitions)

## 2. Core SDK And Bridge Session Flow

- [x] 2.1 Add `animateSpatialDiv(command)` to `Spatialized2DElement` in `@webspatial/core-sdk`: `play` returns `AnimateSpatialDivResult`, others return `void`.
  - **Depends on** 1.1 (needs command/result types)
- [x] 2.2 Design and wire the JSBridge command `AnimateSpatialized2DElement`, plus `_completed` (payload `SpatialDivAnimatedValues`), `_canceled` (payload `SpatialDivAnimatedValues`), and `_failed` (payload `AnimationError`) naming and payloads; payloads include only visual whitelist fields; ensure listeners are registered before sending `play`.
  - **Depends on** 2.1 (needs command entrypoint)
- [x] 2.3 Implement command serialization for `play`/`pause`/`resume`/`cancel` (send in call order), global uniqueness for session ids, and async failure reporting via `_failed`; enforce terminal event mutual exclusion (`_completed` vs `_canceled` for the same `animationId`).
  - **Depends on** 2.2 (needs bridge commands/events)
- [x] 2.4 Implement snapshot rules when `from` is omitted: read `opacity` from native state, extract `transform.translate/rotate/scale` from the native current transform, snapshot only fields present in `to`, and ensure `delay` does not change snapshot timing; cover queued, delay, and stop-point results.
  - **Depends on** 2.1 (needs `animateSpatialDiv`)
- [x] 2.5 Define unmount behavior for `finished` / `canceled` Promises: MUST NOT resolve and MUST NOT trigger lifecycle callbacks after unmount.
  - **Depends on** 2.3 (needs session management)

## 3. React SpatialDiv Integration

- [x] 3.1 Implement the SpatialDiv branch of `useAnimation(config)` in React, including binding and `AnimationApi` behavior, plus the five-state `isAnimating` / `isPaused` state machine (idle / queued / delaying / running / paused).
  - **Depends on** 1.2 (hook routing) and 2.1 (core command entrypoint)
- [x] 3.2 Wire `animation` prop binding/unbinding and single-element reuse validation in the `PortalInstanceObject` / `Spatialized2DElementContainer` path; implement prop replacement (cancel-old → start-new; old `onCancel` before new `onStart`) and removal behavior.
  - **Depends on** 3.1 (AnimationApi) and 1.3 (prop types and `__kind` validation)
- [x] 3.3 Implement property-level suppression and recovery for `opacity`; keep per-field caches, release suppression flags before end callbacks, and restore regular sync on the next React render after callbacks.
  - **Depends on** 3.2 (binding path)
- [x] 3.4 Implement transform-wide suppression during `transform` animation, caching, and recovery after session end.
  - **Depends on** 3.2 (binding path)
- [x] 3.5 Implement play re-entry (paused: play → resume same session; running/delaying/queued: play → no-op), config updates do not affect alive sessions, and command serialization in call order.
  - **Depends on** 3.1 (state machine) and 2.3 (command serialization)
- [x] 3.6 Add warnings for non-`enable-xr` usage and unsupported runtimes (at most once per hook instance), and keep `play()` as a no-op; when unsupported, `isAnimating` stays `false`.
  - **Depends on** 1.4 (capability key)

## 4. Native Playback

- [x] 4.1 Add SpatialDiv animation session storage, a playback controller, and lifecycle management in the visionOS runtime.
  - **Depends on** 2.2 (bridge command shape)
- [x] 4.2 Implement native interpolation and application for whitelisted fields: `transform.translate.x/y/z`, `transform.rotate.x/y/z`, `transform.scale.x/y/z`, and `opacity`; recompose transform in the fixed translate → rotate → scale order.
  - **Depends on** 4.1 (session management)
- [x] 4.3 Implement native semantics for `delay`, reset loop (instant reset without re-snapshot), reverse loop, pause (including pausing during delay and preserving remaining delay), play (resume from pause), cancel (restore to `from` or start snapshot), and emit `_completed` / `_canceled` terminal events.
  - **Depends on** 4.2 (interpolation)
- [x] 4.4 Implement `_failed` events and error payloads for bridge/native async failures; ensure no `_completed` / `_canceled` after play failure, and keep sessions in pre-failure state after pause/resume/cancel failures.
  - **Depends on** 4.3 (playback semantics)

## 5. Validation And Documentation

- [x] 5.1 Add capability tests covering `supports('useAnimation', ['element'])` true/false/stability, and independence from `supports('useAnimation', ['entity'])`.
  - **Depends on** 1.4
- [x] 5.2 Add hook routing tests covering entity keys vs SpatialDiv keys, mixed-key validation errors, and `__kind` binding validation.
  - **Depends on** 1.2 and 1.3
- [x] 5.3 Add React behavior tests covering autoStart, manual play, queued play (including pause/cancel while queued), delay pause/play, delay pause then cancel, delay cancel, play re-entry (paused: resume; running/delaying/queued: no-op), config updates not affecting alive sessions, command serialization, single-binding errors, animation prop replacement/removal, and warnings.
  - **Depends on** 3.1–3.6
- [x] 5.4 Add sync competition tests covering `opacity` property-level suppression (including cache and recovery), transform-wide suppression, suppression release timing (flags cleared before callbacks), and regular CSS transform updates being delayed until the session ends.
  - **Depends on** 3.3 and 3.4
- [x] 5.5 Add bridge/native session tests covering completed/canceled/failed (including play failure and pause/cancel failure), terminal mutual exclusion, loop semantics, cancel restoration semantics, listener registration ordering, `animationId` uniqueness, and unmount behavior where Promises do not resolve.
  - **Depends on** 2.3, 2.5, 4.3, and 4.4
- [x] 5.6 Add state machine tests covering `isAnimating` / `isPaused` values across idle / queued / delaying / running / paused, and that they become false before callbacks after stop/completion.
  - **Depends on** 3.1
- [x] 5.7 Update `docs/` and `apps/test-server` examples demonstrating the `SpatialDiv` animation API (entrance fade/translate/scale, manual rotation, looping float), visual whitelist fields, capability checks, and known limitations.
  - **Depends on** 5.3 (core behavior verification)