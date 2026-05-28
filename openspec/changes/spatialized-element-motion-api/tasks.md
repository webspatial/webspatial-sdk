# Tasks — spatialized-element-motion-api

## Phase 0 — Umbrella spec (documentation)

- [x] Create change `spatialized-element-motion-api` with proposal, design, capability matrix
- [x] Add sub-specs: `spatialized-element-motion`, `spatialized-2d-motion`, `spatialized-static3d-motion`, `spatialized-entity-motion` (entity deferred)
- [x] Label `spatial-div-motion-api` as 2D-only shipped scope in API.zh.md + motion spec

## Phase 1 — Unified naming + router (React)

- [x] Export `Spatialized*` type aliases and `useSpatializedMotion(config)`
- [x] Remove per-kind React hook aliases; public API is only `useSpatializedMotion`
- [x] Shared React internals: `useMotionController`, `createMotionBinding`, `createPlaybackApi`

## Phase 2 — Static3D + Dynamic3D native timelines

- [x] Core: `SpatializedStatic3DElement.animateMotion()` / `SpatializedDynamic3DElement.animateMotion()` via unified `AnimateSpatializedElementMotion`
- [x] Native: `SpatializedContainerMotionAnimationManager` + single JSB listener `AnimateSpatializedElementMotion` (`targetKind`: static3d | dynamic3d)
- [x] React: Model / Reality `motion` binding; `useSpatializedMotion(config)` with bind-time target resolution
- [x] test-server demos under **Spatialized Motion** (`model-container`, `reality-container`)

## Phase 3 — Core + React consolidation (single controller)

- [x] `SpatializedMotionController` — one implementation, `MOTION_KIND_POLICIES` per kind
- [x] `motionElementBridge` — unified `animateMotion` + `targetKind` for all kinds (`animateSpatialDiv` retained as 2D alias)
- [x] Thin subclasses: `SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`
- [x] `SpatializedMotionHandle` implemented by unified controller
- [x] OpenSpec design / API.zh / tasks aligned with consolidated architecture

## Phase 4 — Entity timeline (deferred)

- [ ] Entity transform timeline via existing `useAnimation` / `AnimateTransform` (not `SpatializedMotionController`)
- [ ] Sub-spec `spatialized-entity-motion` remains informational only until product prioritizes

## Phase 5 — Native consolidation + public surface cleanup

- [x] Merge native Swift Static3D/Dynamic3D managers → `SpatializedContainerMotionAnimationManager` + `SpatializedMotionTransformSink`
- [x] Unified JSB `AnimateSpatializedElementMotion` + `targetKind` only (removed `AnimateSpatializedStatic3DElement` / `AnimateSpatializedDynamic3DElement`)
- [x] Merge 2D into `AnimateSpatializedElementMotion` (`targetKind: spatialized2d`); removed `AnimateSpatialized2DElement` JSB
- [x] Remove deprecated Core controller class aliases (`SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`)
- [x] `supports('useSpatializedMotion', [target])` top-level capability (mirrors `useAnimation` element/static3d/dynamic3d flags)
- [ ] Web RAF for Static3D / Dynamic3D (deferred — product requires native-only for 3D containers)

## Phase 6 — Unified JSB for 2D + `Spatialized*` type rename

- [x] Canonical types in `types/spatializedMotion.ts`, `spatializedVisual.ts`, `spatializedPlayback.ts`, `spatializedMotionBinding.ts`
- [x] Remove `SpatialDiv*` type modules and deprecated JSB aliases
- [x] `parseSpatializedVisualValues`, `validateSpatializedMotionConfig`, `spatializedMotionSegmentValidator`

## Phase 6b — Unified JSB for 2D (completed earlier in phase 6 commit)

- [x] Extend `AnimateSpatializedElementMotion` with `targetKind: spatialized2d`
- [x] Route native 2D through `SpatialDivAnimationManager` in unified listener
- [x] Core: `executeAnimateSpatializedElementMotion` for all kinds; remove `AnimateSpatialDivJSBCommand`
- [x] Keep `animateSpatialDiv()` as deprecated alias on `Spatialized2DElement` for `useSpatialDivAnimation`

## Phase 7 — Spec merge + bilingual documentation

- [x] Merge Plan A (`spatial-div-animation-api`) and Plan B (`spatial-div-motion-api`) into unified umbrella
- [x] Archive `spatial-div-animation-api/` and `spatial-div-motion-api/` to `openspec/changes/archive/`
- [x] Create `specs/legacy-session-animation/` sub-spec (EN + ZH) for Plan A compatibility layer
- [x] Move feasibility docs to `references/`
- [x] Rewrite `proposal.md` and `proposal.zh.md` with full historical narrative (Plan A → Plan B → unified)
- [x] Rewrite `design.md` and `design.zh.md` with comprehensive unified design including legacy compatibility
- [x] Integrate detailed 2D motion spec content into `specs/spatialized-2d-motion/spec.md` and `.zh.md`
- [x] Add `.zh.md` versions for all sub-specs (`spatialized-element-motion`, `spatialized-static3d-motion`, `spatialized-dynamic3d-motion`)
- [x] Add `CAPABILITY_MATRIX.zh.md`
- [x] Remove `COMPARISON.md` (no longer needed after merge)
- [x] Update `tasks.md` and create `tasks.zh.md`

## Phase 8 — Bind-time target resolution (API reshape)

- [x] Remove `kind` from `SpatializedMotionConfig` public type (config no longer carries target)
- [x] Change `useSpatializedMotion` return from object `{ style, api, motion, controller }` to tuple `[animation, api, style]`
- [x] Implement deferred target slot in `animation` binding (target unknown until mount)
- [x] `<div enable-xr motion={animation}>` → resolve target to `spatialized2d`, activate Web RAF + native policy
- [x] `<Model motion={animation}>` → resolve target to `static3d`, activate native-only policy
- [x] `<Reality motion={animation}>` → resolve target to `dynamic3d`, activate native-only policy
- [x] `style` returns `{}` for native-only targets (static3d / dynamic3d); active CSSProperties for 2D
- [x] Pre-bind `api.play()` queues command; playback starts after target resolved
- [x] Single-bind constraint: warn/throw if same `animation` bound to multiple components
- [x] Remove `useSpatializedMotion.simple()` public surface; unified hook accepts `from/to` or `tracks` directly
- [x] Remove internal `switch (config.kind)` routing in `useSpatializedMotion.ts`
- [x] Update all test-server demo pages to new tuple API
- [x] Update unit tests (`useSpatializedMotion.behavior.test.tsx`, `.native.test.tsx`)
- [x] Update `@webspatial/core-sdk` exports: remove `SpatializedMotionKind` from public surface (internal only)

## Phase 9 — Playback API expansion (stop / reset / finish)

- [ ] Types: `SpatializedPlaybackApi` — remove `cancel(keys?)`, add `stop()`, `reset()`, `finish()`
- [ ] Types: Config callbacks — remove `onCancel`, add `onStop`, `onReset`; `finish()` reuses `onComplete`
- [ ] Types: `SpatializedPlaybackError.command` — replace `'cancel'` with `'stop' | 'reset' | 'finish'`
- [ ] Controller: rename `cancel()`→`reset()` (same logic: emit from values + idle + `onReset`)
- [ ] Controller: implement `stop()` — freeze at current sampled values + idle + `onStop`
- [ ] Controller: implement `finish()` — jump to final values + finished + `onComplete`
- [ ] Controller: `stop()`/`reset()`/`finish()` do NOT accept `keys?` parameter (whole-session operations)
- [ ] Native JSB: determine if `finish` needs a new command type or can be JS-only (cancel + emit to values)
- [ ] Codebase: global rename `cancel`→`reset`, `onCancel`→`onReset` (Controller + tests + demo pages)
- [ ] picoOS native: sync if new JSB command needed
- [ ] Unit tests: verify stop/reset/finish each produce correct style values, playState, and callback
- [ ] Sub-spec updates (spatialized-2d-motion, spatialized-static3d-motion, spatialized-dynamic3d-motion) if they reference `cancel`
