# AnimationObject 设计审查 TODO

> 目标态：`AnimationObject : SpatialObject` + `createAnimation` 锁定 timeline + 仅 native + Element animating mask

## Core

- [ ] `SpatializedElement.createAnimation(config)` 实现
- [ ] `AnimationObject extends SpatialObject` 实现
- [ ] 移除 `SpatializedMotionController` 及双 Backend
- [ ] `SpatialAnimationStateChanged` 订阅与 playState 同步

## Native

- [ ] `AnimationObject : SpatialObject` 注册
- [ ] `CreateSpatializedElementAnimation` / `ControlSpatializedElementAnimation` JSB
- [ ] Element animating mask；播放中忽略冲突 transform JSB
- [ ] 移除 `AnimateSpatializedElementMotion`

## React

- [ ] `AnimationProxy` bind 前排队
- [ ] config 变更 destroy + recreate
- [ ] 无 native fail-fast
- [ ] 移除 Portal suppression 主路径

## 协议

- [ ] timeline 仅在 create 提交
- [ ] uuid 仅由 native 生成
- [ ] destroy 走通用 `DestroyCommand`
