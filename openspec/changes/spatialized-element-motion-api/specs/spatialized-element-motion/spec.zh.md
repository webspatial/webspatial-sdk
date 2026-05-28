# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义绑定时目标解析的声明式动画

平台 MUST 为以下目标文档化和实现声明式 timeline 动画：`spatialized2d`、`static3d`、`dynamic3d`。每个目标 MUST 有子 spec 定义属性白名单、native 后端和 React 集成。公开 hook MUST NOT 需要 `config.kind`；目标在返回的 `animation` binding 作为 `motion` prop 传给组件时自动解析（`<div enable-xr>` → spatialized2d、`<Model>` → static3d、`<Reality>` → dynamic3d）。`SpatialEntity` transform timeline 不在本伞式范围内（使用现有 `useAnimation`）。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的已交付 vs 计划状态

### Requirement: 共享的播放 API 形状

支持声明式动画的所有 kind MUST 暴露 `SpatializedPlaybackApi`（`play`、`pause`、`resume`、`cancel`、`playState`、`isAnimating`、`isPaused`、`finished`）。Kind MAY 在后端允许时支持选择性 `pause(keys?)`。

### Requirement: Timeline 配置形状

所有 kind MUST 接受共享的 timeline 结构：全局 `duration` + `tracks[]`，含 `property`、`keyframes[{ at, value }]`、可选每轨 `easing`。2D、Static3D、Dynamic3D MUST 使用视觉 transform 路径（`transform.translate.*`、`opacity` 等）。

### Requirement: 单一 Core 控制器实现

SDK MUST 以一个 `SpatializedMotionController` 类（按绑定目标参数化，`animation` 挂载到组件时解析）实现容器动画。按目标的控制器类别名 MUST NOT 作为公共 API 的一部分。

#### Scenario: React 单一 hook + 绑定时解析

- **WHEN** 开发者调用 `useSpatializedMotion(config)` 并将 `animation` 通过 `motion` prop 传给组件
- **THEN** SDK MUST 从组件类型解析目标，路由到匹配目标策略的同一控制器实现

### Requirement: Model 上 clip 播放独立

`SpatializedStatic3DElement` 上的 USD 内嵌动画（model ref 的 `play`/`pause`）MUST 保持为独立于 transform timeline `motion.play()` 的 API。
