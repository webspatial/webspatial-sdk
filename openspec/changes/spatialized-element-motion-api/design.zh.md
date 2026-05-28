## 背景

三个 `SpatializedElement` 子类共享场景定位，但使用**不同的 native 写入路径**。Timeline 评估器、会话状态机和 Portal 抑制逻辑在 TypeScript 中共享；native 将采样结果应用到 `element.transform`（2D / Dynamic3D）或 `modelTransform`（Static3D）。Entity 动画保持**独立**栈（`useAnimation` + `EntityAnimationManager`）。

本设计统一了**面向开发者**的配置（`SpatializedMotionConfig`、`SpatializedSegmentConfig`、`SpatializedPlaybackApi`），并通过 **`kind`** 路由到单一 Core 控制器和单一 React hook。

## 设计演进

### Plan A（会话动画）— 奠基

Plan A 确立了架构原语：
- **会话状态机**：idle → queued → delaying → running → paused → finished/canceled
- **Portal 抑制**：opacity 属性级、transform 字段整体级
- **Native 播放模型**：visionOS 上 CADisplayLink 驱动的逐帧采样
- **生命周期契约**：onStart/onComplete/onCancel/onError 互斥
- **段插值**：单次 `from`/`to` + timing function

这些在统一系统中保持规范性。

### Plan B（Motion Timeline）— 泛化

Plan B 扩展了架构：
- **Timeline 数据模型**：按属性的 track + 绝对时间 keyframe（灵感来自 Three.js AnimationClip）
- **双后端**：native 不可用时 Web RAF，WebSpatial 运行时走 native timeline
- **Style outlet**：回传给业务侧、用于 React 状态驱动渲染的 `style` 对象；Plan B 同时将 binding 从 `animation` 更名为 `motion`
- **多 kind 支持**：基于策略的路由，覆盖 spatialized2d / static3d / dynamic3d

### 统一架构（本设计）

合并将两者整合为单一规范系统，同时保持向后兼容。

## 目标

- 2D / Static3D / Dynamic3D 三种容器 kind 共享一种 timeline 配置形状。
- **一个** Core 实现：`SpatializedMotionController`（按 `kind` 策略）+ 各 element 类上的 `element.motion(config)`。
- **一个** React 入口：`useSpatializedMotion({ kind, … })` 和 `useSpatializedMotion.simple({ kind, … })`。
- 旧版 `useAnimation` + `animation` prop 作为 2D 废弃路径保留。
- 伞式 spec + 按 kind 子 spec；2D 为 Web RAF + 抑制行为的参考。

## 架构

```mermaid
flowchart TB
  Hook[useSpatializedMotion]
  Hook --> K2D[kind spatialized2d]
  Hook --> K3D[kind static3d]
  Hook --> KD3[kind dynamic3d]
  K2D --> Core[SpatializedMotionController]
  K3D --> Core
  KD3 --> Core
  Core --> Bridge[motionElementBridge]
  Bridge --> N2D[SpatialDivAnimationManager]
  Bridge --> N3D[SpatializedContainerMotionAnimationManager + TransformSink]
  
  subgraph Legacy[旧版路径 - 已废弃]
    LegacyHook[useAnimation] --> LegacyBinding[animation prop]
    LegacyBinding --> N2D
  end
```

## Core 模块

| 模块 | 角色 |
|------|------|
| `SpatializedMotionController` | 单一 TS 控制器；`MOTION_KIND_POLICIES` 按 kind 选择能力 token、Web RAF vs 仅 native、被抑制字段 |
| `motionElementBridge` | 分发 `animateSpatialDiv` vs `animateMotion` + 监听器清理 |
| `element.motion(config)` | 各 `Spatialized*Element` 上的工厂；返回匹配 `kind` 的 `SpatializedMotionController` |
| `evaluateMotionTimeline` | 共享 Web 评估器：逐轨采样、easing、lerp |
| `SpatialDivTimelineEvaluator`（Swift） | Native 对等评估器：逐轨 90Hz 采样（CADisplayLink） |
| `SpatializedMotionTransformSink` | 抽象写入路径（elementTransform vs modelTransform），用于 Static3D/Dynamic3D |

## React 模块

| 模块 | 角色 |
|------|------|
| `useSpatializedMotion` | 公共 hook（`kind` 判别 + `.simple`） |
| `useMotionController` + `createMotionBinding` + `createPlaybackApi` | 共享接线 |

## 共享类型（Core）

- `spatializedVisual.ts` — 值 + transform 分量
- `spatializedMotion.ts` — timeline、segment、playback API、play state、`SpatializedMotionKind`
- `spatializedPlayback.ts` — 错误

## 集成矩阵

| Kind | React outlet | 绑定 prop | Native 写入路径 | Web RAF |
|------|--------------|-----------|----------------|---------|
| 2D | `style` | `motion` 在 `enable-xr` 节点上 | `element.transform` + opacity + DOM | 有 |
| Static3D | _（无 — native 驱动视图）_ | `motion` 在 `<Model>` 上 | `modelTransform` + opacity | 无 |
| Dynamic3D | _（无）_ | `motion` 在 `<Reality>` 上 | `element.transform` + opacity | 无 |

## 旧版兼容

Plan A 路径（`useAnimation` + `animation` prop）作为薄兼容层保留：

1. 用于 SpatialDiv 的 `useAnimation(config)` 继续正常工作。
2. 内部实现中，简单配置 MAY 被编译为相同的 native 段命令。
3. `animation` prop 路径不使用 `SpatializedMotionController`；保留自有会话管理。
4. 新代码 SHOULD 使用 `useSpatializedMotion.simple()`，提供相同的单段体验。

## Portal 抑制（统一规则）

| 被动画字段 | 抑制范围 | 释放触发 |
|-----------|---------|---------|
| `opacity` | 属性级：仅 `opacity` 同步被抑制 | 会话终态（finished/canceled） |
| 任何 `transform.*` | Transform 整体级：整个 `updateTransform(matrix)` 被抑制 | 会话终态 |

抑制同时适用于旧版 `animation` prop 会话和 `motion` binding 会话。

## Native Timeline 评估

Native MUST 在 timeline 时间 `t`（秒，经 `delay` 和 `playbackRate` 处理后）独立采样每个 track，以固定顺序（translate → rotate → scale）组合 transform，产生与 Web 评估器在容差内一致的结果（translate ±0.5 px，opacity/scale ±0.01）。

## 分阶段交付

见 [tasks.md](./tasks.md)。概要：
- Phase 0–1：伞式 spec + 统一命名（已完成）
- Phase 2：Static3D + Dynamic3D native timelines（已完成）
- Phase 3：Core + React 合并（已完成）
- Phase 4：Entity timeline（推迟）
- Phase 5：Native 合并（已完成）
- Phase 6：统一 JSB + 类型重命名（已完成）
- Phase 7：Spec 合并（本次提交）