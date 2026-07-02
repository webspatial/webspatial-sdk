# 空间化 Entity 动画（timeline）

> **状态：推迟。** 容器动画（`SpatializedMotionController` / `useAnimation`）**不**包含 `kind: 'entity'`。Entity 动画当前继续通过 `useEntityAnimation` + `AnimateTransform`。以下需求在专项变更落地前为愿景性质。

## 新增需求

### Requirement: Entity timeline 使用 transform 属性路径

Entity timeline track MUST 使用 `position.x|y|z`、`rotation.x|y|z`、`scale.x|y|z`（rotation 单位为 degree）。它们 MUST NOT 使用 `transform.translate.*` 路径。

#### Scenario: 重叠轨道

- **GIVEN** `duration: 2`，`position.x` 0→10 linear，`scale.x` 1→2（从 1s 到 2s）
- **WHEN** `api.play()` 在 native 上完成
- **THEN** `t=1.5` 时 position.x MUST 在 0 到 10 之间，scale.x MUST 在 1 到 2 之间

### Requirement: AnimateTransform 接受 timeline payload

#### Scenario: 带 timeline 的 play

- **WHEN** `SpatialEntity.animateTransform({ type: 'play', timeline, entityId })` 被发送
- **THEN** native `EntityAnimationManager` MUST 逐轨采样插值并驱动 RealityKit transform（该次 play 忽略段 `from`/`to`）

### Requirement: 当前 Entity 入口上的 Segment API 保持有效

#### Scenario: segment play 不变

- **WHEN** `useEntityAnimation({ to: { position: … }, duration })` 不带 timeline 使用
- **THEN** 现有段行为 MUST 继续正常工作
