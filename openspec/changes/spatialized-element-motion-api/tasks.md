# Tasks — spatialized-element-motion-api target state

This task list describes the target-state OpenSpec work for native-first spatialized element animation. It intentionally omits historical implementation phases from earlier motion/controller designs.

## Phase 1 — OpenSpec target-state alignment

- [x] Core spec: define native-first `AnimationObject : SpatialObject` architecture for spatialized element animation
- [x] Core spec: define `SpatializedElement.createAnimation(config)` and `CreateSpatializedElementAnimation`
- [x] Core spec: define `ControlSpatializedElementAnimation` for `play`, `pause`, `resume`, `stop`, `reset`, `finish`, and `destroy`
- [x] Core spec: define `SpatialAnimationStateChanged` as the native state/error/terminal-value event
- [x] Core spec: define create-time locked timeline semantics
- [x] Core spec: define config changes as destroy + recreate, not in-place timeline mutation
- [x] Core spec: remove target-state dependence on legacy controller/backend/Web RAF/old motion command execution paths
- [x] Core spec: define element animating mask as the target-state field ownership mechanism
- [x] Core spec: preserve existing authoring compatibility for `from`/`to`, `timeline`, and `tracks`
- [x] Core spec: preserve existing playback API and terminal callback semantics

## Phase 2 — Runtime capability delta

- [x] Add `runtime-capabilities` delta for `supports('useAnimation')`
- [x] Document `spatialized2d` target resolution under the single `useAnimation` capability gate
- [x] Document `static3d` / `dynamic3d` target resolution under the single `useAnimation` capability gate
- [x] Document that pure Web runtime returns `false` for all spatialized element animation target tokens
- [x] Document that `supports('useAnimation')` is the single released motion API capability gate

## Phase 3 — Target-specific spec alignment

- [x] 2D spec: require native-first `AnimationObject` target path with no Web RAF fallback
- [x] 2D spec: require native create to carry canonical tracks
- [x] 2D spec: replace legacy field-ownership wording with element animating mask wording
- [x] Static3D spec: require container-root transform / opacity timeline through `AnimationObject`
- [x] Static3D spec: support `opacity` tracks during `validateSpatializedMotionConfig`; do not silently drop them
- [x] Dynamic3D spec: require container transform/opacity timeline through `AnimationObject`
- [x] Entity spec boundary: keep entity animation separate from container `AnimationObject`

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

- [x] Tests: preserve `play` / `pause` / `resume` / `stop` / `reset` / `finish` API shape on the React-facing `api`
- [x] Tests: verify `pause()` and `resume()` do not accept keys or partial selectors
- [x] Tests: verify `stop()` freezes current values, sets `playState=idle`, sets `finished=false`, and invokes `onStop(values)`
- [x] Tests: verify `reset()` emits `from` values, sets `playState=idle`, sets `finished=false`, and invokes `onReset(values)`
- [x] Tests: verify `finish()` emits `to` values, sets `playState=finished`, sets `finished=true`, and invokes `onComplete(values)` after native terminal-state confirmation
- [x] Tests: verify natural completion invokes `onComplete(values)`
- [x] Tests: verify `idle.reset()` is not a no-op and still emits `from` values
- [x] Tests: verify explicit pre-bind `finish()` remains queued until the native-backed `AnimationObject` exists, then flushes and enters `finished`
- [x] Tests: verify `onComplete`, `onStop`, and `onReset` are mutually exclusive for each termination, while `onError` remains independent
- [x] Tests: verify explicit `api.play()` before bind still runs after bind when `autoStart: false`
- [x] Tests: verify one `animation` binding can bind only one component at a time
- [x] Validation tests: accept Static3D `opacity` tracks before create; do not silently drop them
- [x] Capability tests: verify `supports('useAnimation')` support and pure Web `false` behavior

## Phase 6 — Implementation invariants spec

- [x] Add `spatialized-animation-object-invariants` spec requiring native-owned `AnimationObject` identity
- [x] Add `spatialized-animation-object-invariants` spec requiring `CreateSpatializedElementAnimation` response to return the created object identity as `{ id }`
- [x] Add `spatialized-animation-object-invariants` spec requiring playback controls to reuse the same native `AnimationObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring `AnimationObject.destroy()` to use the destroy lifecycle inherited from `SpatialObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring Core SDK to expose the first-class `AnimationObject` returned by `SpatializedElement.createAnimation(config)`
- [x] Add `spatialized-animation-object-invariants` spec requiring Core `AnimationObject` to subscribe to NativeWebMsg directly and filter `SpatialAnimationStateChanged` by matching animation id
- [x] Add `spatialized-animation-object-invariants` spec requiring element animating mask to be owned by native `SpatializedElement` runtime or write adapter, not `PortalInstanceObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring target kind to writable fields / mask fields mapping
- [x] Add `spatialized-animation-object-invariants` spec requiring terminal mask handoff rules
- [x] Add `spatialized-animation-object-invariants` spec requiring React SDK to create native-backed `AnimationObject` only after `xr-animation` binding resolves a concrete target
- [x] Add `spatialized-animation-object-invariants` spec requiring visionOS runtime to manage native `AnimationObject` lifecycle through `SpatializedElementAnimationManager`
- [x] Add `spatialized-animation-object-invariants` spec requiring element destroy to cascade destroy related animations
- [x] Add `spatialized-animation-object-invariants` spec requiring native frame loop lifecycle to be manager-owned
- [x] Add `spatialized-animation-object-invariants` spec requiring pure Web runtime to have no Core RAF fallback

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
- [x] Core: implement `play/pause/resume/stop/reset/finish` directly on the same `AnimationObject`
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
- [x] React: queue pre-bind `api.play/pause/resume/stop/reset/finish` explicit commands in `AnimationBinding`
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
- [x] Test: reset emits from value, emits `onReset(values)`, and then releases mask
- [x] Test: finish emits to value, emits `onComplete(values)`, and then releases mask
- [x] Test: pause keeps the current value and keeps mask ownership
- [x] Test: native state is authoritative over Core SDK state
- [x] Test: Static3D opacity tracks are accepted before native create
- [x] Test: Static3D animation writes container-root `transform` / `opacity` and does not write `entityTransform`
- [x] Test: pure Web runtime returns false for `supports('useAnimation')`
- [x] Test: target-state runtime no longer uses the old `AnimateSpatializedElementMotion` path

## Phase 12 — Docs and demos follow-up

- [x] Update in-repo proposal/API docs so target-state copy no longer describes the removed Controller / Web RAF / `AnimateSpatializedElementMotion` paths
- [x] Clarify in bilingual proposal/design/spec/API docs that the returned `style` is a required host-state closure output and MUST be merged back to the host receiving `xr-animation`
- [x] Update demos and public docs after implementation lands
- [ ] Update PR description after implementation lands so it no longer presents the old Controller/Web RAF path as target-state implementation
