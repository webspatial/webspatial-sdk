## 背景

本变更为三种空间化容器 kind 定义声明式 motion：

- `spatialized2d`，基于 `Spatialized2DElement`
- `static3d`，基于 `SpatializedStatic3DElement`
- `dynamic3d`，基于 `SpatializedDynamic3DElement`

三者共享同一套 authoring 模型和同一套 canonical `tracks` 执行模型，但在 React 接入点和 native 写入路径上不同。Entity 动画保持独立栈，不属于本目标态设计。

## 设计演进

### Plan A 奠基

Plan A 留下了在本设计中仍然保持规范性的基础原语：

- 会话生命周期和播放状态
- native 控制播放期间的 animation-owned 字段 mask
- native 逐帧采样语义
- 生命周期回调互斥
- 以 `from` 和 `to` 表示的单段 authoring 便利形状

### Plan B 泛化

Plan B 引入了通用 timeline 模型：

- 按属性拆分的 canonical `tracks`
- 以 `style` 作为唯一的 React merge outlet
- 通过 `xr-animation` 在绑定时解析目标

目标态有意不再保留 Web RAF backend 作为播放路径。纯 Web runtime 对 spatialized 目标的 `useAnimation` capability 返回 false。

### 统一目标态

本设计将它们整合为单一的三层架构：

- `React SDK` 定义 authoring、binding 和 React `AnimationBinding`
- `Core SDK` 定义 `SpatializedElement.createAnimation(config)`、`AnimationObject : SpatialObject`、config validation / normalization，以及直接的 NativeWebMsg 状态订阅
- `Native Runtime` 定义 native `AnimationObject : SpatialObject`、`SpatializedElementAnimationManager`、目标特定的播放和写入

## 目标

- 为 2D、Static3D、Dynamic3D 容器 motion 提供统一的 authoring API
- 为所有执行路径提供统一的 canonical timeline 模型
- 为所有 kind 提供统一的 playback API 和回调契约
- 明确区分 React binding、Core AnimationObject 和 Native playback 三层职责
- 显式说明跨层契约，降低模块职责理解成本

## AnimationObject 实现架构

目标实现分为 React SDK、Core SDK 和 native runtime 三层：

- React SDK 持有 `AnimationBinding`，由 `useAnimation(config)` 创建。它负责保存 config、bind 前命令排队，并且只在 `xr-animation` 解析到具体 `SpatializedElement` target 后创建 Core `AnimationObject`。
- Core SDK 持有 `AnimationObject extends SpatialObject`。它直接暴露 `play/pause/resume/stop/reset/finish`，继承 `destroy()`，订阅 `NativeWebMsg`，按 native uuid 过滤 `SpatialAnimationStateChanged`，并更新自身可观察状态。
- visionOS 持有 native `AnimationObject extends SpatialObject` 和 `SpatializedElementAnimationManager`。manager 负责 native animation 注册、create/control lookup、element destroy 级联清理、animating mask 协调，以及 `SpatialAnimationStateChanged` 发送。

完整类图、时序图和现有 visionOS motion 实现迁移说明见 `references/animation-object-architecture.zh.md`。

## Core SDK 模块边界

| 模块 | 职责 |
|------|------|
| `SpatializedElement.createAnimation(config)` | 绑定 target 后创建 native-backed `AnimationObject`，负责 validation、normalization 和 create JSB。 |
| `AnimationObject` | Core 一等对象，继承 `SpatialObject`，直接实现播放控制，直接订阅 NativeWebMsg 并维护自身状态。 |
| `validateSpatializedMotionConfig` | 在 native create 前校验 authoring config，例如 Static3D `opacity` tracks 必须 reject。 |
| `motionConfigToAnimationTimeline` | 将归一化后的 motion config 编译为 canonical `CreateSpatializedElementAnimation` payload。 |
| `evaluateMotionTimeline` | 仅用于 validation、测试夹具或显式非 runtime 工具；目标态 playback 不依赖 Core/Web RAF sampler。 |
| `ELEMENT_ANIMATING_MASK_POLICIES` | 编码每种 kind 的 animation-owned 字段 mask 行为和 terminal handoff 规则。 |

目标态不引入公开的 `AnimationObjectChannel`、`AnimationObjectBridge` 或 `SpatialObjectBridge` 架构对象。底层 JSB/WebMsg 能力应作为 `SpatialObject` / `AnimationObject` 的实现细节存在。
