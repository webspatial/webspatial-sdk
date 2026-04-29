## 为什么

**问题**

WebSpatial SDK 目前可以通过 React props 更新实体的 transform（position、rotation、scale），但所有变更都是瞬时跳变，没有内建的平滑过渡。这导致常见的空间交互场景（入场动画、平滑移动、旋转、延迟出现、循环动效）难以低成本且一致地实现。

**方案**

引入一套参考 react-spring 的声明式 `useAnimation` API，由 React 侧声明动画意图，实际播放交给 RealityKit 原生动画引擎执行，在 90 fps 下运行且无需逐帧 JS-to-Native bridge 调用。

**为什么现在做**

API 外形、feature detection 契约和跨层行为需要在编码前达成一致，因此本提案先锁定 spec。

## 一览

```tsx
// 最小用法 — 外层 <Reality> 与 <SceneGraph> 省略
const [animation, api] = useAnimation({
  to: { position: { x: 0, y: 1.5, z: -2 } },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// 在 <SceneGraph> 内部：
<BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
```

Hook 声明动画意图，播放由 Native 以 90 fps 执行。需要时可通过 `api.play()`、`pause()`、`resume()`、`stop()` 命令式控制，并通过 `onError` 接收 bridge/native 异步失败。

## 变更内容

- 新增实体 Transform 动画能力，以 React `useAnimation(config)` Hook 与实体组件的 `animation` prop 为中心。
- 提供命令式播放控制 `play`、`pause`、`resume`、`stop`，以及 `onStart`、自然完成、`stop` 和 `onError` 的生命周期 / 错误回调。
- 定义 `duration`、`timingFunction`、`delay`、`autoStart`、`loop` 等时序行为，并支持 reverse，方向与评审 API 设计保持一致。
- 明确 React、Core SDK、JSBridge、Native 播放之间的跨层契约，使动画在 Native 侧运行，并避免与常规 transform 更新互相竞争。
- 明确 `animation` prop 仅适用于 `Reality` / `SceneGraph` 下的 Entity 组件，不适用于 `SpatialDiv`、非 Reality Entity 的普通 `Model` 组件或其他非 Entity 组件；该限制通过 TypeScript 类型定义表达。
- 扩展运行时能力文档，使应用在使用动画 API 前可通过 `supports('useAnimation')` 查询支持情况。

## 能力

### 新增能力

- `entity-transform-animation`：对实体 transform 属性（仅 position、rotation、scale；不含 material、opacity、color 等非 transform 属性）进行声明式与命令式动画控制，包括 `onStart`、`onComplete`、`onStop`、`onError` 等回调和 React 集成规则。

### 修改的能力

- `runtime-capabilities`：新增并文档化 `supports('useAnimation')` 能力 key，用于实体 Transform 动画 API 的 feature detection。

## 影响面

- **Packages**：`@webspatial/react-sdk`、`@webspatial/core-sdk`，以及 visionOS Native bridge / scene runtime。
- **Public API**：新增 `useAnimation` Hook、实体 `animation` prop、以及动画播放控制方法。
- **Documentation**：更新实体动画文档与能力检测文档。
- **Validation**：补齐能力检测、React API 行为、JSBridge 命令流、Native 完成与停止事件，以及异步错误回调行为的覆盖。
- **Breaking changes**：无。本次变更为纯增量。