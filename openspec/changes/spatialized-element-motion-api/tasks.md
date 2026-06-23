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

## Phase 6 — Implementation follow-up

- [ ] Implement `SpatializedElement.createAnimation(config)` for supported spatialized element targets
- [ ] Implement native `AnimationObject : SpatialObject`
- [ ] Implement `CreateSpatializedElementAnimation`, `ControlSpatializedElementAnimation`, and `SpatialAnimationStateChanged`
- [ ] Implement element animating mask ownership in ordinary element sync
- [ ] Implement destroy + recreate on normalized config changes
- [ ] Remove target-state runtime dependencies on legacy controller/backend/Web RAF/old motion command execution paths
- [ ] Update demos and public docs after implementation lands
