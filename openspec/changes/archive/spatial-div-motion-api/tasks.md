## 1. OpenSpec and comparison (this branch)

- [x] 1.1 Create `spatial-div-motion-api` change with `proposal.md`, `proposal.zh.md`, `COMPARISON.md`
- [x] 1.2 Write `design.md` and `specs/spatial-div-motion/spec.md`
- [x] 1.3 Branch `proposal/spatial-div-motion-timeline` from session implementation branch

## 2. Core types and Web backend (Phase 1)

- [x] 2.1 Add `packages/core/src/types/spatialDivMotion.ts` (timeline types, property paths)
- [x] 2.2 Export motion types from `@webspatial/core-sdk`
- [x] 2.3 Implement `evaluateMotionTimeline`, `valuesToMotionStyle`, validation in react package
- [x] 2.4 Implement `useSpatializedMotion` + `useSpatializedMotion.simple` with Web RAF backend
- [x] 2.5 Export `useSpatializedMotion` from `@webspatial/react-sdk`
- [x] 2.6 Unit tests: multi-track evaluation, overlap scenario, simple sugar

## 3. Test server comparison demos

- [x] 3.1 Add `/spatial-div-motion` hub linking Plan A routes vs Plan B
- [x] 3.2 Add `/spatial-div-motion/multi-track` canonical 0–5s / 3–5s demo
- [x] 3.3 Link from `/animate` page

## 4a. Native segment backend (Phase 2a — no Swift)

Spec: [PHASE2-MINIMAL-NATIVE.md](./PHASE2-MINIMAL-NATIVE.md)

- [x] 4a.1 `motionConfigToNativeSegment` + tests
- [x] 4a.2 Extract `nativeSession.ts` from `useSpatialDivAnimation`
- [x] 4a.3 `useSpatializedMotion`: native gate, bind, suppression, stop RAF when native runs
- [x] 4a.4 `motion` prop binding in `PortalSpatializedContainer`
- [x] 4a.5 Wire `simple-entrance` + manual AVP check

## 4b. Native timeline backend (Phase 2b)

Spec: [specs/spatial-div-motion-native-timeline/spec.md](./specs/spatial-div-motion-native-timeline/spec.md)

- [x] 4b.1 Extend `AnimateSpatialDivCommand` + `SpatialDivMotionTimeline` on bridge (core types, JSB)
- [x] 4b.2 `motionConfigToNativeTimeline` + hook branch when not segment-equivalent
- [x] 4b.3 `TimelineEvaluator` in `SpatialDivAnimationSession.swift` (DisplayLink sampling)
- [x] 4b.4 Portal suppression + `motion` binding for timeline sessions (reuse 4a)
- [x] 4b.5 Unit parity: Web `evaluateMotionTimeline` + Swift `SpatialDivTimelineEvaluator` (canonical multi-track)
- [x] 4b.5b Simulator e2e: `tests/ci-test/src/specs/spatial-div-motion.spec.tsx` (canonical translate.x advances)

## 5. Product decision

- [ ] 5.1 Design review using `COMPARISON.md` + recorded demos
- [ ] 5.2 Decide: adopt motion API, keep session API, or deprecate session path
