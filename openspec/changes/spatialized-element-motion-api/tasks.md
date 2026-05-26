# Tasks — spatialized-element-motion-api

## Phase 0 — Umbrella spec (documentation)

- [x] Create change `spatialized-element-motion-api` with proposal, design, capability matrix
- [x] Add sub-specs: `spatialized-element-motion`, `spatialized-2d-motion`, `spatialized-static3d-motion`, `spatialized-entity-motion` (entity deferred)
- [x] Label `spatial-div-motion-api` as 2D-only shipped scope in API.zh.md + motion spec

## Phase 1 — Unified naming + router (React)

- [x] Export `Spatialized*` type aliases and `useSpatializedMotion({ kind })`
- [x] Remove per-kind React hook aliases; public API is only `useSpatializedMotion` / `.simple`
- [x] Shared React internals: `useMotionController`, `createMotionBinding`, `createPlaybackApi`

## Phase 2 — Static3D + Dynamic3D native timelines

- [x] Core: `SpatializedStatic3DElement.animateMotion()` / `SpatializedDynamic3DElement.animateMotion()` via unified `AnimateSpatializedElementMotion`
- [x] Native: `SpatializedContainerMotionAnimationManager` + single JSB listener `AnimateSpatializedElementMotion` (`targetKind`: static3d | dynamic3d)
- [x] React: Model / Reality `motion` binding; `useSpatializedMotion({ kind: 'static3d' | 'dynamic3d' })`
- [x] test-server demos under **Spatialized Motion** (`model-container`, `reality-container`)

## Phase 3 — Core + React consolidation (single controller)

- [x] `SpatializedMotionController` — one implementation, `MOTION_KIND_POLICIES` per kind
- [x] `motionElementBridge` — `animateSpatialDiv` vs `animateMotion` dispatch
- [x] Thin subclasses: `SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`
- [x] `SpatializedMotionHandle` implemented by unified controller
- [x] OpenSpec design / API.zh / tasks aligned with consolidated architecture

## Phase 4 — Entity timeline (deferred)

- [ ] Entity transform timeline via existing `useAnimation` / `AnimateTransform` (not `SpatializedMotionController`)
- [ ] Sub-spec `spatialized-entity-motion` remains informational only until product prioritizes

## Phase 5 — Native consolidation + public surface cleanup

- [x] Merge native Swift Static3D/Dynamic3D managers → `SpatializedContainerMotionAnimationManager` + `SpatializedMotionTransformSink`
- [x] Unified JSB `AnimateSpatializedElementMotion` + `targetKind` only (removed `AnimateSpatializedStatic3DElement` / `AnimateSpatializedDynamic3DElement`)
- [ ] Merge 2D into `AnimateSpatializedElementMotion` (`targetKind: spatialized2d`) — deferred; keep `AnimateSpatialized2DElement` for now
- [x] Remove deprecated Core controller class aliases (`SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`)
- [x] `supports('useSpatializedMotion', [kind])` top-level capability (mirrors `useAnimation` element/static3d/dynamic3d flags)
- [ ] Web RAF for Static3D / Dynamic3D (deferred — product requires native-only for 3D containers)
