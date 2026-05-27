# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义按 kind 的声明式动画

平台 MUST 为以下 kind 文档化和实现声明式 timeline 动画：`spatialized2d`、`static3d`、`dynamic3d`。每种 kind MUST 有子 spec 定义属性白名单、native 后端和 React 集成。`SpatialEntity` transform timeline 不在本伞式范围内（使用现有 `useAnimation`）。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的已交付 vs 计划状态

### Requirement: 共享的播放 API 形状

支持声明式动画的所有 kind MUST 暴露 `SpatializedPlaybackApi`（`play`、`pause`、`resume`、`cancel`、`playState`、`isAnimating`、`isPaused`、`finished`）。Kind MAY 在后端允许时支持选择性 `pause(keys?)`。

### Requirement: Timeline 配置形状

所有 kind MUST 接受共享的 timeline 结构：全局 `duration` + `tracks[]`，含 `property`、`keyframes[{ at, value }]`、可选每轨 `easing`。2D、Static3D、Dynamic3D MUST 使用视觉 transform 路径（`transform.translate.*`、`opacity` 等）。

### Requirement: 单一 Core 控制器实现

SDK MUST 以一个 `SpatializedMotionController` 类（按 `SpatializedMotionKind` 参数化）实现容器动画。按 kind 的控制器类别名 MUST NOT 作为公共 API 的一部分。

#### Scenario: React 单一 hook

- **WHEN** 开发者调用 `useSpatializedMotion({ kind, … })`
- **THEN** SDK MUST 路由到匹配 kind 策略的同一控制器实现

### Requirement: Model 上 clip 播放独立

`SpatializedStatic3DElement` 上的 USD 内嵌动画（model ref 的 `play`/`pause`）MUST 保持为独立于 transform timeline `motion.play()` 的 API。
