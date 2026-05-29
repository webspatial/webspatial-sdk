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

- [x] Types: `SpatializedPlaybackApi` — remove `cancel(keys?)`, add `stop()`, `reset()`, `finish()`
- [x] Types: Config callbacks — remove `onCancel`, add `onStop`, `onReset`; `finish()` reuses `onComplete`
- [x] Types: `SpatializedPlaybackError.command` — replace `'cancel'` with `'stop' | 'reset' | 'finish'`
- [x] Controller: rename `cancel()`→`reset()` (same logic: emit from values + idle + `onReset`)
- [x] Controller: implement `stop()` — freeze at current sampled values + idle + `onStop`
- [x] Controller: implement `finish()` — jump to final values + finished + `onComplete`
- [x] Controller: `stop()`/`reset()`/`finish()` do NOT accept `keys?` parameter (whole-session operations)
- [x] Native JSB: determine if `finish` needs a new command type or can be JS-only (cancel + emit to values)
- [x] Codebase: global rename `cancel`→`reset`, `onCancel`→`onReset` (Controller + tests + demo pages)
- [x] picoOS native: sync if new JSB command needed
- [x] Unit tests: verify stop/reset/finish each produce correct style values, playState, and callback
- [x] Sub-spec updates (spatialized-2d-motion, spatialized-static3d-motion, spatialized-dynamic3d-motion) if they reference `cancel`

## Phase 9b — Playback API semantic correction follow-up

- [x] Move semantic clarification tasks out of Phase 9 so Phase 9 remains scoped to the original stop/reset/finish expansion
- [x] Update umbrella spec, 2D spec, design, and API summary so `idle.reset()` emits start values, `idle.finish()` emits end values, and the bilingual docs stay aligned
- [x] Controller: make `stop()` terminate active session only, without seeking to start or end values
- [x] Controller: make `reset()` emit start values even when current `playState` is `idle`
- [x] Controller: make `finish()` emit end values and enter `finished` even when current `playState` is `idle`
- [x] Controller: align `finished` flag semantics so `stop()` / `reset()` force `false` and `finish()` forces `true`
- [x] Web path: verify idle-state `reset()` / `finish()` still emit values through the style outlet
- [x] Native path: verify `stop()` / `reset()` / `finish()` semantics match Web path and do not absorb one another
- [x] Unit tests: add regression coverage for `idle.reset()`, `idle.finish()`, and terminal-command independence

## Phase 9c — Canonical tracks execution for useSpatializedMotion

- [x] Update `proposal.md` and `proposal.zh.md` so all `useSpatializedMotion` authoring shapes (`from/to`, `timeline`, `tracks`) are documented as compiling to canonical `tracks`
- [x] Update `design.md` and `design.zh.md` so the unified motion path is described as canonical `tracks` execution and no longer references native segment downgrade for `useSpatializedMotion`
- [x] Update `specs/spatialized-2d-motion/spec.md` and `.zh.md` to remove native segment fallback / optimization language and require the canonical tracks path for native `useSpatializedMotion`
- [x] Update `specs/legacy-session-animation/spec.md` and `.zh.md` so the legacy native segment command remains scoped to `useAnimation` compatibility only
- [x] Update `specs/spatialized-element-motion/spec.md` and `.zh.md` to state that native `useSpatializedMotion` continues on the canonical tracks model
- [ ] Controller / bridge / native manager follow-up: remove segment downgrade from the `useSpatializedMotion` execution path while keeping legacy `useAnimation` behavior separate
- [ ] Tests follow-up: cover `from/to`, `timeline`, and `tracks` authoring shapes all reaching the same canonical tracks-native path

## Phase 10 — Timeline percentage keyframe config + timingFunction unification

- [ ] Types: `SpatializedMotionKeyframeValues` — `SpatializedVisualValues & { timingFunction?: TimingFunction }`
- [ ] Types: `SpatializedMotionTimelineConfig` — config shape with `timeline: Record<string, SpatializedMotionKeyframeValues>`
- [ ] Types: `SpatializedMotionKeyframe.timingFunction?` — per-keyframe optional field
- [ ] Types: `SpatializedMotionTrack` — rename `easing` to `timingFunction`
- [ ] Types: `SpatializedMotionConfig.timingFunction?` — global config-level field
- [ ] Types: `SpatializedMotionTimeline` (wire format) — track `easing` to `timingFunction`
- [ ] Core: `desugarTimelineConfig()` — parse `timeline` percentage keys into tracks
- [ ] Core: Config discriminator — detect timeline vs tracks vs from/to, route accordingly
- [ ] Core: `evaluateMotionTimeline` — implement 3-level `timingFunction` cascade (keyframe > track > config > 'linear')
- [ ] Core: Validation — reject <2 percentage keys, invalid keys, mutual exclusion with tracks/from-to
- [ ] Native wire: decide backward-compat strategy (keep wire `easing` + JS-layer mapping, or rename)
- [ ] Codebase: rename all `easing` references to `timingFunction` in source + tests
- [ ] Unit tests: timeline config parsing, decimal %, missing properties, single-frame rejection
- [ ] Unit tests: 3-level timingFunction cascade
- [ ] Demo pages: add timeline percentage keyframe examples

## Phase 11 — Binding prop rename (`motion` → `xr-animation`)

- [ ] Rename binding prop from `motion` to `xr-animation` on all target components:
  - `<div enable-xr motion={animation}>` → `<div enable-xr xr-animation={animation}>`
  - `<Model motion={animation}>` → `<Model xr-animation={animation}>`
  - `<Reality motion={animation}>` → `<Reality xr-animation={animation}>`
- [ ] Update `SpatializedMotionBinding` internal `__propName` from `'motion'` to `'xr-animation'`
- [ ] Update `createMotionBinding` to register under `xr-animation` prop key
- [ ] Update all React component prop type definitions (`ModelProps`, `RealityProps`, enable-xr type augmentation)
- [ ] Deprecation alias: accept `motion` with console.warn pointing to `xr-animation` (one release cycle)
- [ ] Update test-server demo pages: replace all `motion=` with `xr-animation=`
- [ ] Update unit / integration tests
- [ ] Update documentation (spec, design, proposal, API.zh.md) — prop references only