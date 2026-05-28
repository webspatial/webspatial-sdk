# SpatializedElement 声明式动画 — Umbrella 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **2D 细节（Plan B）:** `openspec/changes/spatial-div-motion-api/`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **三种 spatialized 容器** 提供统一的 **timeline + 声明式 playback API**（2D / Static3D Model / Dynamic3D Reality 根节点）。

## 2. 当前实现状态

| 类型 | 状态 |
|------|------|
| **Spatialized2DElement** | **已交付** — `useSpatializedMotion(config)`，返回 `[animation, api, style]` |
| **SpatializedStatic3DElement** | **已交付** — `useSpatializedMotion(config)`，返回 `[animation, api, style]` + `<Model motion>`；仅 native |
| **SpatializedDynamic3DElement（Reality 容器）** | **已交付** — `useSpatializedMotion(config)`，返回 `[animation, api, style]` + `<Reality motion>`；仅 native |
| **SpatialEntity（Reality 子节点）** | **不在本 change** — 继续 `useAnimation` |

## 3. 统一入口（推荐 API）

```typescript
// from/to 配置（推荐默认） — 目标在绑定时自动解析
const [animation, api, style] = useSpatializedMotion({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// tracks 配置（高级） — 多轨 timeline
const [animation, api, style] = useSpatializedMotion({
  duration: 5,
  tracks: [
    { property: 'transform.translate.x', keyframes: [{ at: 0, value: 0 }, { at: 5, value: 100 }], easing: 'linear' },
  ],
})

// 两种配置互斥（union type），内部 from/to 编译为 tracks 执行

// 绑定目标：
<div enable-xr style={{ ...style }} motion={animation} />  // → spatialized2d
<Model src="robot.usdz" motion={animation} />               // → static3d
<Reality motion={animation}><Entity /></Reality>             // → dynamic3d

// style 行为：2D 返回活跃 CSSProperties；3D 返回空对象 {}（可安全展开）
```

| 绑定目标 | React 绑定 | Core 写回 |
|----------|------------|-----------|
| 2D | `motion` on `enable-xr` div，`style` 合并 | native `element.transform` + opacity；浏览器可 Web RAF |
| Static3D | `motion` on `<Model>` | native `modelTransform` + opacity |
| Dynamic3D | `motion` on `<Reality>` | native 容器 `element.transform` + opacity |

## 4. Core 统一实现

| 对外 | 说明 |
|------|------|
| **`SpatializedMotionController`** | 唯一控制器实现；由绑定目标（组件类型）决定 |
| **`SpatializedMotionHandle`** | imperative 接口（`play` / `pause` / `resume` / `cancel` / …） |
| `SpatializedMotionController` | 唯一 Core 控制器；`new SpatializedMotionController(config, kind)` |
| `element.motion(config)` | 各 `Spatialized*Element` 工厂，返回 `SpatializedMotionHandle` |
| `supports('useSpatializedMotion', [target])` | 能力探测（`spatialized2d` / `static3d` / `dynamic3d`） |

## 5. 与模型内嵌动画区分

`<Model ref.play()>` 播放 USD 片段；**不要**与 `motion.play()` timeline 混为同一 API。

## 6. 类型命名（Core / React 导出）

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

Entity 动画仍用 **`AnimationConfig`** / **`AnimateTransform`**，与上表分离。

## 7. 演示页（test-server）

- Hub: `/#/spatial-div-motion`（侧栏 **Spatialized Motion**）
- 2D: `multi-track` 等
- Static3D: `/#/spatial-div-motion/model-container`
- Dynamic3D: `/#/spatial-div-motion/reality-container`
