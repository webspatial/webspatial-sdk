# Tasks — spatialized-element-motion-api

## Phase 0 — Umbrella spec (documentation)

- [x] Create change `spatialized-element-motion-api` with proposal, design, capability matrix
- [x] Add sub-specs: `spatialized-element-motion`, `spatialized-2d-motion`, `spatialized-static3d-motion`, `spatialized-entity-motion` (entity deferred)
- [x] Label `spatial-div-motion-api` as 2D-only shipped scope in API.zh.md + motion spec

## Phase 1 — Unified naming + router (React)

- [x] Export `Spatialized*` type aliases and `useSpatializedMotion({ kind })`
- [x] Document `useSpatialDivMotion` / `useStatic3DMotion` / `useDynamic3DMotion` as `@deprecated` aliases
- [x] Shared React internals: `useMotionController`, `createMotionBinding`, `createPlaybackApi`

## Phase 2 — Static3D + Dynamic3D native timelines

- [x] Core: `AnimateSpatializedStatic3DCommand` + `SpatializedStatic3DElement.animateMotion()`
- [x] Core: `AnimateSpatializedDynamic3DCommand` + `SpatializedDynamic3DElement.animateMotion()`
- [x] Native: `Static3DMotionAnimationManager` + `Dynamic3DMotionAnimationManager` in Xcode target + JSB listeners
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

## Phase 5 — Follow-ups (out of scope here)

- [ ] Merge native Swift managers behind shared `TransformSink` (Static3D `modelTransform` vs element `transform`)
- [ ] Optional unified JSB `AnimateSpatializedElementMotion` + `targetKind`
- [ ] Remove deprecated public aliases (`useSpatialDivMotion`, per-kind controller class names)
- [ ] `supports('useSpatializedMotion', [kind])` dedicated top-level token
- [ ] Web RAF for Static3D / Dynamic3D (if product requires)
