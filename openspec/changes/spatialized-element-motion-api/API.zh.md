# SpatializedElement 声明式动画 — Umbrella 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **2D 细节（Plan B）:** `openspec/changes/spatial-div-motion-api/`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **三种 spatialized 容器** 提供统一的 **timeline + 声明式 playback API**（2D / Static3D Model / Dynamic3D Reality 根节点）。

## 2. 当前实现状态

| 类型 | 状态 |
|------|------|
| **Spatialized2DElement** | **已交付** — `useSpatializedMotion({ kind: 'spatialized2d' })` |
| **SpatializedStatic3DElement** | **已交付** — `useSpatializedMotion({ kind: 'static3d' })` + `<Model motion>`；仅 native |
| **SpatializedDynamic3DElement（Reality 容器）** | **已交付** — `useSpatializedMotion({ kind: 'dynamic3d' })` + `<Reality motion>`；仅 native |
| **SpatialEntity（Reality 子节点）** | **不在本 change** — 继续 `useAnimation` |

## 3. 统一入口（推荐 API）

```typescript
const result = useSpatializedMotion({
  kind: 'spatialized2d', // | 'static3d' | 'dynamic3d'
  duration: 5,
  tracks: [/* … */],
})
// spatialized2d: result.style + result.motion + result.api
// static3d / dynamic3d: result.motion + result.api（无 style outlet）
```

| kind | React 绑定 | Core 写回 |
|------|------------|-----------|
| `spatialized2d` | `motion` on `enable-xr` div，`style` 合并 | native `element.transform` + opacity；浏览器可 Web RAF |
| `static3d` | `motion` on `<Model>` | native `modelTransform` + opacity |
| `dynamic3d` | `motion` on `<Reality>` | native 容器 `element.transform` + opacity |

## 4. Core 统一实现

| 对外 | 说明 |
|------|------|
| **`SpatializedMotionController`** | 唯一控制器实现；构造时传入 `kind` |
| **`SpatializedMotionHandle`** | imperative 接口（`play` / `pause` / `resume` / `cancel` / …） |
| `SpatializedMotionController` | 唯一 Core 控制器；`new SpatializedMotionController(config, kind)` |
| `element.motion(config)` | 各 `Spatialized*Element` 工厂，返回 `SpatializedMotionHandle` |
| `supports('useSpatializedMotion', [kind])` | 能力探测（`spatialized2d` / `static3d` / `dynamic3d`） |

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
