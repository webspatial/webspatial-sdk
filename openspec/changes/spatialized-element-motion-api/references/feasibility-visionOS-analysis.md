# visionOS feasibility analysis (AnimationObject target state)

> **Status:** Rewritten for `AnimationObject : SpatialObject` target state. Prior Entity comparison and Portal suppression analysis is obsolete.

## Conclusion

**Feasible.** Native already has `SpatializedElementMotionManager`, `TimelineSampler`, and `TransformAdapter`. Refactor focus:

1. Promote sessions to `AnimationObject : SpatialObject` (native-generated uuid)
2. Split JSB into `CreateSpatializedElementAnimation` + `ControlSpatializedElementAnimation`
3. Replace React Portal suppression with `SpatializedElement` animating mask
4. Use `SpatialAnimationStateChanged` WebMsg as sole state source

## Technical notes

| Item | Approach |
|------|----------|
| Frame driver | Keep `CADisplayLink` + `SpatializedElementMotionManager` |
| Timeline | Locked canonical tracks at create; align with Web evaluator |
| Writes | `TransformAdapter`: `elementTransform` / `modelTransform` |
| Conflicting JSB | Ignore `UpdateSpatializedElementTransform` while animating mask active |
| Destroy | Generic `DestroyCommand` |
| Web | No `useAnimation`; no Core RAF |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Migrate unified JSB to Create/Control | Medium | Phased rollout |
| 2D double-write without Portal suppression | Medium | Native mask before React path removal |
| config change requires destroy+recreate | Low | React Proxy; document clearly |

## Implementation order

See [tasks.md](../tasks.md) Phases 1–5.
