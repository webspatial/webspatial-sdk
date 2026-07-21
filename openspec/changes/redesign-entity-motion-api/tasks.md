## 1. Proposal Alignment

- [ ] 1.1 Review the legacy `add-entity-transform-animation` artifacts and mark the exact behaviors that are superseded by this new target state
- [ ] 1.2 Review `spatialized-element-motion-api` references to Entity motion and align wording so the new Entity proposal is the authoritative target state
- [ ] 1.3 Remove `supports('useEntityAnimation', ['entity'])` from this proposal's documented contract and reserved sub-tokens; coordinate any `spatialized-element-motion-api` wording separately instead of changing it in this proposal pass

## 2. Type and Contract Redesign

- [ ] 2.1 Add failing tests for the new `useEntityAnimation` tuple `[animation, api, entityProps]`, the public playback surface (`play`, `pause`, `stop`, `reset`, `finish`), and `api.set` accepting only an `EntityMotionPatch` object
- [ ] 2.2 Add failing tests for `position` / `rotation` / `scale` authoring; top-level `from` / `to`; `timeline.from` / `timeline.to`; percentage keyframes; required start/end boundaries; sparse fields inside boundary frames; legacy-config rejection; and unsupported targets such as `opacity`
- [ ] 2.3 Redesign Core and React type surfaces to implement the Entity motion config above, transform-only callback values, playback API, and write-side `EntityMotionPatch`

## 3. Entity Binding Migration

- [ ] 3.1 Add failing tests proving Entity motion binds through the `animation` prop
- [ ] 3.1a Add failing tests proving that, once binding completes, the React Binding calls `SpatialEntity.createAnimation(config)` without directly calling `AnimationObject.create(...)` or constructing the internal canonical timeline payload
- [ ] 3.2 Update Entity prop contracts and binding lifecycle to use the new Entity motion binding path
- [ ] 3.2a Implement `SpatialEntity.createAnimation(config)` in Core so it encapsulates its own spatial-object id plus Entity-specific normalization and validation, then delegates the canonical timeline to the shared `AnimationObject` creation flow
- [ ] 3.3 Preserve the single-binding invariant so one animation object cannot drive multiple Entity instances
- [ ] 3.4 Document `animation` as the Entity motion binding
- [ ] 3.5 Delete the legacy entity-transform-animation leftovers on the JS side, including the suppression mechanism `animation.__getSuppressedFields` and the suppression-release base-props re-sync path, so there is no second transform source competing with native

## 4. Playback, Outlet, and Core Normalization

- [ ] 4.1 Add failing tests for `entityProps` updates after start, complete, stop, reset, finish, and native-accepted `api.set(values)`; no per-frame React updates; callback values containing only Entity transform fields; and callback return values not driving terminal state
- [ ] 4.2 Implement React/Core state-event consumption, callback dispatch, and committed-transform persistence through `entityProps`, preserving the one-way flow of native confirmed state
- [ ] 4.3 Add failing tests for the public playback API and whole-transform ownership: `api.set` only accepts sparse patch objects; set before binding or native animation-object creation is a no-op; React transform writes / set during active playback are not stashed, do not override the animation, and do not update `entityProps`; terminal fill does not snap back
- [ ] 4.4 Implement the React/Core playback API, JSB command initiation, and outlet-ownership routing; Section 5 implements native set merging, the state machine, and terminal commits
- [ ] 4.5 Add failing tests for `normalizeEntityMotionConfig`: equivalent folding of top-level `from` / `to`, `timeline.from` / `timeline.to`, and percentage keyframes; `timeline` precedence warning; default 0.3s duration; required start/end boundaries; duplicate-frame rejection; property allowlist; and field-level sparseness preservation
- [ ] 4.6 Implement normalization and validation in Core while preserving compatibility with the existing `EntityMotionTimelinePayload` and create-command wire shape; Section 5 implements native compilation and execution of that payload

## 5. Native and Bridge Implementation

- [ ] 5.1 Add failing Bridge contract tests for create/control payloads, `set` values, `EntityMotionStateChangedMsg` detail/action/playState/values/error, the closed error-code set defined by Design, and encode/decode parity across Core and both native platforms
- [ ] 5.2 Implement Core/native Bridge types, `EntityMotionBridgeTypes` codecs, and handler registration, reusing `CreateSpatializedElementAnimationJSBCommand`, `ControlSpatializedElementAnimationJSBCommand`, and `spatialanimationstatechanged`
- [ ] 5.3 Add failing target-dispatch and lifecycle tests for `elementId` lookup; element/entity/unsupported dispatch; `TARGET_NOT_FOUND`; `UNSUPPORTED_TARGET`; animation registration/lookup/explicit destroy; target-first Entity destruction; cleanup; post-destroy no-ops; and teardown races returning `ANIMATION_NOT_FOUND`
- [ ] 5.4 On both native platforms, implement `SpatialScene` Entity dispatch and lifecycle cascade through global spatial objects; keep `EntityMotionManager` create-only, and make `EntityMotionAnimationObject` own state, resources, and cleanup
- [ ] 5.5 Add failing timeline-compiler unit tests for property/time/scale validation, union of keyframe times, sparse-channel completion from the run baseline, channel interpolation, full poses at every slice point, per-segment easing precedence, rotation-input conversion, taken-over component calculation, and explicit failure for unrepresentable segments
- [ ] 5.6 Implement `EntityMotionTimelineCompiler`, `EntityMotionTiming`, and `EntityMotionTransformValues` on both native platforms, producing time-ordered full-pose segments plus confirmed-transform decomposition and sparse-patch merging
- [ ] 5.7 Add failing visionOS integration tests for RealityKit whole-`.transform` binding, multi-segment full-pose resources, `AnimationResource.sequence`, rotation conversion, all four easing modes, delay, playback rate, loop, and compilation failure
- [ ] 5.8 Implement visionOS RealityKit full-pose segment sequence compilation, playback-controller integration, and platform-option mapping
- [ ] 5.9 Add failing picoOS integration tests using the same canonical-timeline fixtures as visionOS for whole-transform binding, multi-segment full-pose sequence, rotation conversion, all four easing modes, delay, playback rate, loop, and compilation failure
- [ ] 5.10 Implement picoOS full-pose segment sequence compilation, playback-controller integration, and platform-option mapping
- [ ] 5.11 Add failing fresh-play state tests for first `play` / `autoStart`; replay after complete/finish/stop/reset reading the latest baseline and recompiling; play after pause resuming the current controller; loop within one run reusing the current resource; and compilation failure remaining inactive
- [ ] 5.12 Implement fresh play, delay/running/paused transitions, resume, loop-resource reuse, and command-failure receipts in `EntityMotionManager` and `EntityMotionAnimationObject`
- [ ] 5.13 Add failing control-and-event tests for play/start/complete/pause/stop/reset/finish/destroy/set/error actions; stop committing the current pose; reset committing the start pose; finish/complete committing the end pose; inactive set sparse merge; active set no-op + warning; confirmed-value trimming; and `entityProps`/callback mapping
- [ ] 5.14 Implement the complete control state machine, zero-duration terminal commits, confirmed-transform read/decomposition, and state-event encoding/emission, ensuring active set does not trigger `onError` and failed commands do not change the transform

## 6. Capability and Validation

- [ ] 6.1 Add failing tests for the documented Entity motion capability check using `supports('useEntityAnimation')`
- [ ] 6.2 Add failing tests for explicit validation failures on unsupported Entity motion targets and invalid transform authoring
- [ ] 6.3 Update runtime capability and validation implementation behavior to match the new target-state contract

## 7. Docs, Demos, and Migration

- [ ] 7.1 Update Entity motion docs and examples to use `position` / `rotation` / `scale` config, `animation`, `entityProps`, and patch-object-only `api.set`, with no-bare-`api.get` guidance: read through `entityProps`, write through `api.set(values)`; add the top-level `from` / `to` shorthand and its rules (equivalent to `timeline.from` / `timeline.to`, `timeline` precedence, default 0.3s for pure top-level); and document that every animation must write both ends (start `from`/`0%`, end `to`/`100%`, erroring on a missing end, with no implicit start-from-current-pose)
- [ ] 7.2 Update `apps/test-server` Entity animation demos and capability pages to the new target-state API
- [ ] 7.3 Add migration notes covering removal of the legacy top-level transform config and standardizing Entity motion binding on `animation`

## 8. Verification and Cross-platform Acceptance

- [ ] 8.1 Execute implementation in strict TDD order: for each behavior group, write failing tests first, implement the minimum change to pass, then refactor with tests still green
- [ ] 8.2 Run targeted React/Core tests for the tuple, binding, normalization, capability detection, callbacks, `entityProps`, ownership, and `api.set` command initiation
- [ ] 8.3 Run Bridge contract and integration tests to confirm Core, visionOS, and picoOS encode/decode parity for create/control payloads, state events, and error codes
- [ ] 8.4 On visionOS, accept percentage multi-keyframes, sparse fields, full-pose sequence, fresh play, delay, loop, pause/resume, stop/reset/finish/set, terminal commit, and teardown
- [ ] 8.5 Run the same fixtures and acceptance matrix from 8.4 on picoOS
- [ ] 8.6 Compare action ordering, confirmed values, terminal transforms, error results, and replay behavior across both platforms, recording and resolving differences
- [ ] 8.7 Run end-to-end regressions for terminal transforms, active set, and the target-destruction lifecycle and error behavior defined by the Entity motion spec
- [ ] 8.8 On visionOS and picoOS, measure fresh-play compilation time, playback frame stability, memory use, and teardown recovery at increasing Entity concurrency, recording representative-scale results and the release acceptance conclusion
- [ ] 8.9 Build a Design-to-Tasks traceability table confirming every native class, JSB protocol, compilation rule, control sequence, error path, and performance trade-off has an implementation and verification task
- [ ] 8.10 After proposal-to-implementation review is complete, archive or formally supersede `add-entity-transform-animation`
