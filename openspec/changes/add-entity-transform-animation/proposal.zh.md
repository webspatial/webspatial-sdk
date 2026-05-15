## 为什么

**问题**

WebSpatial SDK 目前可以通过 React props 更新实体的 transform（position、rotation、scale），但所有变更都是瞬时跳变，没有内建的平滑过渡。这导致常见的空间交互场景（入场动画、平滑移动、旋转、延迟出现、循环动效）难以低成本且一致地实现。

**方案**

引入一套参考 react-spring 的声明式 `useAnimation` API，由 React 侧声明动画意图，实际播放交给 RealityKit 原生动画引擎执行，在 90 fps 下运行且无需逐帧 JS-to-Native bridge 调用。

**为什么现在做**

API 外形、feature detection 契约和跨层行为需要在编码前达成一致，因此本提案先锁定 spec。

## 一览

```tsx
import {
  Reality,
  SceneGraph,
  BoxEntity,
  useAnimation,
} from '@webspatial/react-sdk'

function AnimatedBox() {
  const [animation, api] = useAnimation({
    to: { position: { x: 0, y: 1.5, z: -2 } },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <Reality style={{ width: '100%', height: '600px', '--xr-depth': 150 }}>
      <SceneGraph>
        <BoxEntity
          width={0.3}
          height={0.3}
          depth={0.3}
          animation={animation}
        />
      </SceneGraph>
    </Reality>
  )
}
```

Hook 声明动画意图，播放由 Native 以 90 fps 执行。需要时可通过 `api.play()`、`pause()`、`cancel()` 命令式控制；其中 paused 后再次 `play()` 会继续当前会话，并通过 `onError` 接收 bridge/native 异步失败。

## 变更内容

- 新增实体 Transform 动画能力，以 React `useAnimation(config)` Hook 与实体组件的 `animation` prop 为中心。
- 提供命令式播放控制 `play`、`pause`、`cancel`，以及 `finished`、`onStart`、自然完成、恢复到 `from` 的取消和 `onError` 的生命周期 / 错误回调。
- 定义 `duration`、`timingFunction`、`delay`、`autoStart`、`loop` 等时序行为，并支持 reverse，方向与评审 API 设计保持一致。
- 明确 React、Core SDK、JSBridge、Native 播放之间的跨层契约，使动画在 Native 侧运行，并避免与常规 transform 更新互相竞争。
- 明确 `animation` prop 的作用域，区分静态保证与运行时行为：
  - **静态（TypeScript）保证**：`animation` prop 仅在接入 `SpatialEntity` 抽象的 Entity 组件（如 `BoxEntity`、`ModelEntity`）类型定义中暴露。`SpatialDiv`、普通 HTML 元素及非 Reality-entity 的 `Model` 组件类型中不包含该 prop，传入将产生编译错误。需要注意，TypeScript **无法**在编译期证明某个 entity 组件确实渲染在 `Reality` / `SceneGraph` 子树中——这属于运行时关注点。
  - **运行时行为（entity 未绑定时）**：若带有 `useAnimation` 的组件渲染在 `Reality` / `SceneGraph` 之外（即从未绑定到 `SpatialEntity` 上下文），行为如下：
    - `api.play()` 将 `playState` 转为 `queued`，并保持该状态直到 entity 绑定到 `SpatialEntity` 上下文（此时正常开始播放）或组件卸载（此时丢弃排队的 session）。
    - `api.pause()` 将待执行的 play 请求冻结为 `paused` 状态；entity 绑定后仍保持暂停，直到应用再次调用 `api.play()`。
    - `api.cancel()` 取消排队会话，将 `playState` 恢复为 `'idle'`，并触发 `onCancel`。
    - `api.isAnimating` 在 `playState` 为 `'queued'` 时保持 `true`；queued 期间 pause 后，`api.isAnimating` 变为 `false`，`api.isPaused` 变为 `true`。
    - 未绑定期间不会触发任何生命周期回调（`onStart`、`onComplete`、`onCancel`）；`onError` 也不会触发，因为缺少绑定 entity 是合法的等待状态而非错误。
    - 卸载时，排队的 session 被静默清理，不触发任何回调。
- 扩展运行时能力文档，使应用在使用动画 API 前可通过 `supports("useAnimation", ["entity"])` 查询支持情况。

## 能力

### 新增能力

- `entity-transform-animation`：对实体 transform 属性（仅 position、rotation、scale；不含 material、opacity、color 等非 transform 属性）进行声明式与命令式动画控制，包括 `onStart`、`onComplete`、`onCancel`、`onError` 等回调和 React 集成规则。

### 修改的能力

- `runtime-capabilities`：新增并文档化 `supports("useAnimation", ["entity"])` 能力 key，用于实体 Transform 动画 API 的 feature detection。

## 影响面

- **Packages**：`@webspatial/react-sdk`、`@webspatial/core-sdk`，以及 visionOS Native bridge / scene runtime。
- **Public API**：新增 `useAnimation` Hook、实体 `animation` prop、以及动画播放控制方法。
- **Documentation**：更新实体动画文档与能力检测文档。
- **Validation**：补齐能力检测、React API 行为、JSBridge 命令流、Native 完成与取消事件，以及异步错误回调行为的覆盖。
- **Breaking changes**：无。本次变更为纯增量。
