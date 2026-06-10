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
| **SpatialEntity（Reality 子节点）** | **不在本 change** — 继续 `useAnimation` |

## 3. 统一入口（推荐 API）

```typescript
// from/to 配置（推荐默认） — 目标在绑定时自动解析
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// tracks 配置（高级） — 多轨 timeline
const [animation, api, style] = useAnimation({
  duration: 5,
  tracks: [
    { property: 'transform.translate.x', keyframes: [{ at: 0, value: 0 }, { at: 5, value: 100 }], timingFunction: 'linear' },
  ],
})

// timeline 百分比关键帧配置（CSS @keyframes 风格） — 脱糖为 tracks 执行
const [animation, api, style] = useAnimation({
  duration: 2,
  timeline: {
    "0%":   { transform: { translate: { y: 24 } }, opacity: 0, timingFunction: 'easeOut' },
    "50%":  { opacity: 1 },
    "100%": { transform: { translate: { y: 0 } }, opacity: 1 },
  },
  timingFunction: 'easeInOut',  // config 级默认
})

// 三种配置互斥（union type），内部 from/to 和 timeline 均编译为 tracks 执行

// 绑定目标：
<div enable-xr style={{ ...style }} xr-animation={animation} />  // → spatialized2d
<Model src="robot.usdz" xr-animation={animation} />               // → static3d
<Reality xr-animation={animation}><Entity /></Reality>             // → dynamic3d

// style 行为：2D 返回活跃 CSSProperties；3D 返回空对象 {}（可安全展开）
```

| 绑定目标 | React 绑定 | Core 写回 |
|----------|------------|-----------|
| 2D | `xr-animation` on `enable-xr` div，`style` 合并 | native `element.transform` + opacity；浏览器可 Web RAF |
| Static3D | `xr-animation` on `<Model>` | native `modelTransform` + opacity |
| Dynamic3D | `xr-animation` on `<Reality>` | native 容器 `element.transform` + opacity |

## 4. Playback API

```typescript
interface SpatializedPlaybackApi {
  play(): void
  pause(keys?: SpatializedMotionPropertyKeys): void
  resume(keys?: SpatializedMotionPropertyKeys): void
  stop(): void       // Stop active session, keep current value, then go idle
  reset(): void      // Always seek to from value, emit start value, then go idle
  finish(): void     // Always seek to to value, emit end value, then go finished
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatializedMotionPlayState
}

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

## 6. Core 统一实现

| 对外 | 说明 |
|------|------|
| **`SpatializedMotionController`** | Core 层统一控制器实现；通过绑定流程解析目标 kind，并暴露 `config` / `updateConfig` |
| **`SpatializedMotionHandle`** | Core 层 imperative 接口（`play` / `pause` / `resume` / `stop` / `reset` / `finish` / …） |
| `supports('useAnimation', [target])` | 能力探测（`spatialized2d` / `static3d` / `dynamic3d`） |

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