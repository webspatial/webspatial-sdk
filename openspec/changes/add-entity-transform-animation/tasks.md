## 1. API and capability contract

- [ ] 1.1 Add the `entity-transform-animation` and `runtime-capabilities` spec artifacts to the implementation plan and align naming with `supports('useAnimation')`
- [ ] 1.2 Define the public React and core SDK types for `useAnimation`, `AnimationApi`, entity `animation` prop, and animation result payloads

## 2. Core SDK and command flow

- [ ] 2.1 Implement the unified animation command shape and core `SpatialEntity.animateTransform(...)` session API
- [ ] 2.2 Wire completion and stop event handling so JS receives native terminal transform values for callbacks and state sync
- [ ] 2.3 Extend runtime capability keys and data so `supports('useAnimation')` resolves correctly per runtime

## 3. React SDK integration

- [ ] 3.1 Implement `useAnimation(config)` with `play`, `pause`, `resume`, `stop`, `isAnimating`, `autoStart`, `delay`, and `loop` behavior
- [ ] 3.2 Add the entity `animation` prop and suppress competing ordinary transform updates only for fields controlled by the active animation
- [ ] 3.3 Guard unsupported runtimes with the documented capability behavior and keep non-animated transform paths unchanged

## 4. Native visionOS playback

- [ ] 4.1 Add native scene-side animation session storage, command handling, and playback controller lifecycle management
- [ ] 4.2 Implement native play, pause, resume, and stop behavior plus completion / stop event emission with current transform payloads
- [ ] 4.3 Verify delay and loop semantics match the OpenSpec contract for reset looping and reverse looping

## 5. Validation and documentation

- [ ] 5.1 Add focused tests for capability checks, React playback lifecycle, transform suppression, and command / event ordering
- [ ] 5.2 Update the relevant docs in `docs/` and any representative examples or test-server pages for the new animation API
- [ ] 5.3 Add an English changeset covering the new public API and capability surface after the code change is complete