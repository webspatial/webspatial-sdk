## 1. Public API And Capability Contract

- [ ] 1.1 Define `SpatialDiv` `useAnimation` config types (`SpatialDivAnimationConfig`, `SpatialDivAnimatedValues`), return types (`SpatialDivAnimatedProps`, `AnimationApi`), and `AnimationError`, covering `back`, `transform.translate.x/y/z`, `opacity`, `depth`, `width`, `height`. Specify default `duration = 0.3` and validate `opacity` in inclusive `[0, 1]`.
- [ ] 1.2 Implement entity vs SpatialDiv auto-routing at the `useAnimation` entrypoint based on the `config.to` key set, keeping the entity path unchanged (only add a top-level if/else and internal `__kind` tag).
  - **Depends on** 1.1 (needs SpatialDiv config type definitions)
- [ ] 1.3 Add public typing for the `animation` prop on spatialized HTML nodes and restrict it to the `enable-xr` path; add `__kind` binding validation (throw when binding entity animation to SpatialDiv or vice versa).
  - **Depends on** 1.2 (needs the `__kind` tagging mechanism)
- [ ] 1.4 Extend runtime capability data and docs with the public contract for `supports('spatialDivAnimation')`.
- [ ] 1.5 Implement SpatialDiv animation config validation: whitelist restrictions, numeric ranges (including `opacity` inclusive `[0, 1]`, `width/height >= 0`), `timingFunction`, `loop` shape, and entity/SpatialDiv key mutual exclusion.
  - **Depends on** 1.1 (needs type definitions)

## 2. Core SDK And Bridge Session Flow

- [ ] 2.1 Add `animateSpatialDiv(command)` to `Spatialized2DElement` in `@webspatial/core-sdk`: `play` returns `AnimateSpatialDivResult`, others return `void`.
  - **Depends on** 1.1 (needs command/result types)
- [ ] 2.2 Design and wire the JSBridge command `AnimateSpatialized2DElement`, plus `_completed` (payload `SpatialDivAnimatedValues`), `_stopped` (payload `SpatialDivAnimatedValues`), and `_failed` (payload `AnimationError`) naming and payloads; ensure listeners are registered before sending `play`.
  - **Depends on** 2.1 (needs command entrypoint)
- [ ] 2.3 Implement command serialization for `play`/`pause`/`resume`/`stop` (send in call order), global uniqueness for session ids, and async failure reporting via `_failed`; enforce terminal event mutual exclusion (`_completed` vs `_stopped` for the same `animationId`).
  - **Depends on** 2.2 (needs bridge commands/events)
- [ ] 2.4 Implement snapshot rules when `from` is omitted: read all fields from native `Spatialized2DElement` current state (not DOM), snapshot only fields present in `to`, and ensure `delay` does not change snapshot timing; cover queued, delay, and stop-point results.
  - **Depends on** 2.1 (needs `animateSpatialDiv`)
- [ ] 2.5 Define unmount behavior for `finished` / `stopped` Promises: MUST NOT resolve and MUST NOT trigger lifecycle callbacks after unmount.
  - **Depends on** 2.3 (needs session management)

## 3. React SpatialDiv Integration

- [ ] 3.1 Implement the SpatialDiv branch of `useAnimation(config)` in React, including binding and `AnimationApi` behavior, plus the five-state `isAnimating` / `isPaused` state machine (idle / queued / delaying / running / paused).
  - **Depends on** 1.2 (hook routing) and 2.1 (core command entrypoint)
- [ ] 3.2 Wire `animation` prop binding/unbinding and single-element reuse validation in the `PortalInstanceObject` / `Spatialized2DElementContainer` path; implement prop replacement (stop-old → start-new; old `onStop` before new `onStart`) and removal behavior.
  - **Depends on** 3.1 (AnimationApi) and 1.3 (prop types and `__kind` validation)
- [ ] 3.3 Implement property-level suppression and recovery for `back`, `opacity`, `depth`, `width`, `height`; keep per-field caches, release suppression flags before end callbacks, and restore regular sync on the next React render after callbacks.
  - **Depends on** 3.2 (binding path)
- [ ] 3.4 Implement transform-wide suppression during `transform` animation, caching, and recovery after session end.
  - **Depends on** 3.2 (binding path)
- [ ] 3.5 Implement play re-entry (alive session: play → stop old → start new), stop-old failure blocks start-new, config updates do not affect alive sessions, and command serialization in call order.
  - **Depends on** 3.1 (state machine) and 2.3 (command serialization)
- [ ] 3.6 Add warnings for non-`enable-xr` usage and unsupported runtimes (at most once per hook instance), and keep `play()` as a no-op; when unsupported, `isAnimating` stays `false`.
  - **Depends on** 1.4 (capability key)

## 4. Native Playback

- [ ] 4.1 Add SpatialDiv animation session storage, a playback controller, and lifecycle management in the visionOS runtime.
  - **Depends on** 2.2 (bridge command shape)
- [ ] 4.2 Implement native interpolation and application for whitelisted fields: `transform.translate.x/y/z`, `back`, `depth`, `opacity`, `width`, `height`.
  - **Depends on** 4.1 (session management)
- [ ] 4.3 Implement native semantics for `delay`, reset loop (instant reset without re-snapshot), reverse loop, pause (including pausing during delay and preserving remaining delay), resume, and stop, and emit `_completed` / `_stopped` terminal events.
  - **Depends on** 4.2 (interpolation)
- [ ] 4.4 Implement `_failed` events and error payloads for bridge/native async failures; ensure no `_completed` / `_stopped` after play failure, and keep sessions in pre-failure state after pause/resume/stop failures.
  - **Depends on** 4.3 (playback semantics)

## 5. Validation And Documentation

- [ ] 5.1 Add capability tests covering `supports('spatialDivAnimation')` true/false/stability, and independence from `supports('useAnimation')`.
  - **Depends on** 1.4
- [ ] 5.2 Add hook routing tests covering entity keys vs SpatialDiv keys, mixed-key validation errors, and `__kind` binding validation.
  - **Depends on** 1.2 and 1.3
- [ ] 5.3 Add React behavior tests covering autoStart, manual play, queued play (including pause/stop while queued), delay pause/resume, delay pause then stop, delay stop, play re-entry ordering (stop old → start new), config updates not affecting alive sessions, command serialization, stop-old failure blocks start-new, single-binding errors, animation prop replacement/removal, and warnings.
  - **Depends on** 3.1–3.6
- [ ] 5.4 Add sync competition tests covering property-level suppression (including cache and recovery), transform-wide suppression, suppression release timing (flags cleared before callbacks), and `width` / `height` not being written back to DOM.
  - **Depends on** 3.3 and 3.4
- [ ] 5.5 Add bridge/native session tests covering completed/stopped/failed (including play failure and pause/resume/stop failure), terminal mutual exclusion, loop semantics, stop-point semantics, listener registration ordering, `animationId` uniqueness, and unmount behavior where Promises do not resolve.
  - **Depends on** 2.3, 2.5, 4.3, and 4.4
- [ ] 5.6 Add state machine tests covering `isAnimating` / `isPaused` values across idle / queued / delaying / running / paused, and that they become false before callbacks after stop/completion.
  - **Depends on** 3.1
- [ ] 5.7 Update `docs/` and `apps/test-server` examples demonstrating the `SpatialDiv` animation API (entrance animation, manual trigger + stop size sync, looping float), whitelisted fields, capability checks, and known limitations.
  - **Depends on** 5.3 (core behavior verification)