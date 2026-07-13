## 为什么

SpatialDiv、Model 和 Reality 容器需要一套统一的声明式动画 API，让开发者在所有宿主上复用相同的 timeline 与播放控制概念。

本变更提供 `useAnimation(config)`，用于动画化容器根 transform 和 opacity。它既支持简单的起止过渡，也支持多阶段百分比关键帧，并为所有支持的容器提供一致的播放控制和生命周期回调。

## 什么需求使用什么 API

当视觉容器本身需要移动、旋转、缩放或淡入淡出时，使用 `useAnimation`：

| 需求 | 使用方式 |
|---|---|
| 移动或淡入淡出 SpatialDiv 面板 | `useAnimation` + `enable-xr` 元素上的 `xr-animation` |
| 移动、旋转、缩放或淡入淡出 Model 容器 | `useAnimation` + `<Model>` 上的 `xr-animation` |
| 整体动画化 Reality 容器及其所有子节点 | `useAnimation` + `<Reality>` 上的 `xr-animation` |
| 播放 USD 模型内嵌动画 | Model ref 的 `play()` / `pause()` |
| 独立动画化 Reality 内的某个 Entity | `useEntityAnimation` |
| 运行一次简单的起止过渡 | 使用顶层 `from` 和 `to` |
| 运行三个及以上阶段，或让不同属性在不同时间变化 | 使用混合边界与百分比关键帧的 `timeline` |

## 快速开始：顶层 from/to

入口、退出、移动、缩放、旋转和淡入淡出等只有一个起点和终点的过渡，使用 `from`/`to` 形式。

```tsx
import { useAnimation } from '@webspatial/react-sdk'

export function EnteringPanel() {
  const [animation, api, style] = useAnimation({
    from: {
      transform: { translate: { y: 24 } },
      opacity: 0,
    },
    to: {
      transform: { translate: { y: 0 } },
      opacity: 1,
    },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <div enable-xr style={{ width: 320, height: 180, ...style }} xr-animation={animation}>
      <button onClick={() => api.reset()}>Reset</button>
      <button onClick={() => api.play()}>Play</button>
    </div>
  )
}
```

顶层 `from` 和 `to` 都是必填字段。每个动画属性在两个边界上都有显式值。仅使用 from/to 时，`duration` 默认为 0.3 秒。

## 多阶段动画：混合 timeline

动画包含中间阶段，或不同属性需要在不同时间点变化时，使用 `timeline`。`from`、`to` 可以与百分比关键帧混合。

```tsx
export function PulsingPanel() {
  const [animation, api, style] = useAnimation({
    duration: 2,
    autoStart: false,
    timeline: {
      from: {
        transform: { translate: { y: 20 }, scale: { x: 0.9, y: 0.9 } },
        opacity: 0,
      },
      '40%': {
        transform: { translate: { y: 0 }, scale: { x: 1.05, y: 1.05 } },
        opacity: 1,
        timingFunction: 'easeOut',
      },
      to: {
        transform: { translate: { y: 0 }, scale: { x: 1, y: 1 } },
        opacity: 1,
      },
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Play</button>
      <div enable-xr style={{ width: 320, height: 180, ...style }} xr-animation={animation} />
    </>
  )
}
```

Timeline authoring 遵循以下规则：

- `from` 等价于 `0%`，`to` 等价于 `100%`。
- 使用任意百分比 key 时，`duration` 必填，单位为秒。
- Key 范围为 `0%` 到 `100%`，支持 `30.33%` 等小数百分比。
- 每个动画属性至少需要两个值。属性可以只出现在与它相关的帧中：在这些帧之间插值，在首帧之前保持首值，在末帧之后保持末值。
- 帧上的 `timingFunction` 控制从该帧到下一帧的插值；未设置时使用 config 级 timing function，再回退到 `linear`。

例如，下面的旋转在前半段从 -20° 变化到 80°，之后保持 80° 到结束；opacity 则继续贯穿整个 timeline：

```tsx
timeline: {
  '0%': { opacity: 0, transform: { rotate: { z: -20 } } },
  '50%': { transform: { rotate: { z: 80 } } },
  '100%': { opacity: 1 },
}
```

Timeline authoring 将动画边界放在 `timeline` 内，外层 config 承载 duration 和播放控制。顶层 `from` 和 `to` 继续作为简单 authoring 形式。

## 支持的宿主

每个宿主分别创建一个 `useAnimation` 实例。

### SpatialDiv

```tsx
const [animation, api, style] = useAnimation(panelMotion)

return (
  <div enable-xr style={{ width: 300, height: 180, ...style }} xr-animation={animation}>
    Spatial panel
  </div>
)
```

### Model 容器

```tsx
const [animation, api, style] = useAnimation(modelMotion)

return (
  <Model
    src="robot.usdz"
    style={{ ...style }}
    xr-animation={animation}
  />
)
```

这会动画化 Model 容器的 transform 和 opacity。

### Reality 容器

```tsx
const [animation, api, style] = useAnimation(realityMotion)

return (
  <Reality style={{ ...style }} xr-animation={animation}>
    <Entity id="robot" />
    <Entity id="label" />
  </Reality>
)
```

这会动画化 Reality 容器，子 Entity 在保留自身局部 transform 的同时随容器一起移动。若要独立动画化某个子 Entity，应使用 `useEntityAnimation`。

## Config 参考

| 字段 | 含义 |
|---|---|
| `from` / `to` | 简单顶层 segment 形式的必填边界 |
| `timeline` | 可选的高级形式，可混合 `from`、`to` 和百分比关键帧；其内容决定动画 |
| `duration` | 秒。仅使用 from/to 时默认为 0.3；timeline 包含百分比 key 时必填 |
| `timingFunction` | 默认插值函数：`linear`、`easeIn`、`easeOut` 或 `easeInOut` |
| `delay` | 播放前延迟，单位为秒 |
| `autoStart` | 默认在绑定后自动开始；设为 `false` 时手动播放 |
| `loop` | 循环播放；可通过 loop options 请求 reverse 循环 |
| `playbackRate` | 播放速度倍率 |
| `onStart` | 播放开始时调用 |
| `onComplete` | 自然结束或已确认的 `finish()` 后调用 |
| `onStop` | `stop()` 后调用，并接收当前视觉值 |
| `onReset` | `reset()` 后调用，并接收起始视觉值 |
| `onError` | 接收异步播放错误 |

## 支持的视觉值

`from`、`to` 和百分比帧接受 `opacity` 与结构化 transform 值：

```tsx
from: {
  opacity: 0,
  transform: {
    translate: { x: 0, y: 20, z: 0 },
    rotate: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
},
to: {
  opacity: 1,
  transform: {
    translate: { x: 100, y: 0, z: 0 },
    rotate: { x: 0, y: 90, z: 0 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
  },
},
```

## 播放控制

| API | 行为 |
|---|---|
| `play()` | 启动新会话、恢复 paused 会话，并让 running 会话保持 active |
| `pause()` | 在当前值暂停整个会话 |
| `stop()` | 停止 active 会话并保持当前值；状态回到 `idle` |
| `reset()` | Seek 到会话起始值并回到 `idle` |
| `finish()` | Seek 到终态值，并在确认后进入 `finished` |

API 还暴露 `isAnimating`、`isPaused`、`finished` 和 `playState`。`playState` 可能为 `idle`、`queued`、`running`、`paused` 或 `finished`。

命令可以在宿主绑定前发出。显式 `play()` 和 `finish()` 会排队并在绑定后执行。`autoStart: false` 选择手动播放，显式排队命令会在绑定后继续执行。

## 保持终态值可见

始终将返回的 `style` 合并到接收 `xr-animation` 的同一宿主：

```tsx
<Model style={{ ...authoredStyle, ...style }} xr-animation={animation} />
```

这样可以在后续 React render 和宿主重新同步后保持动画发出的视觉值。

## 可用性与降级

依赖容器动画前应先检查可用性：

```tsx
import { supports } from '@webspatial/core-sdk'

const presentation = supports('useAnimation')
  ? <AnimatedPresentation />
  : <StaticPresentation />
```

使用 `supports('useAnimation')` 在动画版本与静态版本之间选择。

## 能力

### 新增

- `spatialized-element-motion` — 共享容器动画行为以及 SpatialDiv / Model / Reality target 矩阵。

### 修改

- `runtime-capabilities` — `supports('useAnimation')` 报告容器动画可用性。

## 影响

- **包：** `@webspatial/react-sdk`、`@webspatial/core-sdk` 和空间运行时。
- **公开 API：** `useAnimation`、`SpatializedMotionConfig`、`SpatializedPlaybackApi`、`xr-animation` 和 `supports('useAnimation')`。
- **迁移：** 继续支持现有顶层 `from` / `to` authoring；多阶段 demo 和文档使用公开 timeline authoring。
