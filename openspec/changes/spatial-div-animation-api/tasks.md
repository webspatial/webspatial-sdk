## Phase 0: POC Verification (opacity single-property, architecture feasibility)

**Goal**: Run the complete vertical chain with a single `opacity` property to verify `CADisplayLink` frame-driven architecture feasibility and suppression mechanism. This phase does not pursue feature completeness — only architecture path validation.

**Priority rationale**: Both independent feasibility assessments (`feasibility-visionOS.md` and `feasibility-visionOS-analysis.md`) confirm suppression is the first blocking point, while CADisplayLink interpolation itself has low technical uncertainty. Therefore the POC validates both simultaneously.

### 0.1 Suppression Infrastructure

- [ ] 0.1.1 Introduce field-level suppression flag in `PortalInstanceObject` for `opacity` (`_suppressedFields: Set<string>`); during alive session, `updateSpatializedElementProperties()` skips suppressed fields
- [ ] 0.1.2 Verify: during suppression, React-side CSS opacity change → native does not respond; after suppression release → normal sync resumes

### 0.2 Native Animation Engine Skeleton

- [ ] 0.2.1 Create `SpatialDivAnimationSession.swift`: holds `CADisplayLink`, implements `play()` / `pause()` / `resume()` / `cancel()` / `invalidate()` state machine
- [ ] 0.2.2 Create `SpatialDivAnimationManager.swift`: manages sessions keyed by `animationId`, at most one active session per element
- [ ] 0.2.3 Implement cubic approximation interpolation for 4 `timingFunction` variants
- [ ] 0.2.4 Implement `opacity` frame-driven interpolation: per-frame `lerp(from.opacity, to.opacity, easedProgress)` → write to `SpatializedElement.opacity`

### 0.3 Bridge Command Minimal Set

- [ ] 0.3.1 Add `AnimateSpatialized2DElement` command struct (play/pause/resume/cancel type + opacity from/to + duration + timingFunction only)
- [ ] 0.3.2 Register the command in `SpatialScene.setupJSBListeners()`, dispatch to `SpatialDivAnimationManager`
- [ ] 0.3.3 Implement `{animationId}_completed` / `{animationId}_canceled` event callbacks

### 0.4 End-to-End Chain Verification

- [ ] 0.4.1 JS-side manually constructs play command → native opacity animation visible
- [ ] 0.4.2 Animation completes → `_completed` event returns to JS, finalValues.opacity correct
- [ ] 0.4.3 `cancel()` → opacity instantly restores to from, `_canceled` event returns
- [ ] 0.4.4 `pause()` → opacity freezes at intermediate value; `resume()` → continues from pause point
- [ ] 0.4.5 During animation, JS-side modifies opacity → native does not respond (suppression active)
- [ ] 0.4.6 After animation ends → normal opacity sync resumes

### 0.5 Performance Verification

- [ ] 0.5.1 Opacity 0→1 animation smooth with no frame drops at 90Hz (visionOS frame rate)
- [ ] 0.5.2 3 simultaneous SpatialDiv opacity animations do not interfere with each other
- [ ] 0.5.3 `@Observable` per-frame property writes do not trigger excessive SwiftUI redraws (verify via Instruments)

### Go/No-Go Criteria

| Condition | Pass → | Fail → |
|---|---|---|
| 0.4.1–0.4.6 all pass | Proceed to Phase 1 | Analyze failure cause, adjust architecture |
| Systematic stuttering at 90Hz | — | Evaluate dropping to 60fps or switching to `TimelineView` approach |
| `@Observable` per-frame writes cause large-scale SwiftUI redraws | — | Evaluate batch write optimization or `objectWillChange` throttling |
| Flash-back unavoidable after suppression release | — | Evaluate delayed release strategy or forced state sync |

---


## 1. Public API And Capability Contract

- [ ] 1.1 Define `SpatialDiv` `useAnimation` config types (`SpatialDivAnimationConfig`, `SpatialDivAnimatedValues`), return types (`SpatialDivAnimatedProps`, `AnimationApi`), and `AnimationError`, covering `back`, `transform.translate.x/y/z`, `opacity`, `depth`, `width`, `height`. Specify default `duration = 0.3`, `playbackRate = 1`, and validate `opacity` in inclusive `[0, 1]`.
- [ ] 1.2 Implement "dual-path unconditional call + active short-circuit" dispatch in `useAnimation`: top-level `resolveAnimationKind(config)` determines kind; `useEntityAnimation(config, active)` and `useSpatialDivAnimation(config, active)` called unconditionally in parallel (satisfying Rules of Hooks); inactive side effects short-circuit returning noop API
  - **Depends on** 1.1 (needs SpatialDiv config type definitions)
- [ ] 1.3 Add public typing for the `animation` prop on spatialized HTML nodes and restrict it to the `enable-xr` path; add `__kind` binding validation (throw when binding entity animation to SpatialDiv or vice versa).
  - **Depends on** 1.2 (needs the `__kind` tagging mechanism)
- [ ] 1.4 Extend runtime capability data and docs with the public contract for `supports('useSpatialDivAnimation')`.
- [ ] 1.5 Implement SpatialDiv animation config validation: whitelist restrictions, numeric ranges (including `opacity` inclusive `[0, 1]`, `width/height >= 0`), `timingFunction`, `loop` shape, and entity/SpatialDiv key mutual exclusion.
  - **Depends on** 1.1 (needs type definitions)

## 2. Core SDK And Bridge Session Flow

- [ ] 2.1 Add `animateSpatialDiv(command)` to `Spatialized2DElement` in `@webspatial/core-sdk`: `play` returns `AnimateSpatialDivResult`, others return `void`.
  - **Depends on** 1.1 (needs command/result types)
- [ ] 2.2 Design and wire the JSBridge command `AnimateSpatialized2DElement`, plus `_completed` (payload `SpatialDivAnimatedValues`), `_canceled` (payload `SpatialDivAnimatedValues`), and `_failed` (payload `AnimationError`) naming and payloads; ensure listeners are registered before sending `play`.
  - **Depends on** 2.1 (needs command entrypoint)
- [ ] 2.3 Implement command serialization for `play`/`pause`/`resume`/`cancel` (send in call order), global uniqueness for session ids, and async failure reporting via `_failed`; enforce terminal event mutual exclusion (`_completed` vs `_canceled` for the same `animationId`).
  - **Depends on** 2.2 (needs bridge commands/events)
- [ ] 2.4 Implement snapshot rules when `from` is omitted: read all fields from native `Spatialized2DElement` current state (not DOM), snapshot only fields present in `to`, and ensure `delay` does not change snapshot timing; cover queued, delay, and stop-point results.
  - **Depends on** 2.1 (needs `animateSpatialDiv`)
- [ ] 2.5 Define unmount behavior for `finished` / `canceled` Promises: MUST NOT resolve and MUST NOT trigger lifecycle callbacks after unmount.
  - **Depends on** 2.3 (needs session management)

## 3. React SpatialDiv Integration

- [ ] 3.1 Implement the SpatialDiv branch of `useAnimation(config)` in React, including binding and `AnimationApi` behavior, plus the five-state `isAnimating` / `isPaused` state machine (idle / queued / delaying / running / paused).
  - **Depends on** 1.2 (hook routing) and 2.1 (core command entrypoint)
- [ ] 3.2 Wire `animation` prop binding/unbinding and single-element reuse validation in the `PortalInstanceObject` / `Spatialized2DElementContainer` path; implement prop replacement (cancel-old → start-new; old `onCancel` before new `onStart`) and removal behavior.
  - **Depends on** 3.1 (AnimationApi) and 1.3 (prop types and `__kind` validation)
- [ ] 3.3 Implement property-level suppression and recovery for `back`, `opacity`, `depth`, `width`, `height`; keep per-field caches, release suppression flags before end callbacks, and restore regular sync on the next React render after callbacks.
  - **Depends on** 3.2 (binding path)
- [ ] 3.4 Implement transform-wide suppression during `transform` animation, caching, and recovery after session end.
  - **Depends on** 3.2 (binding path)
- [ ] 3.5 Implement play re-entry (alive session: play → cancel old → start new), cancel-old failure blocks start-new, config updates do not affect alive sessions, and command serialization in call order.
  - **Depends on** 3.1 (state machine) and 2.3 (command serialization)
- [ ] 3.6 Add warnings for non-`enable-xr` usage and unsupported runtimes (at most once per hook instance), and keep `play()` as a no-op; when unsupported, `isAnimating` stays `false`.
  - **Depends on** 1.4 (capability key)

## 4. Native Playback

- [ ] 4.1 Add SpatialDiv animation session storage, a playback controller, and lifecycle management in the visionOS runtime.
  - **Depends on** 2.2 (bridge command shape)
- [ ] 4.2 Implement native interpolation and application for whitelisted fields: `transform.translate.x/y/z`, `back`, `depth`, `opacity`, `width`, `height`.
  - **Depends on** 4.1 (session management)
- [ ] 4.3 Implement native semantics for `delay`, reset loop (instant reset without re-snapshot), reverse loop, pause (including pausing during delay and preserving remaining delay), play (resume from pause), cancel (restore to `from` or start snapshot), and emit `_completed` / `_canceled` terminal events.
  - **Depends on** 4.2 (interpolation)
- [ ] 4.4 Implement `_failed` events and error payloads for bridge/native async failures; ensure no `_completed` / `_canceled` after play failure, and keep sessions in pre-failure state after pause/resume/cancel failures.
  - **Depends on** 4.3 (playback semantics)

## 5. Validation And Documentation

- [ ] 5.1 Add capability tests covering `supports('useSpatialDivAnimation')` true/false/stability, and independence from `supports('useAnimation')`.
  - **Depends on** 1.4
- [ ] 5.2 Add hook routing tests covering entity keys vs SpatialDiv keys, mixed-key validation errors, and `__kind` binding validation.
  - **Depends on** 1.2 and 1.3
- [ ] 5.3 Add React behavior tests covering autoStart, manual play, queued play (including pause/cancel while queued), delay pause/play, delay pause then cancel, delay cancel, play re-entry ordering (cancel old → start new), config updates not affecting alive sessions, command serialization, cancel-old failure blocks start-new, single-binding errors, animation prop replacement/removal, and warnings.
  - **Depends on** 3.1–3.6
- [ ] 5.4 Add sync competition tests covering property-level suppression (including cache and recovery), transform-wide suppression, suppression release timing (flags cleared before callbacks), and `width` / `height` not being written back to DOM.
  - **Depends on** 3.3 and 3.4
- [ ] 5.5 Add bridge/native session tests covering completed/canceled/failed (including play failure and pause/cancel failure), terminal mutual exclusion, loop semantics, cancel restoration semantics, listener registration ordering, `animationId` uniqueness, and unmount behavior where Promises do not resolve.
  - **Depends on** 2.3, 2.5, 4.3, and 4.4
- [ ] 5.6 Add state machine tests covering `isAnimating` / `isPaused` values across idle / queued / delaying / running / paused, and that they become false before callbacks after stop/completion.
  - **Depends on** 3.1
- [ ] 5.7 Update `docs/` and `apps/test-server` examples demonstrating the `SpatialDiv` animation API (entrance animation, manual trigger + cancel size sync, looping float), whitelisted fields, capability checks, and known limitations.
  - **Depends on** 5.3 (core behavior verification)