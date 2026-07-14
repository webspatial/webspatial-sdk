# Tasks — spatialized-element-motion-api target state

This task list describes the target-state OpenSpec work for native-first spatialized element animation. It intentionally omits historical implementation phases from earlier motion/controller designs.

## Phase 1 — OpenSpec target-state alignment

- [x] Core spec: define native-first `AnimationObject : SpatialObject` architecture for spatialized element animation
- [x] Core spec: define `SpatializedElement.createAnimation(config)` and `CreateSpatializedElementAnimation`
- [x] Core spec: define `ControlSpatializedElementAnimation` for `play`, `pause`, `resume`, `stop`, `reset`, `finish`, and `destroy`
- [x] Core spec: define `SpatialAnimationStateChanged` as the native state/error/terminal-value event
- [x] Core spec: define create-time locked normalized numeric timeline semantics
- [x] Core spec: define config changes as destroy + recreate, not in-place timeline mutation
- [x] Core spec: remove target-state dependence on legacy controller/backend/Web RAF/old motion command execution paths
- [x] Core spec: define element animating mask as the target-state field ownership mechanism
- [x] Core spec: define normalization into the canonical internal tracks model
- [x] Core spec: preserve existing playback API and terminal callback semantics

## Phase 2 — Runtime capability delta

- [x] Add `runtime-capabilities` delta for `supports('useAnimation')`
- [x] Document `spatialized2d` target resolution under the single `useAnimation` capability gate
- [x] Document `static3d` / `dynamic3d` target resolution under the single `useAnimation` capability gate
- [x] Document that pure Web runtime returns `false` for all spatialized element animation target tokens
- [x] Document that `supports('useAnimation')` is the single released motion API capability gate

## Phase 3 — Unified target-matrix alignment

- [x] Unified spec: require native-first `AnimationObject` target path with no Web RAF fallback
- [x] Unified spec: require native create to carry canonical internal tracks
- [x] Unified spec: define element animating mask ownership wording
- [x] Unified spec: require Static3D container-root transform / opacity animation
- [x] Unified spec: require Dynamic3D container-root transform / opacity animation
- [x] Unified spec: keep Entity animation separate from container motion

## Phase 4 — Design alignment

- [x] Describe React `AnimationBinding`: created by `useAnimation(config)`, queues pre-bind commands, and creates Core `AnimationObject` after bind
- [x] Describe Core `AnimationObject extends SpatialObject`: exposes playback methods directly, inherits `destroy()`, and subscribes to NativeWebMsg directly
- [x] Describe `SpatialAnimationStateChanged` as a NativeWebMsg payload, not a separate Core architecture object
- [x] Describe visionOS `SpatializedElementAnimationManager`: native animation lifecycle, create/control lookup, element destroy cascading, mask coordination, and WebMsg emission
- [x] Describe `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` as the visionOS JSB command entry point
- [x] Describe `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` as the native object store, without adding a standalone `SpatialObjectRegistry`
- [x] Describe existing `SpatialScene` / `spatialWebViewModel` WebMsg send path carrying `SpatialAnimationStateChanged`, without adding a standalone emitter
- [x] Describe `ElementAnimationWriteAdapter` as called by Native `AnimationObject.tick()`, not by manager per-property writes
- [x] Describe target kind to writable fields / mask fields mapping
- [x] Describe playback controls reusing the same `AnimationObject`, with `reset/finish` not recreating the object
- [x] Describe element destroy cascading to related `AnimationObject` instances
- [x] Describe element animating mask and terminal ownership handoff for `pause/stop/reset/finish/natural completion/destroy`
- [x] Keep terminal callback semantics unchanged: `onComplete`, `onStop`, `onReset` mutually exclusive; `onError` independent
- [x] Keep bilingual `design.md` / `design.zh.md` aligned

## Phase 5 — Compatibility preservation tests

- [x] Tests: preserve `play` / `pause` / `stop` / `reset` / `finish` API shape on the React-facing `api`
- [x] Tests: verify paused `play()` resumes, running `play()` is a no-op, and `play()` / `pause()` do not accept keys or partial selectors
- [x] Tests: verify `stop()` freezes current values, sets `playState=idle`, sets `finished=false`, and invokes `onStop(values)`
- [x] Tests: verify `reset()` emits session-start values, sets `playState=idle`, sets `finished=false`, and invokes `onReset(values)`
- [x] Tests: verify `finish()` emits `to` values, sets `playState=finished`, sets `finished=true`, and invokes `onComplete(values)` after native terminal-state confirmation
- [x] Tests: verify natural completion invokes `onComplete(values)`
- [x] Tests: verify `idle.reset()` is not a no-op and still emits `from` values
- [x] Tests: verify explicit pre-bind `finish()` remains queued until the native-backed `AnimationObject` exists, then flushes and enters `finished`
- [x] Tests: verify `onComplete`, `onStop`, and `onReset` are mutually exclusive for each termination, while `onError` remains independent
- [x] Tests: verify explicit `api.play()` before bind still runs after bind when `autoStart: false`
- [x] Tests: verify one `animation` binding can bind only one component at a time
- [x] Validation tests: accept Static3D `opacity` tracks before create; do not silently drop them
- [x] Capability tests: verify `supports('useAnimation')` support and pure Web `false` behavior

## Phase 6 — Implementation invariants in design

- [x] Design native-owned `AnimationObject` identity and common `SpatialObject` destruction
- [x] Design same-object playback controls and NativeWebMsg-driven state
- [x] Design target field mapping, animating mask ownership, and terminal handoff
- [x] Design bind-time object creation, manager lifecycle, element-destroy cascading, and frame-loop ownership
- [x] Keep pure Web RAF fallback excluded from the target architecture

## Phase 7 — Design architecture details

- [x] Design: document React / Core / visionOS package responsibilities
- [x] Design: document combined class diagram across packages
- [x] Design: document create, pre-bind explicit play, frame sampling, mask conflict, and config change / destroy sequences
- [x] Design: document visionOS reuse of existing `SpatialScene.setupJSBListeners()` as the JSB entry point
- [x] Design: document visionOS reuse of existing `SpatialScene.spatialObjects` as the native object store
- [x] Design: document `{ id }` create response, playback object reuse, target fields, mask handoff, and element destroy cascading
- [x] Design: document direct reuse, refactor reuse, and removed pieces from the current visionOS motion implementation

## Phase 8 — Core SDK AnimationObject

- [x] Core: add `SpatializedElement.createAnimation(config)`
- [x] Core: send `CreateSpatializedElementAnimation` and wrap the native returned `{ id }` as `AnimationObject`
- [x] Core: implement `AnimationObject extends SpatialObject`
- [x] Core: keep `AnimationObject` on the inherited `SpatialObject` identity path
- [x] Core: implement `play/pause/stop/reset/finish` directly on the same `AnimationObject`, with paused `play()` resuming playback
- [x] Core: ensure `reset/finish` do not recreate the native `AnimationObject`
- [x] Core: ensure `AnimationObject.destroy()` uses the lifecycle inherited from `SpatialObject`
- [x] Core: make `AnimationObject` subscribe to NativeWebMsg directly
- [x] Core: make `AnimationObject` filter `SpatialAnimationStateChanged` by matching animation id
- [x] Core: make `AnimationObject` update `playState/isAnimating/isPaused/finished` from native events
- [x] Core: make `AnimationObject` state changes notify React subscribers
- [x] Core: avoid adding public `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` architecture objects
- [x] Core: remove `WebPlaybackBackend` and RAF sampling from the spatialized element animation path
- [x] Core: remove target-state runtime dependency on `SpatializedMotionController`, `NativePlaybackBackend`, and `AnimateSpatializedElementMotion`
- [x] Core: remove the unused target-specific validation hook after Static3D `opacity` support no longer needs pre-create rejection

## Phase 9 — React SDK AnimationBinding

- [x] React: create `AnimationBinding` during `useAnimation(config)`
- [x] React: preserve `[animation, api, style]` public API
- [x] React: store config and normalized config signature in `AnimationBinding`
- [x] React: queue pre-bind `api.play/pause/stop/reset/finish` explicit commands in `AnimationBinding`
- [x] React: create Core `AnimationObject` only after `xr-animation` binding resolves target
- [x] React: flush queued explicit commands after Core `AnimationObject` is created
- [x] React: `PlaybackApi` subscribes to Core `AnimationObject` state and syncs `playState/isAnimating/isPaused/finished`
- [x] React: ensure `autoStart: false` only disables implicit play-on-bind and does not drop explicit queued commands
- [x] React: destroy the current `AnimationObject` on unmount / unbind
- [x] React: destroy and recreate `AnimationObject` when normalized config signature changes
- [x] React: keep Static3D / Dynamic3D `style` as `{}`
- [x] React: ensure `style` outlet is not the playback source for native-backed animation
- [x] React: do not implement Web RAF fallback for pure Web runtime

## Phase 10 — visionOS AnimationObject manager and mask

- [x] visionOS: add `SpatializedElementAnimationManager`
- [x] visionOS: manager owns `animationId -> NativeAnimationObject` lookup
- [x] visionOS: manager handles `CreateSpatializedElementAnimation` and returns `{ id }`
- [x] visionOS: manager handles `ControlSpatializedElementAnimation`
- [x] visionOS: manager handles `destroyAnimation(animationId)`
- [x] visionOS: manager handles `destroyAnimationsForElement(elementId)` and enters each animation object's destroy lifecycle
- [x] visionOS: register create/control animation commands through `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)`
- [x] visionOS: register and look up native `AnimationObject` through existing `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject`
- [x] visionOS: Native `AnimationObject` extends `SpatialObject`
- [x] visionOS: Native `AnimationObject` owns locked `TimelineSampler`
- [x] visionOS: Native `AnimationObject` owns playback state and per-frame `tick`
- [x] visionOS: Native `AnimationObject` `reset/finish` reuse the same object and do not recreate it
- [x] visionOS: Native `AnimationObject.tick()` calls target write adapter to write samples
- [x] visionOS: target write adapter limits writable fields and mask fields by target kind
- [x] visionOS: Static3D writes container-root `transform` and `opacity`, not model-internal `entityTransform` / `modelTransform`
- [x] visionOS: implement terminal mask handoff: pause keeps mask; stop/reset/finish/natural complete/destroy release mask
- [x] visionOS: emit `SpatialAnimationStateChanged` through existing `SpatialScene` / `spatialWebViewModel` WebMsg path
- [x] visionOS: reuse `SpatializedElementMotionTimelineSampler` / `SpatializedMotionTimingFunction` / `SpatializedMotionTransformComponents`
- [x] visionOS: refactor `SpatializedElementMotionTransformAdapter` into target write adapter
- [x] visionOS: move timing fields and state algorithm into Native `AnimationObject`
- [x] visionOS: refactor `SpatializedElementMotionManager` into object manager, reusing shared frame driver and terminal value construction logic
- [x] visionOS: replace `AnimateSpatializedElementMotion` with `CreateSpatializedElementAnimation` / `ControlSpatializedElementAnimation`
- [x] visionOS: replace old `${animationId}_completed/canceled/failed` WebMsg with unified `SpatialAnimationStateChanged`
- [x] visionOS: animating mask lives on `SpatializedElement` runtime or target write adapter
- [x] visionOS: mask logic does not depend on `PortalInstanceObject`
- [x] Tests: verify regular transform update does not override active animation transform
- [x] Tests: verify regular opacity update does not override active animation opacity

## Phase 11 — Protocol and compatibility tests

- [x] JSB test: `CreateSpatializedElementAnimation` returns the created object identity as `id`
- [x] JSB test: `ControlSpatializedElementAnimation` supports play/pause/resume/stop/reset/finish
- [x] JSB test: `reset/finish` do not recreate native `AnimationObject`; object id remains unchanged
- [x] WebMsg test: `SpatialAnimationStateChanged` can be received directly by the matching Core `AnimationObject` and filtered by animation id
- [x] Test: React `PlaybackApi` updates after Core `AnimationObject` state changes
- [x] Test: core `AnimationObject.destroy()` uses common spatial object destroy path
- [x] Test: no public `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` architecture object is required
- [x] Test: no standalone `SpatialObjectRegistry` is added; native object lookup reuses `SpatialScene.spatialObjects`
- [x] Test: no standalone `JSBCommandHandler` is added; command listeners reuse `SpatialScene.setupJSBListeners()`
- [x] Test: no standalone `NativeWebMsgEmitter` is added; WebMsg emission reuses the existing SpatialScene path
- [x] Test: visionOS manager destroys related animations when the target element is destroyed
- [x] Test: stop freezes current value, emits `onStop(values)`, and then releases mask
- [x] Test: reset emits the normalized start value, emits `onReset(values)`, and then releases mask
- [x] Test: finish emits the normalized end value, emits `onComplete(values)`, and then releases mask
- [x] Test: `pause()` keeps the current value and mask ownership; paused `play()` resumes playback
- [x] Test: native state is authoritative over Core SDK state
- [x] Test: Static3D opacity tracks are accepted before native create
- [x] Test: Static3D animation writes container-root `transform` / `opacity` and does not write `entityTransform`
- [x] Test: pure Web runtime returns false for `supports('useAnimation')`
- [x] Test: target-state runtime no longer uses the old `AnimateSpatializedElementMotion` path

## Phase 12 — Docs and demos follow-up

- [x] Update in-repo proposal/API docs so target-state copy no longer describes the removed Controller / Web RAF / `AnimateSpatializedElementMotion` paths
- [x] Clarify in bilingual proposal/design/spec/API docs that the returned `style` is a required host-state closure output and MUST be merged back to the host receiving `xr-animation`

## Phase 13 — Public segment/timeline authoring and internal-only tracks

- [x] Consolidate 2D, Static3D, and Dynamic3D behavior into the single `spatialized-element-motion` spec
- [x] Remove the deferred Entity, legacy-session, and implementation-invariants spec capabilities; retain Entity boundaries in the unified spec and implementation architecture in design
- [x] Retain top-level `from` / `to`, let timeline take precedence when present, and allow timeline `from` / `to` to mix with percentage keyframes
- [x] Define tracks as an internal-only canonical representation with no public or experimental entry point
- [x] Keep proposal user-facing and move technical implementation detail to design
- [x] TDD red: add public type and runtime validation tests for complete top-level segments, rejected incomplete top-level segments, timeline configs without top-level boundaries, timeline precedence, mixed timeline entries, property boundary behavior, rejected tracks authoring, and removal of `api.resume()`
- [x] TDD green: update public Core / React config types and exports while retaining internal canonical tracks
- [x] TDD green: update Core normalization and runtime validation for top-level segment authoring and mixed timeline authoring; keep the native numeric tracks contract unchanged
- [x] Migrate React integration tests and test-server pages that use public tracks authoring to public timeline authoring; retain valid top-level segment examples
- [x] Run Core / React tests, typechecks, test-server checks, repository searches, and OpenSpec validation

## Phase 14 — Require timeline start/end boundaries and warn on ignored top-level from/to

- [x] Align proposal, design, and spec so a timeline MUST define both a start frame (`from`/`0%`) and an end frame (`to`/`100%`), missing boundaries are rejected and never filled from underlying style, while property-level sparseness (each property may begin/end inside the timeline) and the two-keyframe minimum are retained
- [x] TDD red: add missing-start-frame and missing-end-frame rejection tests, add a warning test for top-level `from`/`to` coexisting with a timeline, and retain rejection tests for one-keyframe tracks and duplicate boundaries
- [x] TDD green: enforce required start/end boundary frames in Core normalization and emit an unconditional development warning when top-level `from`/`to` coexist with a timeline, while preserving sparse numeric tracks and the native sampler contract
- [x] Run Core / React tests, typechecks, test-server checks, repository searches, and OpenSpec validation
