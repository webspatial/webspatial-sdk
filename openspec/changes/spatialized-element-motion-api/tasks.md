# Tasks — spatialized-element-motion-api (AnimationObject target state)

## Phase 1 — Native AnimationObject

- [ ] Native: `AnimationObject : SpatialObject` 注册表对象
- [ ] Native: `CreateSpatializedElementAnimation` JSB listener；uuid 由 native 生成
- [ ] Native: create 时编译并锁定 `TimelineSampler`
- [ ] Native: `SpatializedElement` animating mask（transform / opacity）
- [ ] Native: 播放中忽略冲突 `UpdateSpatializedElementTransform` 等 JSB

## Phase 2 — Native control + WebMsg

- [ ] Native: `ControlSpatializedElementAnimation` JSB（play / pause / resume / stop / reset / finish）
- [ ] Native: `SpatialAnimationStateChanged` WebMsg 广播（`animationId` + `action` + `values`）
- [ ] Native: `destroy` 走通用 `DestroyCommand`；清理 session + mask
- [ ] Native: 移除目标态 `AnimateSpatializedElementMotion` 路径

## Phase 3 — Core AnimationObject

- [ ] Core: `AnimationObject extends SpatialObject`
- [ ] Core: `SpatializedElement.createAnimation(config)` → Create JSB → 返回句柄
- [ ] Core: `AnimationObject` 播放方法 → Control JSB
- [ ] Core: 订阅 `SpatialAnimationStateChanged`；native 为 playState 唯一来源
- [ ] Core: 移除 `SpatializedMotionController`、`NativePlaybackBackend`、`WebPlaybackBackend`
- [ ] Core: 移除 `executeAnimateSpatializedElementMotion`、`AnimateSpatializedElementMotionJSBCommand`

## Phase 4 — React SDK

- [ ] React: `AnimationProxy` — bind 前 API 排队
- [ ] React: bind 时 `createAnimation`；unmount 时 `destroy`
- [ ] React: config 变更 → destroy + recreate（无热更新）
- [ ] React: 无 native 时 `useAnimation` fail-fast
- [ ] React: 移除 Portal suppression / `resolveMotionStyle` motion 主路径

## Phase 5 — Cleanup & validation

- [ ] 更新 test-server demos
- [ ] Native / Core 采样对齐测试（hold、easing、transform 顺序）
- [ ] 文档与 CAPABILITY_MATRIX 与实现一致

## Removed from target state (do not implement)

- `AnimateSpatializedElementMotion` 合一 JSB
- JS 侧 `animationId` 生成
- `updateConfig` 热更新已锁定 timeline
- Web RAF / `WebPlaybackBackend`
- PortalInstanceObject motion suppression
- Entity animation（本 change 范围外）
