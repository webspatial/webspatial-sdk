# Tasks — spatialized-element-motion-api

## Phase 0 — Umbrella spec (documentation)

- [x] Create change `spatialized-element-motion-api` with proposal, design, capability matrix
- [x] Add sub-specs: `spatialized-element-motion`, `spatialized-2d-motion`, `spatialized-static3d-motion`, `spatialized-entity-motion`
- [x] Label `spatial-div-motion-api` as 2D-only shipped scope in API.zh.md + motion spec

## Phase 1 — Unified naming + router

- [x] Export `Spatialized*` type aliases and `useSpatializedMotion({ kind })`
- [x] `SpatializedMotionController` alias / router to 2D controller
- [x] Document `useSpatialDivMotion` as 2D-specific alias

## Phase 2 — Static3D timeline

- [x] Core: `AnimateSpatializedStatic3DCommand` + `SpatializedStatic3DElement.animateMotion()`
- [x] Native: `Static3DMotionAnimationManager` + JSB listener
- [x] React: `Static3DMotionController`, Model `motion` binding, `useSpatializedMotion({ kind: 'static3d' })`

## Phase 3 — Entity timeline

- [x] Core: `timeline` on `AnimateTransformCommand`
- [x] Native: `EntityAnimationManager` timeline play path
- [x] React: `useDynamic3DMotion`, `useSpatializedMotion({ kind: 'dynamic3d' })`, `<Reality motion={…}>`
- [ ] Entity timeline (deferred — keep `useAnimation`)

## Phase 4 — Follow-ups (out of scope here)

- [ ] Deprecate remove `SpatialDiv*` public names
- [ ] `supports('useSpatializedMotion', [kind])` dedicated top-level token
- [ ] Web RAF for Static3D (if product requires)
