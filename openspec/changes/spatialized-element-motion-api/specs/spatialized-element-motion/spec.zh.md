# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义绑定时目标解析的声明式动画

平台 MUST 为以下目标文档化和实现声明式 timeline 动画：`spatialized2d`、`static3d`、`dynamic3d`。每个目标 MUST 有子 spec 定义属性白名单、native 后端和 React 集成。公开 hook MUST NOT 需要 `config.kind`；目标在返回的 `animation` binding 作为 `motion` prop 传给组件时自动解析（`<div enable-xr>` → spatialized2d、`<Model>` → static3d、`<Reality>` → dynamic3d）。`SpatialEntity` transform timeline 不在本伞式范围内（使用现有 `useAnimation`）。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的已交付 vs 计划状态

### Requirement: 共享的播放 API 形状

支持声明式动画的所有 kind MUST 暴露 `SpatializedPlaybackApi`（`play`、`pause`、`resume`、`cancel`、`playState`、`isAnimating`、`isPaused`、`finished`）。Kind MAY 在后端允许时支持选择性 `pause(keys?)`。

#### Scenario: 播放 API 与绑定目标无关

- **WHEN** 开发者从 `useSpatializedMotion(config)` 获得 motion 元组
- **THEN** 返回的 `api` MUST 暴露 `play`、`pause`、`resume`、`cancel`、`playState`、`isAnimating`、`isPaused`、`finished`，无论 `animation` 后续绑定到哪个组件

### Requirement: 统一配置接受 from/to 或 tracks（互斥）

Hook MUST 接受两种互斥配置形状之一：

1. **段配置**（推荐默认）：`{ from, to, duration, timingFunction? }`
2. **Timeline 配置**（高级）：`{ duration, tracks: [{ property, keyframes: [{ at, value }], easing? }] }`

在同一配置对象中同时传递 `from`/`to` 和 `tracks` MUST 是类型错误（判别联合）。内部实现中，段配置 MUST 编译为 tracks（每个动画标量一条 track，keyframe 在 `at: 0` 和 `at: duration`）。

所有 kind MUST 在两种配置形状中使用视觉 transform 路径（`transform.translate.*`、`opacity` 等）。

#### Scenario: from/to 编译为 tracks

- **WHEN** 开发者传入 `{ from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5 }`
- **THEN** SDK MUST 内部编译为单条 track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 1 }] }` 后再执行

#### Scenario: tracks 配置直接执行

- **WHEN** 开发者传入 `{ duration, tracks: [...] }`
- **THEN** SDK MUST 直接执行 tracks 而无需变换

#### Scenario: 共享配置形状与目标无关

- **WHEN** 开发者提交相同配置（from/to 或 tracks），且结果 `animation` 绑定到 `<div enable-xr>`、`<Model>` 或 `<Reality>` 中的任何一个
- **THEN** 校验 MUST 在目标特定播放开始前接受相同的配置结构

### Requirement: 单一 Core 控制器实现

SDK MUST 以一个 `SpatializedMotionController` 类（按绑定目标参数化，`animation` 挂载到组件时解析）实现容器动画。按目标的控制器类别名 MUST NOT 作为公共 API 的一部分。

#### Scenario: React 单一 hook + 绑定时解析

- **WHEN** 开发者调用 `useSpatializedMotion(config)` 并将 `animation` 通过 `motion` prop 传给组件
- **THEN** SDK MUST 从组件类型解析目标，路由到匹配目标策略的同一控制器实现

### Requirement: Model 上 clip 播放独立

`SpatializedStatic3DElement` 上的 USD 内嵌动画（model ref 的 `play`/`pause`）MUST 保持为独立于 transform timeline `motion.play()` 的 API。

#### Scenario: Model clip 播放不占用 motion api

- **WHEN** 开发者在 `<Model>` 上调用 `ref.play()`
- **THEN** motion 元组 API MUST 保持独立，MUST NOT 被 clip 播放调用所暗示

### Requirement: 目标在绑定时解析

公开 hook `useSpatializedMotion(config)` MUST NOT 要求 config 中有 `kind` 字段。返回的 `animation` binding MUST 携带延迟目标。目标解析 MUST 在 binding 作为 `motion` prop 传给组件时发生：

| 组件 | 解析目标 |
|------|---------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` |
| `<Model>` | `static3d` |
| `<Reality>` | `dynamic3d` |

#### Scenario: 绑定到 enable-xr 解析为 2D

- **WHEN** `useSpatializedMotion(config)` 返回的 `animation` 作为 `motion` 传给 `<div enable-xr>`
- **THEN** SDK MUST 将目标解析为 `spatialized2d` 并激活 2D 策略（Web RAF + native）

#### Scenario: 绑定到 Model 解析为 static3d

- **WHEN** `animation` 作为 `motion` 传给 `<Model>`
- **THEN** SDK MUST 将目标解析为 `static3d` 并激活仅 native 策略

#### Scenario: 绑定到 Reality 解析为 dynamic3d

- **WHEN** `animation` 作为 `motion` 传给 `<Reality>`
- **THEN** SDK MUST 将目标解析为 `dynamic3d` 并激活仅 native 策略

#### Scenario: 单绑定约束

- **WHEN** 同一 `animation` binding 同时传给多个组件
- **THEN** SDK MUST 抛错或警告，仅第一次绑定 MUST 生效

#### Scenario: 绑定前播放排队

- **WHEN** 在 `animation` 绑定到任何组件之前调用 `api.play()`
- **THEN** play 命令 MUST 被排队，目标解析后执行
