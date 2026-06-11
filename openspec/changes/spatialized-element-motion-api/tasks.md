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
- [x] Native: `SpatializedElementMotionManager` + single JSB listener `AnimateSpatializedElementMotion` (`targetKind`: static3d | dynamic3d)
- [x] React: Model / Reality `motion` binding; `useSpatializedMotion(config)` with bind-time target resolution
- [x] test-server demos under **Spatialized Motion** (`model-container`, `reality-container`)

## Phase 3 — Core + React consolidation (single controller)

- [x] `SpatializedMotionController` — one implementation, `MOTION_KIND_POLICIES` per kind
- [x] `motionElementBridge` — unified `animateMotion` + `targetKind` for all kinds (`animateSpatialDiv` retained as 2D alias)
- [x] Thin subclasses: `SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`
- [x] `SpatializedMotionHandle` implemented by unified controller
- [x] OpenSpec design / API.zh / tasks aligned with consolidated architecture

## Phase 4 — Entity timeline (deferred)

- [ ] Entity transform timeline via `useEntityAnimation` / `AnimateTransform` (not `SpatializedMotionController`)
- [ ] Sub-spec `spatialized-entity-motion` remains informational only until product prioritizes

## Phase 5 — Native consolidation + public surface cleanup

- [x] Merge native Swift Static3D/Dynamic3D managers → `SpatializedElementMotionManager` + `SpatializedElementMotionTransformAdapter`
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
- [x] Route native 2D through `SpatializedElementMotionManager` in unified listener
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
- [x] Update `specs/legacy-session-animation/spec.md` and `.zh.md` so the legacy native segment path is documented as removed and retained only as historical reference
- [x] Update `specs/spatialized-element-motion/spec.md` and `.zh.md` to state that native `useSpatializedMotion` continues on the canonical tracks model
- [x] Controller / bridge / native manager follow-up: remove segment downgrade from the `useSpatializedMotion` execution path and delete the remaining legacy native segment fallback
- [x] Tests follow-up: cover `from/to` and `tracks` authoring shapes reaching the same canonical tracks-native path; percentage-key `timeline` coverage remains in Phase 10
- [x] 2D native suppression stays scoped to active native playback and clears on terminal / unbind

## Phase 9d — Controller pause/resume keys removal

- [x] Types: `SpatializedPlaybackApi` pause/resume signatures are `pause(): void` / `resume(): void`; remove `SpatializedMotionPropertyKeys`
- [x] Controller / backend: delete selective pause/resume branches, partial-paused handling, and any per-key pause state tables from the runtime path
- [x] JSB / bridge: remove `properties` from `AnimateSpatializedElementMotionCommand` and keep pause/resume as whole-session commands only
- [x] Tests: add whole-controller pause/resume coverage, and verify extra controller-control arguments are rejected at the type level
- [x] Docs / examples: remove key-level pause/resume wording from proposal, design, API summary, and spec; note that future local control would require a separate track/action API

## Phase 10 — Timeline percentage keyframe config + timingFunction unification

- [x] Types: `SpatializedMotionKeyframeValues` — `SpatializedVisualValues & { timingFunction?: TimingFunction }`
- [x] Types: `SpatializedMotionTimelineConfig` — config shape with `timeline: Record<string, SpatializedMotionKeyframeValues>`
- [x] Types: `SpatializedMotionKeyframe.timingFunction?` — per-keyframe optional field
- [x] Types: `SpatializedMotionTrack` — rename `easing` to `timingFunction`
- [x] Types: `SpatializedMotionConfig.timingFunction?` — global config-level field
- [x] Types: `SpatializedMotionTimeline` (wire format) — track `easing` to `timingFunction`
- [x] Core: `desugarTimelineConfig()` — parse `timeline` percentage keys into tracks
- [x] Core: Config discriminator — detect timeline vs tracks vs from/to, route accordingly
- [x] Core: `evaluateMotionTimeline` — implement 3-level `timingFunction` cascade (keyframe > track > config > 'linear')
- [x] Core: Validation — reject <2 percentage keys, invalid keys, mutual exclusion with tracks/from-to
- [x] Native wire: decide backward-compat strategy (keep wire `easing` + JS-layer mapping, or rename)
- [x] Codebase: rename all `easing` references to `timingFunction` in source + tests
- [x] Unit tests: timeline config parsing, decimal %, missing properties, single-frame rejection
- [x] Unit tests: 3-level timingFunction cascade
- [x] Demo pages: add timeline percentage keyframe examples

## Phase 11 — Binding prop rename (`motion` → `xr-animation`)

- [x] Rename binding prop from `motion` to `xr-animation` on all target components:
  - `<div enable-xr motion={animation}>` → `<div enable-xr xr-animation={animation}>`
  - `<Model motion={animation}>` → `<Model xr-animation={animation}>`
  - `<Reality motion={animation}>` → `<Reality xr-animation={animation}>`
- [x] Update `SpatializedMotionBinding` internal `__propName` from `'motion'` to `'xr-animation'`
- [x] Update `createMotionBinding` to register under `xr-animation` prop key
- [x] Update all React component prop type definitions (`ModelProps`, `RealityProps`, enable-xr type augmentation)
- [x] Update test-server demo pages: replace all `motion=` with `xr-animation=`
- [x] Update unit / integration tests
- [x] Update documentation (spec, design, proposal, API.zh.md) — prop references only

## Phase 12 — Rename current `useAnimation` to `useEntityAnimation`

- [x] Rename the current public `useAnimation` export to `useEntityAnimation`
- [x] Remove SpatialDiv-key dispatch from the renamed hook so `useEntityAnimation` is entity-only
- [x] Update entity-facing docs and examples to use `useEntityAnimation`
- [x] Refactor `apps/test-server/src/pages/entity-animation/**` to import `useEntityAnimation`
- [x] Update entity capability-check pages and related runtime probe copy to the renamed hook
- [x] Verify the refactored entity `test-server` pages still render and control playback correctly

## Phase 13 — Rename `useSpatializedMotion` to `useAnimation`

- [x] Rename public `useSpatializedMotion(config)` to `useAnimation(config)` without changing the target-agnostic timeline semantics
- [x] Update `@webspatial/react-sdk` exports and in-repo imports to the renamed spatialized hook
- [x] Refactor `apps/test-server/src/pages/spatial-div-motion/**` to use the new `useAnimation` import
- [x] Refactor `apps/test-server/src/pages/spatial-element-motion/**` to use the new `useAnimation` import
- [x] Update spatialized motion capability-check pages and related runtime probe copy to the renamed hook
- [x] Verify the refactored spatialized-motion `test-server` pages still render and control playback correctly

## Phase 14 — Remove legacy SpatialDiv session path

- [x] Proposal/tasks follow-up: rewrite the umbrella change narrative so Plan A remains historical context only and is no longer a retained compatibility path
- [x] React public surface: remove the legacy `animation` prop path and its old SpatialDiv session binding flow
- [x] React internals: remove `useSpatialDivAnimation` and other legacy-only wiring once no public callers remain
- [x] Core public surface: remove `animateSpatialDiv()` and other deprecated 2D aliases kept only for the legacy session path
- [x] Demo cleanup: remove or replace `apps/test-server/src/pages/spatial-div-animation/**` pages that still exercise the legacy entrypoints
- [x] Spec cleanup: rewrite `specs/legacy-session-animation/` as historical reference only, or remove it from the active umbrella if the final scope no longer needs an active legacy sub-spec

## Phase 15 — visionOS 2D backend convergence + capability contract cleanup

- [x] visionOS native routing: move `spatialized2d` off `onAnimateSpatialized2DMotion` / `SpatializedElementMotionManager` and onto the unified `onAnimateSpatializedElementMotionCommand` / `SpatializedElementMotionManager` path
- [x] visionOS cleanup: delete the old 2D native adapter layer after unified routing reaches semantic parity for play pause resume stop reset finish and unbind cleanup
- [x] Capability contract docs: keep `useAnimation` as the top-level family key and keep `entity` as a sub-token because the long-term roadmap still converges entity animation back into the `useAnimation` family
- [x] Capability guidance: document that concrete runtime checks MUST use `supports('useAnimation', [subtoken])`; `supports('useAnimation')` remains family-level only and MUST NOT be treated as target availability

## Phase — PicoOS Alignment

- [ ] Archive picoOS Plan A (`spatial-div-animation-api`) to `_archived/` ✅ (completed 2026-06-04)
- [ ] Create unified `spatialized-element-motion-api` change in picoOS repo ✅ (completed 2026-06-04)
- [ ] picoOS Phase 1: JSB protocol migration (`AnimateSpatialized2DElement` → `AnimateSpatializedElementMotion` + `targetKind`)
- [ ] picoOS Phase 2: Canonical tracks execution (replace single from/to lerp with multi-track evaluator)
- [ ] picoOS Phase 3: Extended terminal commands (`stop`/`reset`/`finish` with correct value-emission semantics)
- [ ] picoOS Phase 4: 3-level timingFunction cascade (keyframe > track > config > 'linear')
- [ ] picoOS Phase 5: Timeline percentage keyframe desugaring
- [ ] picoOS Phase 6: Legacy cleanup (remove `AnimateSpatialized2DElement` handler after JS SDK migration confirmed)
- [ ] picoOS Phase 7: Testing (unit + integration, targeting value parity with upstream Web RAF evaluator)
- [ ] Confirm JS SDK no longer emits `AnimateSpatialized2DElement` → picoOS can remove dual-listen shim
