# 空间化 Dynamic3D 动画（Reality 容器）

## 新增需求

### Requirement: Dynamic3D timeline 驱动容器根 transform 和 opacity

SDK MUST 支持 `SpatializedDynamic3DElement` timeline 动画，将采样值应用到**容器**的 `element.transform` 和 `opacity`。子 `SpatialEntity` 节点 MUST 保持在局部空间中（随容器移动）。

目标态执行 MUST 在 `animation` 绑定到 `<Reality>` 组件并解析为 `dynamic3d` 时，通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject`。

#### Scenario: Native create 发送 timeline

- **GIVEN** `supports('useAnimation')` 为 true
- **WHEN** `CreateSpatializedElementAnimation` 为 `SpatializedDynamic3DElement` 执行
- **THEN** native MUST 采样 timeline 并更新容器 transform / opacity 直到完成或取消

#### Scenario: Reality xr-animation binding

- **WHEN** `<Reality xr-animation={binding} />` 接收来自 `useAnimation(config)` 的 `animation`，目标解析为 `dynamic3d`
- **THEN** bind 前 play MAY 排队；bind 后 native 播放 MUST 通过 element animating mask 驱动 Reality 根，且不与 React transform 写入冲突

### Requirement: Entity 动画保持独立

#### Scenario: Entity 的 useEntityAnimation 不是容器动画

- **WHEN** 开发者通过 `useEntityAnimation` 动画化子 `Entity`
- **THEN** 该操作 MUST NOT 使用容器 `AnimationObject`；entity 栈保持不变
