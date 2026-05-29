# 空间化 Static3D 动画

## 新增需求

### Requirement: Static3D timeline 驱动 model 根 transform 和 opacity

SDK MUST 支持 `SpatializedStatic3DElement` timeline 动画，将采样值应用到 `modelTransform`（translate/rotate/scale）和 `opacity`，而不动画化空间化元素壳的布局字段。

实现 MUST 使用 `SpatializedMotionController`，当 `animation` 绑定到 `<Model>` 组件时解析为 `static3d` 目标（仅 native；无 Web RAF）。

#### Scenario: Native play 发送 timeline

- **GIVEN** `supports('useSpatializedMotion', ['static3d'])` 为 true
- **WHEN** `SpatializedStatic3DElement.animateMotion({ type: 'play', timeline })` 执行
- **THEN** native MUST 采样 timeline 并更新 `modelTransform` / `opacity` 直到完成或取消

#### Scenario: Model xr-animation binding

- **WHEN** `<Model motion={binding} />` 接收来自 `useSpatializedMotion(config)` 的 `animation`，目标解析为 `static3d`
- **THEN** bind 前 play MAY 排队；bind 后 native 播放 MUST 驱动 transform 而不与 React 布局写入冲突（抑制规则与 2D 类似）

### Requirement: Clip 播放保持独立

#### Scenario: ref.play 不启动 timeline

- **WHEN** 应用调用 model ref `play()` 播放 USD clip
- **THEN** timeline `xr-animation` 会话 MUST NOT 被隐含启动；二者为独立 API
