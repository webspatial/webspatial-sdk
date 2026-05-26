# SpatializedElement 声明式动画 — Umbrella 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **2D 细节（Plan B）:** `openspec/changes/spatial-div-motion-api/`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **三种 spatialized 容器** 提供统一的 **timeline + 声明式 playback API**（2D / Static3D Model / Dynamic3D Reality 根节点）。

## 2. 当前实现状态

| 类型 | 状态 |
|------|------|
| **Spatialized2DElement** | **已交付** — `useSpatializedMotion({ kind: 'spatialized2d' })`；别名 `useSpatialDivMotion` |
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

**兼容别名（@deprecated，行为相同）：** `useSpatialDivMotion`、`useStatic3DMotion`、`useDynamic3DMotion`。

## 4. Core 统一实现

| 对外 | 说明 |
|------|------|
| **`SpatializedMotionController`** | 唯一控制器实现；构造时传入 `kind` |
| **`SpatializedMotionHandle`** | imperative 接口（`play` / `pause` / `resume` / `cancel` / …） |
| `SpatialDivMotionController` 等 | 薄子类，等价于 `new SpatializedMotionController(config, kind)` |
| `element.motion(config)` | 各 `Spatialized*Element` 上的工厂，返回 `SpatializedMotionHandle` |

## 5. 与模型内嵌动画区分

`<Model ref.play()>` 播放 USD 片段；**不要**与 `motion.play()` timeline 混为同一 API。

## 6. 演示页（test-server）

- Hub: `/#/spatial-div-motion`（侧栏 **Spatialized Motion**）
- 2D: `multi-track` 等
- Static3D: `/#/spatial-div-motion/model-container`
- Dynamic3D: `/#/spatial-div-motion/reality-container`
