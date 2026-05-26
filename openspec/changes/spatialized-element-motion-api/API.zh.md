# SpatializedElement 声明式动画 — Umbrella 摘要

> Change: `openspec/changes/spatialized-element-motion-api/`  
> **已交付（2D only）:** `openspec/changes/spatial-div-motion-api/` + `useSpatialDivMotion`  
> **能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

## 1. 产品目标

对 **所有主要 SpatializedElement 类型** 提供统一的 **timeline + 声明式 playback API**，而不是仅 SpatialDiv。

## 2. 当前实现状态（诚实表述）

| 类型 | 状态 |
|------|------|
| **Spatialized2DElement** | **已交付** — `useSpatialDivMotion` / `SpatializedMotionController` / `element.motion()` |
| **SpatializedStatic3DElement** | **已交付** — `useSpatializedMotion({ kind: 'static3d' })`，仅 native |
| **SpatializedDynamic3DElement（Reality 容器）** | **已交付** — `useSpatializedMotion({ kind: 'dynamic3d' })` / `<Reality motion={…}>`，仅 native |
| **SpatialEntity（Reality 子节点）** | **不在本 change** — 继续 `useAnimation` |

## 3. 统一入口（目标 API）

```typescript
const { outlet, api, binding } = useSpatializedMotion({
  kind: 'spatialized2d', // | 'static3d' | 'dynamic3d'
  duration: 5,
  tracks: [/* … */],
})
```

- **2D:** `outlet` = `style`，`binding` = `motion`
- **Static3D:** `outlet` = `{ entityTransform, opacity? }`，`binding` = `motion` on `<Model>`
- **Dynamic3D（Reality）:** `binding` = `motion` on `<Reality>`（容器 `element.transform` + opacity）

## 4. 与模型内嵌动画区分

`<Model ref.play()>` 播放 USD 片段；**不要**与 `motion.play()` timeline 混为同一 API。
