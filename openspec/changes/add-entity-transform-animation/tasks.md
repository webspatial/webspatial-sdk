## 1. API and capability contract

- [ ] 1.1 Add the `entity-transform-animation` and `runtime-capabilities` spec artifacts to the implementation plan and align naming with `supports('useAnimation')`
- [ ] 1.2 Define the public React and core SDK types for `useAnimation`, `AnimationApi`, entity `animation` prop, `AnimationError`, and animation result payloads
- [ ] 1.3 Add validation rules for invalid animation config and define warning behavior for unsupported runtimes

## 2. Core SDK and command flow

- [ ] 2.1 Implement the unified animation command shape and core `SpatialEntity.animateTransform(...)` session API *(blocked by 1.2)*
- [ ] 2.2 Wire completion / stop / failure event handling so JS receives native terminal transform values or error payloads for callbacks and state sync *(blocked by 2.1)*
- [ ] 2.3 Extend runtime capability keys and data so `supports('useAnimation')` resolves correctly per runtime

## 3. React SDK integration

- [ ] 3.1 Implement `useAnimation(config)` with `play`, `pause`, `resume`, `stop`, `isAnimating`, `isPaused`, `onStart`, `onError`, `autoStart`, `delay`, and `loop` behavior *(blocked by 2.1)*
- [ ] 3.2 Wire the entity `animation` prop through the shared entity abstraction layer before updating leaf entity components *(blocked by 3.1)*
- [ ] 3.3 Suppress competing ordinary transform updates only for fields controlled by an alive session
- [ ] 3.4 Guard unsupported runtimes with the documented warning behavior and keep non-animated transform paths unchanged
- [ ] 3.5 Restrict the `animation` prop to entity components under `Reality` / `SceneGraph` through TypeScript type definitions, without expanding runtime checks across non-entity components

## 4. Native visionOS playback

- [ ] 4.1 Add native scene-side animation session storage, command handling, and playback controller lifecycle management *(blocked by 2.1)*
- [ ] 4.2 Implement native play, pause, resume, and stop behavior plus completion / stop / failure event emission with transform or error payloads *(blocked by 2.2, 4.1)*
- [ ] 4.3 Verify delay and loop semantics match the OpenSpec contract for reset looping and reverse looping

## 5. Validation and documentation

- [ ] 5.1 Add focused tests for:
  - [ ] 5.1.1 Capability checks (`supports('useAnimation')` true/false/sub-token)
  - [ ] 5.1.2 React playback lifecycle (onStart timing, including queued-to-paused start, start/complete/stop callbacks, exclusivity, invocation count)
  - [ ] 5.1.3 Transform suppression (animated vs non-animated fields coexist, cache retention until next render)
  - [ ] 5.1.4 Command / event ordering (serialize in call order, bridge delivery order)
  - [ ] 5.1.5 Same animation bound to multiple entities (throw)
  - [ ] 5.1.6 Animation prop replacement (stop old session → start new, onStop before onStart)
  - [ ] 5.1.7 Pause during delay (remaining time preserved, resume continues)
  - [ ] 5.1.8 Play before entity bound (queued state, isAnimating, stop/pause while queued, bind-into-paused)
  - [ ] 5.1.9 Bridge failure recovery (session retains pre-failure state, onError invoked or console.error fallback, no completed/stopped after failed play)
  - [ ] 5.1.10 stop-old failure blocks start-new (both restart and animation-prop replacement paths)
- [ ] 5.2 Update the relevant docs in `docs/` and any representative examples or test-server pages for the new animation API
- [ ] 5.3 Include a changeset entry in each PR that adds or modifies public API surface, rather than deferring a single changeset to the end