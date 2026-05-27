# 空间化 Dynamic3D 动画（Reality 容器）

## 新增需求

### Requirement: Dynamic3D timeline 驱动容器根 transform 和 opacity

SDK MUST 支持 `SpatializedDynamic3DElement` timeline 动画，将采样值应用到**容器**的 `element.transform` 和 `opacity`。子 `SpatialEntity` 节点 MUST 保持在局部空间中（随容器移动）。

实现 MUST 使用 `SpatializedMotionController`，`kind: 'dynamic3d'`（仅 native；无 Web RAF）。

#### Scenario: Native play 发送 timeline

- **GIVEN** `supports('useSpatializedMotion', ['dynamic3d'])` 为 true
- **WHEN** `SpatializedDynamic3DElement.animateMotion({ type: 'play', timeline })` 执行
- **THEN** native MUST 采样 timeline 并更新容器 transform / opacity 直到完成或取消

#### Scenario: Reality motion binding

- **WHEN** `<Reality motion={binding} />` 从 `useSpatializedMotion({ kind: 'dynamic3d' })` 接线
- **THEN** bind 前 play MAY 排队；bind 后 native 播放 MUST 驱动 Reality 根而不与 React transform 写入冲突（抑制与 2D 类似）

### Requirement: Entity 动画保持独立

#### Scenario: Entity 的 useAnimation 不是容器动画

- **WHEN** 开发者通过 `useAnimation` 动画化子 `Entity`
- **THEN** 该操作 MUST NOT 使用 `SpatializedMotionController`；entity 栈保持不变
