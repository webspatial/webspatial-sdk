# 空间化 Static3D 动画

## 新增需求

### Requirement: Static3D timeline 驱动容器根 transform 和 opacity

SDK MUST 支持 `SpatializedStatic3DElement` timeline 动画，将采样值应用到容器根 `transform`（translate/rotate/scale）和根 `opacity`，而不动画化模型内部字段。

Static3D 根 `opacity` 属于本次变更已交付的 timeline sink。开发者 MAY 继续设置元素自身的普通 `opacity`，而绑定到 `<Model>` 的 `xr-animation` MUST 通过 element animating mask 与终态 ownership handoff 规则保留这个字段。

Static3D timeline motion MUST NOT 驱动模型内部 `entityTransform` / `modelTransform` 播放字段。

目标态执行 MUST 在 `animation` 绑定到 `<Model>` 组件并解析为 `static3d` 时，通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject`。

#### Scenario: Native create 发送 timeline

- **GIVEN** `supports('useAnimation')` 为 true
- **WHEN** `CreateSpatializedElementAnimation` 为 `SpatializedStatic3DElement` 执行
- **THEN** native MUST 采样 timeline 并更新容器根 `transform` 和 `opacity`，直到完成或取消
- **AND** native MUST NOT 更新模型内部 `entityTransform` / `modelTransform`

#### Scenario: Static3D opacity tracks 被接受

- **WHEN** `xr-animation` binding 解析为 `static3d`，且归一化 timeline 包含 `opacity`
- **THEN** `validateSpatializedMotionConfig` MUST 在 `CreateSpatializedElementAnimation` 前接受该 config
- **AND** native MUST 收到这条 `opacity` track，而不是静默丢弃

#### Scenario: Model xr-animation binding

- **WHEN** `<Model xr-animation={binding} />` 接收来自 `useAnimation(config)` 的 `animation`，目标解析为 `static3d`
- **THEN** bind 前 play MAY 排队；bind 后 native 播放 MUST 通过 element animating mask 驱动容器根 `transform` / `opacity`，且不与 React 布局写入冲突

### Requirement: Clip 播放保持独立

#### Scenario: ref.play 不启动 timeline

- **WHEN** 应用调用 model ref `play()` 播放 USD clip
- **THEN** timeline `xr-animation` 会话 MUST NOT 被隐含启动；二者为独立 API
