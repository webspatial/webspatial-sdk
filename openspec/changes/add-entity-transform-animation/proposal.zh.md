## 为什么

WebSpatial SDK 目前允许开发者通过 React props 直接更新实体的 transform（position、rotation、scale），但所有变更都是瞬时跳变，缺少内建的平滑过渡能力。这会让常见空间交互与视觉反馈场景（入场、移动、旋转、缩放、延迟出现、循环动效）难以低成本、稳定一致地表达。评审方向提供一个参考 react-spring 的声明式 API，同时把播放交给 RealityKit 原生动画引擎执行，以获得更稳定的表现与更低的桥接开销（目标 90fps）。因此需要先固化对外契约、feature detection 与跨层行为，再进入实现阶段，避免后续反复调整。

## 变更内容

- 新增实体 Transform 动画能力，以 React `useAnimation(config)` Hook 与实体组件的 `animation` prop 为中心。
- 提供命令式播放控制 `play`、`pause`、`resume`、`stop`，以及 start、自然完成、stop 时回传当前 transform 的生命周期回调。
- 定义 `duration`、`timingFunction`、`delay`、`autoStart`、`loop` 等时序行为，并支持 reverse，方向与评审 API 设计保持一致。
- 明确 React、Core SDK、JSBridge、Native 播放之间的跨层契约，使动画在 Native 侧运行，并避免与常规 transform 更新互相竞争。
- 扩展运行时能力文档，使应用在使用动画 API 前可通过 `supports('useAnimation')` 查询支持情况。

## 能力

### 新增能力

- `entity-transform-animation`：对实体 transform 属性进行声明式与命令式动画控制，包括播放生命周期与 React 集成规则。

### 修改的能力

- `runtime-capabilities`：新增并文档化 `supports('useAnimation')` 能力 key，用于实体 Transform 动画 API 的 feature detection。

## 影响面

- **Packages**：`@webspatial/react-sdk`、`@webspatial/core-sdk`，以及 visionOS Native bridge / scene runtime。
- **Public API**：新增 `useAnimation` Hook、实体 `animation` prop、以及动画播放控制方法。
- **Documentation**：更新实体动画文档与能力检测文档。
- **Validation**：补齐能力检测、React API 行为、JSBridge 命令流、Native 完成与停止事件的覆盖。