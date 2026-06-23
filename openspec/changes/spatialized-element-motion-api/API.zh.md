# SpatializedElement 声明式动画 — Umbrella 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **2D 细节（Plan B）:** `openspec/changes/spatial-div-motion-api/`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **三种 spatialized 容器** 提供统一的 **timeline + 声明式 playback API**（2D / Static3D Model / Dynamic3D Reality 根节点）。

## 2. 当前实现状态

| 类型 | 状态 |
|------|------|
| **Spatialized2DElement** | **已交付** — `useAnimation(config)`，返回 `[animation, api, style]` |
| **SpatializedStatic3DElement** | **已交付** — `useAnimation(config)`，返回 `[animation, api, style]` + `<Model xr-animation>`；仅 native |
| **SpatializedDynamic3DElement（Reality 容器）** | **已交付** — `useAnimation(config)`，返回 `[animation, api, style]` + `<Reality xr-animation>`；仅 native |
| **SpatialEntity（Reality 子节点）** | **不在本 change** — 当前继续使用 `useEntityAnimation(config)`；未来可作为 `useAnimation` family 的长期收敛方向，但不是本 PR 行为 |

## 3. 统一入口（推荐 API）

```typescript
// from/to 配置（推荐默认） — 目标在绑定时自动解析
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// timeline 百分比关键帧配置（CSS @keyframes 风格）
const [animation, api, style] = useAnimation({
  duration: 2,
  timeline: {
    "0%":   { transform: { translate: { y: 24 } }, opacity: 0, timingFunction: 'easeOut' },
    "50%":  { opacity: 1 },
    "100%": { transform: { translate: { y: 0 } }, opacity: 1 },
  },
  timingFunction: 'easeInOut',  // config 级默认
})

// v1 用户主路径展示 from/to 与 timeline
// 二者内部都会归一化为按属性拆分的 tracks 执行
// 当前实现 / 类型仍保留 tracks 输入作为兼容 / 高级 escape hatch，
// 但 API.zh.md 不把 tracks 作为 v1 用户主路径承诺展示

// 绑定目标：
<div enable-xr style={{ ...style }} xr-animation={animation} />  // → 2D 容器
<Model src="robot.usdz" xr-animation={animation} />               // → Static3D 容器
<Reality xr-animation={animation}><Entity /></Reality>             // → Dynamic3D 容器

// style 行为：
// 2D：承载 Web fallback / 非 native 场景下的动画样式，可安全合并到 style
// 3D：恒为 {}；动画由 xr-animation 绑定交给 native 驱动，返回空对象仅为保持 tuple 形态一致
```

| 绑定目标 | React 绑定 | Core 写回 |
|----------|------------|-----------|
| 2D | `xr-animation` on `enable-xr` div，`style` 合并 | native `element.transform` + opacity；浏览器可 Web RAF |
| Static3D | `xr-animation` on `<Model>` | native `modelTransform` only；`opacity` 不属于已交付的 Static3D sink |
| Dynamic3D | `xr-animation` on `<Reality>` | native 容器 `element.transform` + opacity |

## 4. Playback API

```typescript
interface SpatializedPlaybackApi {
  play(): void
  pause(): void
  resume(): void
  stop(): void       // Stop active session, keep current value, then go idle
  reset(): void      // Always seek to from value, emit start value, then go idle
  finish(): void     // Always seek to to value, emit end value, then go finished
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatializedMotionPlayState
}

`pause()` / `resume()` are whole-session operations only and do not accept keys parameters. If the product later needs local control at track/action granularity, that must be proposed as a separate API and is out of scope for this change.

type SpatializedMotionPlayState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'
```

### 终止方法行为对比

| 方法 | 调用范围 | Style 输出 | playState | finished | 触发回调 | 后端行为 |
|------|----------|-----------|-----------|----------|---------|---------|
| `stop()` | 仅 active session | 当前帧值 | `idle` | `false` | `onStop` | Web: JS 计算当前 t；Native: native 回传当前值 |
| `reset()` | 无条件 | from 值 | `idle` | `false` | `onReset` | Web: JS 计算 t=0；Native: native 回传/JS fallback |
| `finish()` | 无条件 | to 值 | `finished` | `true` | `onComplete` | Web: JS 计算 t=duration；Native: native 回传/JS fallback |
| 自然结束 | active 播放自然结束 | to 值 | `finished` | `true` | `onComplete` | 最后一帧自然到达 |

补充语义：
- `stop()` 后 `finished = false`
- `reset()` 后 `finished = false`
- `finish()` 后 `finished = true`
- `idle.reset()` 不是 no-op，仍需发出起点值
- `idle.finish()` 不是 no-op，仍需发出终点值并进入 `finished`
- `idle.stop()` 维持现状，不新增语义
- `stop()`、`reset()`、`finish()` 互相独立，不会互相吞指令
- paused 状态下调用 `play()` 等价于 `resume()`

## 5. Config Callbacks

```typescript
interface SpatializedMotionSegmentConfig {
  // ... from, to, duration, timingFunction, delay, autoStart, loop, playbackRate ...
  onStart?: () => void
  onComplete?: (values: SpatializedVisualValues) => void
  onStop?: (values: SpatializedVisualValues) => void
  onReset?: (values: SpatializedVisualValues) => void
  onError?: (error: SpatializedPlaybackError) => void
}
```

| 回调 | 触发条件 | 参数 |
|------|---------|------|
| `onStart` | `play()` 后首帧播放 | 无 |
| `onComplete` | 自然结束 **或** `finish()` | `values`（to 值） |
| `onStop` | `stop()` | `values`（当前值） |
| `onReset` | `reset()` | `values`（from 值） |
| `onError` | Native 桥异步失败 | `error` |

每次会话终止时 `onComplete`/`onStop`/`onReset` 互斥，恰好触发一个。

配置补充说明：
- `autoStart?: boolean`
- 默认在绑定目标后自动播放
- `autoStart: false` 时需要显式调用 `api.play()`
- `timeline` 是单个 CSS `@keyframes` 风格的百分比关键帧对象，不是串行动画编排器
- 多个属性应写在同一个 `timeline` 对象中，内部按属性拆分为 tracks 执行
- v1 不支持 `timeline: []`、多个 action、或多段编排语义

## 6. Core 统一实现

| 对外 | 说明 |
|------|------|
| **`SpatializedMotionController`** | Core 层统一控制器实现；通过绑定流程解析目标 kind，并暴露 `config` / `updateConfig` |
| **`SpatializedMotionHandle`** | Core 层 imperative 接口（`play` / `pause` / `resume` / `stop` / `reset` / `finish` / …） |
| `supports('useAnimation')` | 仅 family 级 probe；不能据此判断具体目标是否可用 |
| `supports('useAnimation', ['element'])` | 2D 容器能力探测 |
| `supports('useAnimation', ['static3d'])` | Static3D 容器能力探测 |
| `supports('useAnimation', ['dynamic3d'])` | Dynamic3D 容器能力探测 |
| `supports('useAnimation', ['entity'])` | Entity 动画能力探测（对应当前 `useEntityAnimation` 栈） |

补充约束：

- React SDK 面向业务的推荐公开入口仍为 `useAnimation`
- `SpatializedMotionController` 与 `SpatializedMotionHandle` 不再作为 React SDK 根入口或 motion 子入口公开导出
- `supportsMotionKind` 与 `forceNativePlayback` 继续保留在 controller options 中，定位为注入 seam / 覆盖开关，而不是 React SDK 推荐公开 API
- controller 继续使用单一 options 容器；`kind` 不进入 options，而是在绑定阶段解析
- controller 允许在构造阶段没有 `kind`，但 backend 真正执行前必须已经通过绑定流程拿到目标 `kind`
- `attachElement(...)`、`autoStart`、`pendingPlay` 本轮维持现状，不在这次收敛中调整语义

## 7. 与模型内嵌动画区分

`<Model ref.play()>` 播放 USD 片段；**不要**与 `motion.play()` timeline 混为同一 API。

## 8. 类型命名（Core / React 导出）

容器运动统一使用 **`Spatialized*`**（不再导出 `SpatialDiv*` 类型名）：

| 用途 | 类型名 |
|------|--------|
| 单段 `from→to` | `SpatializedMotionSegmentConfig` |
| 多轨 timeline | `SpatializedMotionConfig` |
| 轨道 / 关键帧 | `SpatializedMotionTrack`, `SpatializedMotionKeyframe` |
| 属性路径 | `SpatializedMotionProperty` |
| 瞬时视觉值 | `SpatializedVisualValues`, `SpatializedVisualTransform` |
| 命令式播放 | `SpatializedPlaybackApi`, `SpatializedMotionPlayState` |
| 异步失败 | `SpatializedPlaybackError` |
| 容器 kind | `SpatializedMotionKind` |
| Portal `animation` 绑定 | `SpatializedMotionBinding`（`__kind: 'spatializedMotion'`） |
| JSB payload（无 targetKind） | `ElementMotionCommand` |
| 百分比关键帧值 | `SpatializedMotionKeyframeValues`（`SpatializedVisualValues` + 可选 `timingFunction`） |
| Timeline 配置 | `SpatializedMotionTimelineConfig` |
| 缓动函数 | `TimingFunction`（`'linear' \| 'easeIn' \| 'easeOut' \| 'easeInOut'`） |

Entity 动画仍用 **`AnimationConfig`** / **`AnimateTransform`**，与上表分离。

## 9. 演示页（test-server）

- Hub: `/#/spatial-div-motion`（侧栏 **Spatialized Motion**）
- 2D: `multi-track` 等
- Static3D: `/#/spatial-div-motion/model-container`
- Dynamic3D: `/#/spatial-div-motion/reality-container`

## 10. 评审 / 提测前对齐项

- Entity 当前使用 `useEntityAnimation`，不走本 change 的容器 motion `useAnimation`
- 用户主路径只展示 `from/to` 与 `timeline`
- `tracks` 仅作为内部 canonical model / 当前实现兼容口径，不作为 v1 用户主路径承诺
- capability 检测使用真实 sub-token：`element` / `static3d` / `dynamic3d` / `entity`
- `supports('useAnimation')` 只是 animation family 级 probe；业务判断具体目标能力时必须带 sub-token
- 3D 目标下 `style` 恒为 `{}`
- `timeline` 是单个 CSS `@keyframes` 风格对象，不支持数组或多 action 编排
- `autoStart` 支持但不进入主示例；默认绑定后自动播放
- `finish()` 触发 `onComplete`
- `stop()` / `reset()` / `finish()` 是互相独立命令
- paused 状态下 `play()` 等价于 `resume()`