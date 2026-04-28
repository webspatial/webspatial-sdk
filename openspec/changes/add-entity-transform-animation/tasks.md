## 1. API and capability contract

- [ ] 1.1 Add the `entity-transform-animation` and `runtime-capabilities` spec artifacts to the implementation plan and align naming with `supports('useAnimation')`
- [ ] 1.2 Define the public React and core SDK types for `useAnimation`, `AnimationApi`, entity `animation` prop, and animation result payloads
- [ ] 1.3 Add validation rules for invalid animation config and define warning behavior for unsupported runtimes

## 2. Core SDK and command flow

- [ ] 2.1 Implement the unified animation command shape and core `SpatialEntity.animateTransform(...)` session API *(blocked by 1.2)*
- [ ] 2.2 Wire completion and stop event handling so JS receives native terminal transform values for callbacks and state sync *(blocked by 2.1)*
- [ ] 2.3 Extend runtime capability keys and data so `supports('useAnimation')` resolves correctly per runtime

## 3. React SDK integration

- [ ] 3.1 Implement `useAnimation(config)` with `play`, `pause`, `resume`, `stop`, `isAnimating`, `autoStart`, `delay`, and `loop` behavior *(blocked by 2.1)*
- [ ] 3.2 Wire the entity `animation` prop through the shared entity abstraction layer before updating leaf entity components *(blocked by 3.1)*
- [ ] 3.3 Suppress competing ordinary transform updates only for fields controlled by the active animation
- [ ] 3.4 Guard unsupported runtimes with the documented warning behavior and keep non-animated transform paths unchanged

## 4. Native visionOS playback

- [ ] 4.1 Add native scene-side animation session storage, command handling, and playback controller lifecycle management *(blocked by 2.1)*
- [ ] 4.2 Implement native play, pause, resume, and stop behavior plus completion / stop event emission with current transform payloads *(blocked by 2.2, 4.1)*
- [ ] 4.3 Verify delay and loop semantics match the OpenSpec contract for reset looping and reverse looping

## 5. Validation and documentation

- [ ] 5.1 Add focused tests for capability checks, React playback lifecycle, transform suppression, and command / event ordering
- [ ] 5.2 Update the relevant docs in `docs/` and any representative examples or test-server pages for the new animation API
- [ ] 5.3 Include a changeset entry in each PR that adds or modifies public API surface, rather than deferring a single changeset to the end