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

- [x] Describe React `AnimationProxy`
- [x] Describe Core normalization, queued commands, playback state projection, and object-channel lifecycle
- [x] Describe JSB/WebMsg split between create, control, and state-changed events
- [x] Describe native `AnimationObject` ownership of locked timeline, playback state, terminal values, and target-specific writes
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
- [x] Add `spatialized-animation-object-invariants` spec requiring `AnimationObject.destroy()` to use the common `SpatialObject` destroy lifecycle
- [x] Add `spatialized-animation-object-invariants` spec requiring Core SDK to expose the imperative `AnimationObject` handle returned by `SpatializedElement.createAnimation(config)`
- [x] Add `spatialized-animation-object-invariants` spec requiring native `AnimationObject` playback state to be authoritative and Core SDK state to be projected from `SpatialAnimationStateChanged`
- [x] Add `spatialized-animation-object-invariants` spec requiring element animating mask to be owned by native `SpatializedElement` runtime or write adapter, not `PortalInstanceObject`
- [x] Add `spatialized-animation-object-invariants` spec requiring React SDK to create native `AnimationObject` only after `xr-animation` binding resolves a concrete target
- [x] Add `spatialized-animation-object-invariants` spec requiring pure Web runtime to have no Core RAF fallback

## Phase 7 — Native AnimationObject implementation

- [ ] Native: add `AnimationObject : SpatialObject`
- [ ] Native: generate `AnimationObject.uuid` in the native create path
- [ ] Native: register `AnimationObject` in the common spatial object registry
- [ ] Native: implement `AnimationObject.destroy()` through the common `SpatialObject` destroy lifecycle
- [ ] Native: destroy cleanup stops frame driving, clears animating mask, unregisters listeners, and removes object from registry
- [ ] Native: implement locked `TimelineSampler` owned by `AnimationObject`
- [ ] Native: implement target-specific write adapters for `spatialized2d`, `static3d`, and `dynamic3d`
- [ ] Native: implement `SpatialAnimationStateChanged` WebMsg with `animationId`, `action`, `playState`, optional `values`, optional `error`

## Phase 8 — Core SDK object channel

- [ ] Core: add `SpatializedElement.createAnimation(config)`
- [ ] Core: send `CreateSpatializedElementAnimation` and wrap the native returned uuid as `AnimationObject`
- [ ] Core: expose `AnimationObject.uuid`
- [ ] Core: expose `AnimationObject.play/pause/resume/stop/reset/finish/destroy`
- [ ] Core: route `play/pause/resume/stop/reset/finish` through `ControlSpatializedElementAnimation`
- [ ] Core: route `AnimationObject.destroy()` through the common `SpatialObject.destroy()` path
- [ ] Core: project `playState`, `isAnimating`, `isPaused`, and `finished` from `SpatialAnimationStateChanged`
- [ ] Core: remove `WebPlaybackBackend` and RAF sampling from the spatialized element animation path
- [ ] Core: remove target-state runtime dependency on `SpatializedMotionController`, `NativePlaybackBackend`, and `AnimateSpatializedElementMotion`

## Phase 9 — React SDK AnimationProxy

- [ ] React: create native `AnimationObject` only after `xr-animation` binding resolves target
- [ ] React: preserve `[animation, api, style]` public API
- [ ] React: proxy pre-bind `api.play/pause/resume/stop/reset/finish` explicit commands
- [ ] React: ensure `autoStart: false` only disables implicit play-on-bind and does not drop explicit queued commands
- [ ] React: destroy the current `AnimationObject` on unmount / unbind
- [ ] React: destroy and recreate `AnimationObject` when normalized config signature changes
- [ ] React: keep Static3D / Dynamic3D `style` as `{}`
- [ ] React: do not implement Web RAF fallback for pure Web runtime

## Phase 10 — Element animating mask

- [ ] Native: store animation-owned field mask on `SpatializedElement` runtime or target write adapter
- [ ] Native: ignore or defer regular transform JSB updates while transform is animation-owned
- [ ] Native: ignore or defer regular opacity JSB updates while opacity is animation-owned
- [ ] Native: ensure mask logic does not depend on `PortalInstanceObject`
- [ ] Native: clear or update mask on stop/reset/finish/natural complete/destroy according to terminal handoff rules
- [ ] Tests: verify regular transform update does not override active animation transform
- [ ] Tests: verify regular opacity update does not override active animation opacity

## Phase 11 — Protocol and compatibility tests

- [ ] JSB test: `CreateSpatializedElementAnimation` returns native-generated uuid
- [ ] JSB test: `ControlSpatializedElementAnimation` supports play/pause/resume/stop/reset/finish
- [ ] WebMsg test: `SpatialAnimationStateChanged` updates matching Core SDK `AnimationObject`
- [ ] Test: core `AnimationObject.destroy()` uses common spatial object destroy path
- [ ] Test: stop freezes current value and emits `onStop(values)`
- [ ] Test: reset emits from value and emits `onReset(values)`
- [ ] Test: finish emits to value and emits `onComplete(values)`
- [ ] Test: native state is authoritative over Core SDK state projection
- [ ] Test: Static3D opacity tracks are rejected before native create
- [ ] Test: pure Web runtime returns false for `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])`

## Phase 12 — Docs and demos follow-up

- [ ] Update demos and public docs after implementation lands
- [ ] Update PR description after implementation lands so it no longer presents the old Controller/Web RAF path as target-state implementation
