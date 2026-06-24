## 背景和目标

本变更为三种空间化容器 kind 定义声明式 motion：

- `spatialized2d`，基于 `Spatialized2DElement`
- `static3d`，基于 `SpatializedStatic3DElement`
- `dynamic3d`，基于 `SpatializedDynamic3DElement`

三者共享同一套 authoring 模型和 canonical `tracks` 执行模型，但在 React 绑定入口和 native 写入路径上不同。Entity 动画保持独立栈，不属于本设计范围。

目标态保留早期 motion 设计中的 playback lifecycle、native frame sampling、animation-owned mask、terminal callback 语义和 `from` / `to` authoring；同时采用 canonical `tracks` timeline、`xr-animation` bind-time target resolution 和 React `style` outlet。

目标态不保留 Web RAF backend。纯 Web runtime 对 spatialized targets 的 `useAnimation` capability 返回 false。

## 目标态架构

目标实现分为 React SDK、Core SDK 和 native runtime 三层：

- React SDK 持有 `AnimationBinding`，由 `useAnimation(config)` 创建。它负责保存 config、bind 前命令排队，并且只在 `xr-animation` 解析到具体 `SpatializedElement` target 后创建 Core `AnimationObject`。
- Core SDK 持有 `AnimationObject extends SpatialObject`。它直接暴露 `play/pause/resume/stop/reset/finish`，继承 `destroy()`，订阅 `NativeWebMsg`，按 native uuid 过滤 `SpatialAnimationStateChanged`，并更新自身可观察状态。
- visionOS 持有 native `AnimationObject extends SpatialObject` 和 `SpatializedElementAnimationManager`。manager 负责 native animation 注册、create/control lookup、element destroy 级联清理、animating mask 协调，以及 `SpatialAnimationStateChanged` 发送。

完整类图、时序图和现有 visionOS motion 实现迁移说明见 `references/animation-object-architecture.zh.md`。

## React SDK 模块边界

| 模块 | 职责 |
|------|------|
| `useAnimation(config)` | 创建 `AnimationBinding`、`PlaybackApi` 和 `style` outlet。 |
| `AnimationBinding` | 保存 config、维护 normalized config signature、排队 bind 前显式命令，并在 bind 后创建 Core `AnimationObject`。 |
| `PlaybackApi` | 暴露 React-facing `play/pause/resume/stop/reset/finish`，并订阅 Core `AnimationObject` 状态。 |
| `xr-animation` binding adapter | 解析 concrete target kind，触发 `AnimationBinding.bind()` / `unbind()`。 |

## Core SDK 模块边界

| 模块 | 职责 |
|------|------|
| `SpatializedElement.createAnimation(config)` | 绑定 target 后创建 native-backed `AnimationObject`，负责 validation、normalization 和 create JSB。 |
| `AnimationObject` | Core 一等对象，继承 `SpatialObject`，直接实现播放控制，继承 `destroy()`，直接订阅 NativeWebMsg 并维护自身状态。 |
| `validateSpatializedMotionConfig` | 在 native create 前校验 authoring config，例如 Static3D `opacity` tracks 必须 reject。 |
| `motionConfigToAnimationTimeline` | 将归一化后的 motion config 编译为 canonical `CreateSpatializedElementAnimation` payload。 |

## Native Runtime / visionOS 模块边界

| 模块 | 职责 |
|------|------|
| `SpatializedElementAnimationManager` | 管理 native `AnimationObject` registry、create/control lookup、`destroyAnimationsForElement`、mask 协调和 `SpatialAnimationStateChanged` 广播。 |
| `Native AnimationObject` | 继承 `SpatialObject`，持有 native uuid、locked `TimelineSampler`、playback state，并实现 `play/pause/resume/stop/reset/finish/tick/destroy`。 |
| `SpatialObjectRegistry` | 注册、查找和销毁 native spatial objects，包括 `AnimationObject`。 |
| `TimelineSampler` | 复用现有 timeline sampler，按 locked canonical timeline 采样。 |
| `AnimationFrameDriver` | 驱动 active animations 的 per-frame tick。 |
| `ElementAnimationWriteAdapter` | 按 target kind 写入 `transform`、`opacity` 或 `modelTransform`。 |
| `AnimatingMask` | 记录 animation-owned fields，防止普通 element sync 覆盖 active animation。 |
| `NativeWebMsgEmitter` | 发送统一 `SpatialAnimationStateChanged`。 |

## 非目标

- 不引入公开的 `AnimationObjectChannel`、`AnimationObjectBridge` 或 `SpatialObjectBridge` 架构对象。
- 不保留 Core/Web RAF playback fallback。
- 不以 `AnimateSpatializedElementMotion` 作为目标态 runtime command。
- 不把 mask ownership 建在 `PortalInstanceObject` 或 React Portal suppression 上。
- 不支持 Static3D root opacity animation；Static3D `opacity` tracks 必须在 native create 前 reject。
