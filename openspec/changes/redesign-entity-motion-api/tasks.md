## 1. Proposal Alignment

- [x] 1.1 Review the legacy `add-entity-transform-animation` artifacts and mark the exact behaviors that are superseded by this new target state
- [x] 1.2 Confirm `spatialized-element-motion-api` keeps Entity motion outside its scope and this change defines the authoritative Entity target state
- [x] 1.3 Remove `supports('useEntityAnimation', ['entity'])` from this proposal's documented contract and reserved sub-tokens; coordinate any `spatialized-element-motion-api` wording separately instead of changing it in this proposal pass
- [x] 1.4 Align the Entity motion OpenSpec contracts for state messages, `callbackAction`, control completion replies, post-commit native readback, and target-destruction synchronization

## 2. Type and Contract Redesign

- [x] 2.1 Add failing tests for the new `useEntityAnimation` tuple `[animation, api, entityProps]`, the public playback surface (`play`, `pause`, `stop`, `reset`, `finish`), and `api.set` accepting only an `EntityTransformUpdate` object
- [x] 2.2 Add failing tests for the complete public config contract; `position` / `rotation` / `scale` authoring; top-level `from` / `to`; `timeline.from` / `timeline.to`; percentage keyframes; public defaults; finite and range validation; required start/end boundaries; empty timeline, frame, and `api.set` update rejection; sparse fields inside boundary frames; legacy-config rejection; and unsupported targets such as `opacity`
- [x] 2.2a Add failing tests covering built-in `Error` throws with stable `onError` counts for Core-detectable public config and method-argument errors; one `onError(SpatializedPlaybackError)` delivery for command-reply errors and one for dedicated `entityanimationerror` events; state events carrying no errors; and warning + no-op behavior for `api.set` state rejection
- [x] 2.3 Redesign Core and React type surfaces to implement the Entity motion config above, transform-only callback values, playback API, write-side `EntityTransformUpdate`, and Core `EntityAnimationObject` debug `onXXX` listeners

## 3. Entity Binding Migration

- [x] 3.1 Add failing tests proving Entity motion binds through the `animation` prop
- [x] 3.1a Add failing tests proving that, once binding completes, the React Binding calls `SpatialEntity.createAnimation(config)` without directly calling `AnimationObject.create(...)` or constructing the internal canonical timeline payload
- [x] 3.2 Update Entity prop contracts and binding lifecycle to use the new Entity motion binding path
- [x] 3.2a Implement `SpatialEntity.createAnimation(config)` in Core so it encapsulates its own spatial-object id plus Entity-specific normalization and validation, creates through `CreateEntityAnimation`, and returns an `EntityAnimationObject` that privately stores config and timeline
- [x] 3.3 Preserve the single-binding invariant so one animation object cannot drive multiple Entity instances
- [x] 3.4 Document `animation` as the Entity motion binding
- [x] 3.5 Delete the legacy entity-transform-animation leftovers on the JS side, including the suppression mechanism `animation.__getSuppressedFields` and the suppression-release base-props re-sync path; reuse the Element animation's native animating mask, enable whole-transform write protection on fresh play, retain it through pause, remove it after stop/reset/finish/natural completion, and clean it up on unbind, binding termination, or animation-object destruction

## 4. Playback, Outlet, and Core Normalization

- [x] 4.1 Add failing tests for complete `position` / `rotation` / `scale` values in `entityProps` after start, complete, stop, reset, finish, and native-accepted `api.set(update)`; set confirmation through `SetEntityAnimationResult.values` without a state event; React updates at lifecycle points or successful set replies; exact `EntityMotionProps` arguments for `onStart` / `onComplete` / `onStop` / `onReset`; exact `SpatializedPlaybackError` argument for `onError`; ignored callback returns; one `onComplete` with the existing `onStart` count preserved for `idle → finish → finished`; and terminal state driven by config or `api.set`
- [x] 4.2 Implement React/Core consumption of state messages, set replies, and the dedicated error event; dispatch debug `onXXX` and user callbacks; and persist the complete committed transform through `entityProps`, preserving the one-way flow of native confirmed state
- [x] 4.3 Add failing tests for the public playback API, per-binding FIFO command chain, and whole-transform write protection: native animation-object creation with no pending playback command remains `idle`; a playback command waiting for creation, including the implicit `autoStart` play, exposes `queued`; playback commands before creation flush sequentially with `autoStart` first; while commands are queued, `isAnimating`, `isPaused`, and `finished` remain `false`; a successful creation reply confirms `idle` before flushing; a queued `pause` or `stop` preserves `idle` without a state event; a failed creation reply settles `idle`, terminates the current binding lifecycle, clears object state, pending commands, and `entityProps`, leaves the remaining React props in control, and dispatches one classified error; pre-creation `set` and every API after binding termination remain warning + no-op; post-creation `set → play`, `stop → play`, and `play → pause` wait for each prior internal JSB reply; active-playback `set` reaches Native in FIFO order and maps `INVALID_CONTROL_STATE` to warning + no-op; ordinary command failure preserves later queue progress; unbind, replacement, and destruction invalidate unsent commands; active-playback writes preserve the animation and latest `entityProps`; fresh play enables protection, pause retains it, stop/reset/finish/natural completion remove it, and inactive ordinary React transform updates reach Native; terminal fill preserves the committed pose through complete `entityProps`
- [x] 4.4 Implement the React/Core playback API and one generation-guarded FIFO command chain per Entity motion binding by reusing the Element animation pending-playback-command and sequential-flush model; use the `CreateEntityAnimation` reply to confirm `idle` before flushing or terminate the current binding lifecycle on creation failure; keep pre-creation `set` and every post-termination command outside the queue as warning + no-op; serialize all commands after creation; then implement JSB command initiation and complete-transform `entityProps` updates so combined React props control inactive playback; Section 5 implements native set merging, the state machine, terminal commits, and transform write protection
- [x] 4.4b Add Core/React red tests for one state-message shape, authoritative `playState` updates, paired `callbackAction` plus complete `values`, state-only pause and resume, shared `onComplete` dispatch for `finish()` and natural completion, successful control replies allowing the next waiting command, and state-message/reply races preserving the latest state
- [x] 4.4c Implement Core/React state-message consumption: `playState` updates public state, optional `callbackAction` dispatches callbacks and confirmed values, and successful control replies confirm current-command completion and allow the next waiting command
- [x] 4.4d Add Core/React target-destruction red tests for animation-id `objectdestroy`, destroyed state, event-receiver removal for that id, later playback as a local no-op, later `set` as a local warning plus no-op, stable JSB-command count, and stable `onError` count
- [x] 4.4e Implement Core consumption of animation-id `objectdestroy`, destroyed-state synchronization, event-receiver removal for that id, and local post-destruction API behavior
- [x] 4.5 Add failing tests for `normalizeEntityMotionConfig`: equivalent folding of top-level `from` / `to`, `timeline.from` / `timeline.to`, and percentage keyframes; `timeline` precedence warning; public defaults; `duration` required for timeline configs and defaulted to 0.3s for pure top-level `from` / `to`; finite and range validation; required start/end boundaries; empty timeline and frame rejection; normalized duplicate-percentage rejection; property allowlist; and field-level sparseness preservation
- [x] 4.6 Implement Core normalization and synchronous programmer-error validation, transport `EntityMotionTimelinePayload` through the Entity-specific create command, and deliver command-reply and asynchronous-event errors through exactly one `onError`; Section 5 implements native compilation and execution of that payload

## 5. Native and Bridge Implementation

Bridge contract verification:
  - [x] 5.1a Core Bridge contract red tests cover Entity-specific create, control, and set commands; empty successful control replies; one state-message shape; `callbackAction`; dedicated error events; and error codes
  - [x] 5.1b visionOS Bridge contract red tests cover Entity-specific commands, empty successful control replies, one state-message shape, `callbackAction`, dedicated error events, error codes, and loop wire shapes
  - [ ] 5.1c picoOS Bridge contract red tests cover the same Entity-specific commands, replies, events, and error-code set as visionOS
  - [ ] 5.1d After picoOS implementation, run Core, visionOS, and picoOS encode/decode parity verification

Bridge implementation:
  - [x] 5.2a Core Entity-specific Bridge types, JSB commands, empty successful control replies, `callbackAction` state-message consumption, and dedicated error events
  - [x] 5.2b visionOS `EntityMotionBridgeTypes` codecs, empty successful control replies, `callbackAction` state messages, and four `SpatialScene` handler registrations
  - [ ] 5.2c picoOS `EntityMotionBridgeTypes` codecs and four handler registrations
- [x] 5.3 Verify visionOS target dispatch and lifecycle behavior: target lookup and rejection, stable error mapping, animation-object registration and lookup, explicit destroy, target-first destruction, cleanup, post-destroy local behavior, and `ANIMATION_NOT_FOUND` teardown results

Native lifecycle implementation:
  - [x] 5.4a visionOS `SpatialScene` Entity handlers, global spatial-objects registration/lookup, target-destroy cascade, and animation-object cleanup are implemented
  - [ ] 5.4b picoOS `SpatialScene` Entity handlers, global spatial-objects lifecycle cascade, and animation-object cleanup
- [x] 5.5 Add visionOS timeline-compiler unit tests for property/time/scale validation, union times, sparse baseline completion, late-channel interpolation, full poses, easing precedence, deterministic Euler conversion, confirmed transforms, and unrepresentable segments

Native compiler implementation:
  - [x] 5.6a visionOS `EntityMotionTimelineCompiler`, `EntityMotionTiming`, and `EntityMotionTransformValues` are implemented with full-pose segments, canonical Euler decomposition, and sparse-update merging
  - [ ] 5.6b picoOS `EntityMotionTimelineCompiler`, `EntityMotionTiming`, and `EntityMotionTransformValues`
- [x] 5.7 Add failing visionOS integration tests for RealityKit whole-`.transform` binding, multi-segment full-pose resources, `AnimationResource.sequence`, rotation conversion, all four easing modes, delay, playback rate, loop, and compilation failure
  - [x] 5.7a visionOS Bridge, timeline compiler, and animation-object state-machine tests have been added and are included in `build-for-testing`
  - [x] 5.7b Complete and run visionOS simulator-backed integration acceptance for RealityKit `.transform`, `AnimationResource.sequence`, platform easing, delay, playback rate, loop, and compilation failures
- [x] 5.8 Implement visionOS RealityKit full-pose segment sequence compilation, playback-controller integration, and platform-option mapping
- [ ] 5.9 Add failing picoOS integration tests using the same canonical-timeline fixtures as visionOS for whole-transform binding, multi-segment full-pose sequence, rotation conversion, all four easing modes, delay, playback rate, loop, and compilation failure
- [ ] 5.10 Implement picoOS full-pose segment sequence compilation, playback-controller integration, and platform-option mapping
- [x] 5.11 Add failing fresh-play state tests for first `play` / `autoStart`; replay after complete/finish/stop/reset reading the latest baseline and recompiling; play after pause resuming the current controller; loop within one run reusing the current resource; compilation failure remaining inactive; React-only `queued` mapping to the four Native states; public state settling to `idle` after creation failure; and exact derivation of `finished` from `playState`
  - [x] 5.11a visionOS tests cover fresh-play baseline capture, write protection, inactive `set`, terminal write-protection release, and `reset` before first play, and are included in `build-for-testing`
  - [x] 5.11b Complete coverage for `autoStart`, replay, play after pause including the Native `running` state message and Core state update, loop-resource reuse, compilation failure, creation failure, and `finished` derivation
Native playback implementation:
  - [x] 5.12a visionOS `SpatialEntity.createAnimation(config)` and `EntityMotionAnimationObject` implement creation, fresh play, baseline capture, delay/running/paused transitions, play after pause with a `running` state message, loop, and command-failure reply paths
  - [ ] 5.12b picoOS equivalent creation, fresh play, state transitions, play after pause, loop, and command-failure reply paths

Native state and event verification:
  - [x] 5.13a visionOS tests cover inactive `set` sparse merging, active `set` state rejection, terminal write-protection release, reset start-pose commit, and controller cleanup, and are included in `build-for-testing`
  - [x] 5.13b Complete visionOS coverage for one state-message shape, `callbackAction`, pause and resume, empty successful control replies, message submission ordering, controller identity isolation, all loop terminal commits, stale completion filtering, and simulator execution
  - [x] 5.13c Complete visionOS post-commit readback tests that distinguish computed target poses from actual RealityKit-confirmed poses and cover start/reset/finish/complete/set, equivalent quaternions, inputs beyond 180 degrees, gimbal lock, zero scale, and complete components

Native state implementation:
  - [x] 5.14a visionOS state matrix, controller-scoped cleanup, post-commit complete-transform readback, canonical Euler decomposition, sparse rotation merging, one state-message shape, `callbackAction`, empty successful control replies, dedicated error events, controller identity filtering, serialized handling, and the `SetEntityAnimationResult.values` reply path
  - [ ] 5.14b picoOS equivalent state matrix, cleanup, terminal commits, write protection, transform decomposition, sparse merging, events, and replies

## 6. Capability and Validation

- [x] 6.1 Add failing tests for the documented Entity motion capability check using `supports('useEntityAnimation')`
- [x] 6.2 Add failing tests for explicit validation failures on unsupported Entity motion targets and invalid transform authoring
- [x] 6.3 Update runtime capability and validation implementation behavior to match the new target-state contract

## 7. Docs, Demos, and Migration

- [x] 7.1 Update Entity motion docs and migration guidance for the current config, binding, tuple, playback API, `entityProps`, `api.set`, transform ownership, capability check, and in-place update behavior
- [x] 7.2 Update `apps/test-server` Entity animation demos and capability pages to the new target-state API

## 8. Verification and Cross-platform Acceptance

- [x] 8.1 Execute implementation in strict TDD order: for each behavior group, write failing tests first, implement the minimum change to pass, then refactor with tests still green
- [x] 8.2 Run targeted React/Core tests for the tuple, binding, normalization, capability detection, `callbackAction`, state-message/control-reply races, target `objectdestroy`, `entityProps`, transform write protection, inactive React transform updates, and `api.set` command initiation
Bridge and integration acceptance:
  - [x] 8.3a Run Core Entity motion targeted tests against the new Bridge contract
  - [x] 8.3b Run full visionOS `xcodebuild test` against the new Bridge contract
  - [x] 8.3c Run full `xcodebuild test` on the current Apple Vision Pro Simulator and record Xcode, SDK, Simulator, command, test statistics, and a new `.xcresult`
  - [ ] 8.3d Run picoOS Bridge contract and integration tests
- [x] 8.4 On visionOS, accept percentage multi-keyframes, sparse fields, full-pose sequence, fresh play, delay, loop, pause and play after pause, stop/reset/finish/set, controller-scoped cleanup, unrelated Entity and descendant animation preservation, terminal commit, and teardown, recording platform version, SDK version, fixtures, executed commands, and results
  - [x] 8.4a Record the current Xcode, visionOS SDK, Apple Vision Pro Simulator version, device name, UDID, and complete fixture set
  - [x] 8.4b Run full `xcodebuild test` plus `tools/scripts/iwdp-sim.py` list, eval, click, dom/probe, and screenshot commands, recording the new `.xcresult`, per-item observations, and verified screenshot path
- [ ] 8.5 Run the same fixtures and acceptance matrix from 8.4 on picoOS, recording platform version, SDK version, fixtures, executed commands, and results
- [ ] 8.6 After picoOS acceptance, compare both platforms' state ordering, confirmed values, terminal transforms, errors, and replay behavior
- [x] 8.7 Run end-to-end regressions for terminal transforms, active set, and the target-destruction lifecycle and error behavior defined by the Entity motion spec
  - [x] 8.7a Use iwdp to confirm complete terminal transforms, active-set warning plus no-op behavior, pause and play-after-pause state synchronization, idempotent finish completion callbacks, unrelated Entity preservation, and Core-local behavior after target `objectdestroy`
- [x] 8.8 Record the deferred follow-up scope for visionOS and picoOS concurrency measurements; these measurements are not a release gate for this change

## 9. In-place Config Update and Retarget

- [x] 9.1 Add Core red tests for validation internalized by `update(config)`, equivalent config, successful commit, rollback, calls after destruction, and the concrete `set(update)` promise returning the confirmed pose
- [x] 9.2 Add React tests for stable object and id, shared FIFO, safe coalescing, callback updates, `autoStart`, and failure recovery; verify revision filtering in Core
- [x] 9.3 Add Core and visionOS Bridge red tests for `UpdateEntityAnimation` encoding, results, errors, and message order
- [x] 9.4 Read-only verify that RealityKit can read the current pose, prepare resources, switch controllers, filter old completion, and preserve pause; return to design review if atomic rollback cannot hold
- [x] 9.5 Add visionOS retarget tests for the current-pose temporary start, baseline, easing and playback options, configured boundaries, intermediate keyframes, stale completion, and write protection
- [x] 9.6 Add visionOS state and failure tests for paused, idle, and finished updates, callbacks, confirmed values, deferred inactive baselines, and atomic rollback
- [x] 9.7 Minimally implement Core `update(config)`, `UpdateEntityAnimationJSBCommand`, snapshot commit, and execution revision; internalize config validation and execution-definition comparison in the create and update entries; make concrete `set(update)` return a confirmed-pose promise
- [x] 9.8 Minimally implement React in-place update, FIFO, and safe coalescing; delete same-target recreate, pose handoff, and replacement generation
- [x] 9.9 Minimally implement visionOS update handling, transaction, retarget, paused definition, stale-event filtering, and confirmed-pose reporting
- [x] 9.10 Refactor with tests green, deleting superseded replacement code and fixtures plus Entity motion internal-subpath exports, mappings, references, and tests while preserving target replacement, unbind, and destruction
- [ ] 9.11 Implement and test equivalent picoOS Bridge, retarget, rollback, and race behavior
- [x] 9.12 Run Core/React tests, full visionOS tests, Simulator acceptance, and strict OpenSpec validation; record the state matrix and results