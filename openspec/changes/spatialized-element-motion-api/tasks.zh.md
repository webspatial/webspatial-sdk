# 任务

## Phase 1 — Native AnimationObject

- [ ] `AnimationObject : SpatialObject` + `CreateSpatializedElementAnimation`
- [ ] create 时锁定 TimelineSampler + animating mask

## Phase 2 — Control + WebMsg

- [ ] `ControlSpatializedElementAnimation`
- [ ] `SpatialAnimationStateChanged`
- [ ] 移除 `AnimateSpatializedElementMotion`

## Phase 3 — Core

- [ ] `AnimationObject` + `SpatializedElement.createAnimation`
- [ ] 移除 `SpatializedMotionController` / Web RAF / NativePlaybackBackend

## Phase 4 — React

- [ ] `AnimationProxy` + bind 时 create / unmount destroy
- [ ] 无 native fail-fast；移除 Portal suppression

## Phase 5 — 验证

- [ ] test-server demos + 采样对齐测试
