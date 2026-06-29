# 空间化 Static3D 动画

## 新增需求

### Requirement: Static3D timeline 仅驱动 model 根 transform

SDK MUST 支持 `SpatializedStatic3DElement` timeline 动画，将采样值应用到 `modelTransform`（translate/rotate/scale），而不动画化空间化元素壳的布局字段。

Static3D 根 `opacity` 不属于本次变更已交付的 timeline sink。开发者 MAY 继续设置元素自身的普通 `opacity`，但绑定到 `<Model>` 的 `xr-animation` MUST 在 `validateSpatializedMotionConfig` 阶段拒绝 opacity tracks；MUST NOT 静默忽略。

目标态执行 MUST 在 `animation` 绑定到 `<Model>` 组件并解析为 `static3d` 时，通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject`。

#### Scenario: Native create 发送 timeline

- **GIVEN** `supports('useAnimation')` 为 true
- **WHEN** `CreateSpatializedElementAnimation` 为 `SpatializedStatic3DElement` 执行
- **THEN** native MUST 采样 timeline 并更新 `modelTransform` 直到完成或取消

#### Scenario: Static3D opacity tracks 被拒绝

- **WHEN** `xr-animation` binding 解析为 `static3d`，且归一化 timeline 包含 `opacity`
- **THEN** `validateSpatializedMotionConfig` MUST 在 `CreateSpatializedElementAnimation` 前拒绝该 config
- **AND** native MUST NOT 收到已静默忽略 Static3D opacity tracks 的 timeline

#### Scenario: Model xr-animation binding

- **WHEN** `<Model xr-animation={binding} />` 接收来自 `useAnimation(config)` 的 `animation`，目标解析为 `static3d`
- **THEN** bind 前 play MAY 排队；bind 后 native 播放 MUST 通过 element animating mask 驱动 transform，且不与 React 布局写入冲突

### Requirement: Clip 播放保持独立

#### Scenario: ref.play 不启动 timeline

- **WHEN** 应用调用 model ref `play()` 播放 USD clip
- **THEN** timeline `xr-animation` 会话 MUST NOT 被隐含启动；二者为独立 API
