# SpatializedElement 声明式动画 — API 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **三种 spatialized 容器** 提供统一的 timeline + 声明式播放 API。动画建模为 **Native `AnimationObject`**，由 `SpatializedElement.createAnimation(config)` 创建，uuid 由 native 生成。

**纯 Web 不支持 `useAnimation`。**

## 2. 平台约束

| 环境 | `useAnimation` |
|------|----------------|
| Native spatial runtime（visionOS / WebSpatial） | 支持 |
| 纯浏览器 / 无 native | **不支持** — 使用 CSS、framer-motion 等 |

## 3. 统一入口

```typescript
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

<div enable-xr xr-animation={animation} />   // → spatialized2d
<Model xr-animation={animation} />            // → static3d
<Reality xr-animation={animation} />        // → dynamic3d
```

bind 时：`element.createAnimation(config)` → `AnimationObject`（timeline 锁定）

修改 config：先 `animationObject.destroy()`，React 重新 `createAnimation`。

## 4. Core API

```typescript
// SpatializedElement
async createAnimation(
  config: SpatializedMotionAuthorConfig,
): Promise<AnimationObject>

class AnimationObject extends SpatialObject {
  readonly elementId: string
  readonly targetKind: SpatializedMotionKind

  play(): Promise<void>
  pause(): Promise<SpatializedVisualValues>
  resume(): Promise<void>
  stop(): Promise<SpatializedVisualValues>
  reset(): Promise<SpatializedVisualValues>
  finish(): Promise<SpatializedVisualValues>
  destroy(): Promise<void>

  readonly playState: SpatializedMotionPlayState
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
}
```

## 5. Playback API（React `api` 元组）

```typescript
interface SpatializedPlaybackApi {
  play(): void
  pause(): void
  resume(): void
  stop(): void
  reset(): void
  finish(): void
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  readonly playState: SpatializedMotionPlayState
}

type SpatializedMotionPlayState = 'idle' | 'running' | 'paused' | 'finished'
```

`playState` 以 native `SpatialAnimationStateChanged` WebMsg 为准。

| 方法 | 行为 |
|------|------|
| `stop()` | 终止；当前值；`idle`；`onStop` |
| `reset()` | seek 起点；`idle`；`onReset` |
| `finish()` | seek 终点；`finished`；`onComplete` |
| 自然结束 | `finished`；`onComplete` |

## 6. Config 与回调

```typescript
interface SpatializedMotionAuthorConfig {
  // from/to | timeline | tracks（互斥）
  onStart?: () => void
  onComplete?: (values: SpatializedVisualValues) => void
  onStop?: (values: SpatializedVisualValues) => void
  onReset?: (values: SpatializedVisualValues) => void
  onError?: (error: SpatializedPlaybackError) => void
  autoStart?: boolean  // 默认 bind 后自动 play
}
```

回调在 `createAnimation` 时注册。无 `updateConfig` — timeline 已锁定。

## 7. JSB 协议

### JS → Native

| 命令 | 用途 |
|------|------|
| `CreateSpatializedElementAnimation` | `elementId`, `targetKind`, `timeline` → `{ animationId }` |
| `ControlSpatializedElementAnimation` | `animationId`, `type: play\|pause\|resume\|stop\|reset\|finish` |
| `Destroy` | `id: animationId` |

### Native → JS

`SpatialAnimationStateChanged` — `animationId`, `elementId`, `action`, optional `values` / `error`

## 8. 能力探测

| Token | 含义 |
|-------|------|
| `supports('useAnimation', ['element'])` | 2D 容器 |
| `supports('useAnimation', ['static3d'])` | Model |
| `supports('useAnimation', ['dynamic3d'])` | Reality 容器 |

仅在 native runtime 为 `true`。

## 9. 类型命名

| 用途 | 类型 |
|------|------|
| Authoring | `SpatializedMotionSegmentConfig`, `SpatializedMotionTimelineConfig` |
| 执行模型 | `SpatializedMotionTrack`, `SpatializedMotionTimeline` |
| 视觉值 | `SpatializedVisualValues` |
| 播放 | `SpatializedPlaybackApi`, `SpatializedMotionPlayState` |
| 句柄 | `AnimationObject` |
| React binding | `SpatializedMotionBinding`（`xr-animation`） |

## 10. 与 Model clip 区分

`<Model ref.play()>` 播放 USD 片段；与 `AnimationObject` timeline 无关。

## 11. style 语义

| Kind | `style` |
|------|---------|
| 2D | 初始 `from` 预览；播放中由 native 写 element |
| Static3D / Dynamic3D | `{}`（safe spread） |

## 12. 演示页

- Hub: `/#/spatial-div-motion`
- 2D / Model / Reality container demos
