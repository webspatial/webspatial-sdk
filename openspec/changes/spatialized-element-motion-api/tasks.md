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

- [x] Add `runtime-capabilities` delta for `supports('useAnimation', ['element'])`
- [x] Add `runtime-capabilities` delta for `supports('useAnimation', ['static3d'])`
- [x] Add `runtime-capabilities` delta for `supports('useAnimation', ['dynamic3d'])`
- [x] Document that pure Web runtime returns `false` for all spatialized element animation target tokens
- [x] Document that concrete target checks MUST use target sub-tokens; `supports('useAnimation')` remains family-level only

## Phase 3 — Target-specific spec alignment

- [x] 2D spec: require native-first `AnimationObject` target path with no Web RAF fallback
- [x] 2D spec: require native create to carry canonical tracks
- [x] 2D spec: replace legacy field-ownership wording with element animating mask wording
- [x] Static3D spec: require model-root transform timeline through `AnimationObject`
- [x] Static3D spec: reject `opacity` tracks during `validateSpatializedMotionConfig`; do not silently ignore them
- [x] Dynamic3D spec: require container transform/opacity timeline through `AnimationObject`
- [x] Entity spec boundary: keep entity animation separate from container `AnimationObject`

## Phase 4 — Design alignment

- [x] Describe React `AnimationBinding`: created by `useAnimation(config)`, queues pre-bind commands, and creates Core `AnimationObject` after bind
- [x] Describe Core `AnimationObject extends SpatialObject`: exposes playback methods directly, inherits `destroy()`, and subscribes to NativeWebMsg directly
- [x] Describe `SpatialAnimationStateChanged` as a NativeWebMsg payload, not a separate Core architecture object
- [x] Describe visionOS `SpatializedElementAnimationManager`: native animation lifecycle, create/control lookup, element destroy cascading, mask coordination, and WebMsg emission
- [x] Describe `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` as the visionOS JSB command entry point
- [x] Describe `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` as the native object store, without adding a standalone `SpatialObjectRegistry`
- [x] Describe element animating mask and terminal ownership handoff for `opacity` and host `transform`
- [x] Keep terminal callback semantics unchanged: `onComplete`, `onStop`, `onReset` mutually exclusive; `onError` independent
- [x] Keep bilingual `design.md` / `design.zh.md` aligned

## Phase 5 — Compatibility preservation tests

- [x] Tests: preserve `play` / `pause` / `resume` / `stop` / `reset` / `finish` API shape on the React-facing `api`
- [x] Tests: verify `pause()` and `resume()` do not accept keys or partial selectors
- [x] Tests: verify `stop()` freezes current values, sets `playState=idle`, sets `finished=false`, and invokes `onStop(values)`
- [x] Tests: verify `reset()` emits `from` values, sets `playState=idle`, sets `finished=false`, and invokes `onReset(values)`
- [x] Tests: verify `finish()` emits `to` values, sets `playState=finished`, sets `finished=true`, and invokes `onComplete(values)`
- [x] Tests: verify natural completion invokes `onComplete(values)`
- [x] Tests: verify `idle.reset()` is not a no-op and still emits `from` values
- [x] Tests: verify `idle.finish()` is not a no-op and still emits `to` values while entering `finished`
- [x] Tests: verify `onComplete`, `onStop`, and `onReset` are mutually exclusive for each termination, while `onError` remains independent
- [x] Tests: verify explicit `api.play()` before bind still runs after bind when `autoStart: false`
- [x] Tests: verify one `animation` binding can bind only one component at a time
- [x] Validation tests: reject Static3D `opacity` tracks before create; do not silently ignore them
- [x] Capability tests: verify `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])` target tokens and pure Web `false` behavior

## Phase 6 — Implementation invariants spec

- [x] Add `spatialized-animation-object-invariants` spec requiring native uuid as the only authoritative `AnimationObject` identity
- [x] Add `spatialized-animation-object-invariants` spec requiring `AnimationObject.destroy()` to use the destroy lifecycle inherited from `SpatialObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring Core SDK to expose the first-class `AnimationObject` returned by `SpatializedElement.createAnimation(config)`
- [x] Add `spatialized-animation-object-invariants` spec requiring Core `AnimationObject` to subscribe to NativeWebMsg directly and filter `SpatialAnimationStateChanged` by uuid
- [x] Add `spatialized-animation-object-invariants` spec requiring element animating mask to be owned by native `SpatializedElement` runtime or write adapter, not `PortalInstanceObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring React SDK to create native-backed `AnimationObject` only after `xr-animation` binding resolves a concrete target
- [x] Add `spatialized-animation-object-invariants` spec requiring visionOS runtime to manage native `AnimationObject` lifecycle through `SpatializedElementAnimationManager`
- [x] Add `spatialized-animation-object-invariants` spec requiring pure Web runtime to have no Core RAF fallback

## Phase 7 — Design architecture details

- [x] Design: document React / Core / visionOS package responsibilities
- [x] Design: document combined class diagram across packages
- [x] Design: document create, pre-bind explicit play, frame sampling, mask conflict, and config change / destroy sequences
- [x] Design: document visionOS reuse of existing `SpatialScene.setupJSBListeners()` as the JSB entry point
- [x] Design: document visionOS reuse of existing `SpatialScene.spatialObjects` as the native object store
- [x] Design: document direct reuse, refactor reuse, and removed pieces from the current visionOS motion implementation

## Phase 8 — Core SDK AnimationObject

- [ ] Core: add `SpatializedElement.createAnimation(config)`
- [ ] Core: send `CreateSpatializedElementAnimation` and wrap the native returned uuid as `AnimationObject`
- [ ] Core: implement `AnimationObject extends SpatialObject`
- [ ] Core: expose `AnimationObject.uuid`
- [ ] Core: implement `play/pause/resume/stop/reset/finish` directly on `AnimationObject`
- [ ] Core: ensure `AnimationObject.destroy()` uses the lifecycle inherited from `SpatialObject`
- [ ] Core: make `AnimationObject` subscribe to NativeWebMsg directly
- [ ] Core: make `AnimationObject` filter `SpatialAnimationStateChanged` by uuid
- [ ] Core: make `AnimationObject` update `playState/isAnimating/isPaused/finished` from native events
- [ ] Core: make `AnimationObject` state changes notify React subscribers
- [ ] Core: avoid adding public `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` architecture objects
- [ ] Core: remove `WebPlaybackBackend` and RAF sampling from the spatialized element animation path
- [ ] Core: remove target-state runtime dependency on `SpatializedMotionController`, `NativePlaybackBackend`, and `AnimateSpatializedElementMotion`

## Phase 9 — React SDK AnimationBinding

- [ ] React: create `AnimationBinding` during `useAnimation(config)`
- [ ] React: preserve `[animation, api, style]` public API
- [ ] React: store config and normalized config signature in `AnimationBinding`
- [ ] React: queue pre-bind `api.play/pause/resume/stop/reset/finish` explicit commands in `AnimationBinding`
- [ ] React: create Core `AnimationObject` only after `xr-animation` binding resolves target
- [ ] React: flush queued explicit commands after Core `AnimationObject` is created
- [ ] React: `PlaybackApi` subscribes to Core `AnimationObject` state and syncs `playState/isAnimating/isPaused/finished`
- [ ] React: ensure `autoStart: false` only disables implicit play-on-bind and does not drop explicit queued commands
- [ ] React: destroy the current `AnimationObject` on unmount / unbind
- [ ] React: destroy and recreate `AnimationObject` when normalized config signature changes
- [ ] React: keep Static3D / Dynamic3D `style` as `{}`
- [ ] React: do not implement Web RAF fallback for pure Web runtime

## Phase 10 — visionOS AnimationObject manager and mask

- [ ] visionOS: add `SpatializedElementAnimationManager`
- [ ] visionOS: manager owns `animationId -> NativeAnimationObject` lookup
- [ ] visionOS: manager handles `CreateSpatializedElementAnimation`
- [ ] visionOS: manager handles `ControlSpatializedElementAnimation`
- [ ] visionOS: manager handles `destroyAnimation(animationId)`
- [ ] visionOS: manager handles `destroyAnimationsForElement(elementId)`
- [ ] visionOS: register create/control animation commands through `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)`
- [ ] visionOS: register and look up native `AnimationObject` through existing `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject`
- [ ] visionOS: Native `AnimationObject` extends `SpatialObject`
- [ ] visionOS: Native `AnimationObject` owns locked `TimelineSampler`
- [ ] visionOS: Native `AnimationObject` owns playback state and per-frame `tick`
- [ ] visionOS: reuse `SpatializedElementMotionTimelineSampler` / `SpatializedMotionTimingFunction` / `SpatializedMotionTransformComponents`
- [ ] visionOS: refactor `SpatializedElementMotionTransformAdapter` into target write adapter
- [ ] visionOS: move `SpatializedElementMotionSession` timing fields and state algorithm into Native `AnimationObject`
- [ ] visionOS: refactor `SpatializedElementMotionManager` into object manager, reusing shared frame driver and terminal value construction logic
- [ ] visionOS: replace `AnimateSpatializedElementMotion` with `CreateSpatializedElementAnimation` / `ControlSpatializedElementAnimation`
- [ ] visionOS: replace old `${animationId}_completed/canceled/failed` WebMsg with unified `SpatialAnimationStateChanged`
- [ ] visionOS: animating mask lives on `SpatializedElement` runtime or target write adapter
- [ ] visionOS: mask logic does not depend on `PortalInstanceObject`
- [ ] Tests: verify regular transform update does not override active animation transform
- [ ] Tests: verify regular opacity update does not override active animation opacity

## Phase 11 — Protocol and compatibility tests

- [ ] JSB test: `CreateSpatializedElementAnimation` returns native-generated uuid
- [ ] JSB test: `ControlSpatializedElementAnimation` supports play/pause/resume/stop/reset/finish
- [ ] WebMsg test: `SpatialAnimationStateChanged` can be received directly by the matching Core `AnimationObject` and filtered by uuid
- [ ] Test: React `PlaybackApi` updates after Core `AnimationObject` state changes
- [ ] Test: core `AnimationObject.destroy()` uses common spatial object destroy path
- [ ] Test: no public `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` architecture object is required
- [ ] Test: no standalone `SpatialObjectRegistry` is added; native object lookup reuses `SpatialScene.spatialObjects`
- [ ] Test: no standalone `JSBCommandHandler` is added; command listeners reuse `SpatialScene.setupJSBListeners()`
- [ ] Test: visionOS manager destroys related animations when the target element is destroyed
- [ ] Test: stop freezes current value and emits `onStop(values)`
- [ ] Test: reset emits from value and emits `onReset(values)`
- [ ] Test: finish emits to value and emits `onComplete(values)`
- [ ] Test: native state is authoritative over Core SDK state
- [ ] Test: Static3D opacity tracks are rejected before native create
- [ ] Test: pure Web runtime returns false for `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])`
- [ ] Test: target-state runtime no longer uses the old `AnimateSpatializedElementMotion` path

## Phase 12 — Docs and demos follow-up

- [ ] Update demos and public docs after implementation lands
- [ ] Update PR description after implementation lands so it no longer presents the old Controller/Web RAF path as target-state implementation
