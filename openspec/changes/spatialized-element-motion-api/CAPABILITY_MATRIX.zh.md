# 空间化元素动画 — 能力矩阵

| 元素 kind | Core 类型 | React surface | 目标态 timeline | Web RAF 降级 | Native object 路径 | 能力 token |
|-----------|-----------|---------------|----------------|-------------|------------------|-----------|
| **2D** | `Spatialized2DElement` | `useAnimation(config)` → `[animation, api, style]` | 目标态 | **否** | 通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject` | `supports('useAnimation')` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | 目标态 | **否** | 通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject` | `supports('useAnimation')` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | 目标态 | **否** | 通过 `SpatializedElement.createAnimation(config)` 创建 `AnimationObject` | `supports('useAnimation')` |

**目标态说明：** React 使用单一 opaque `AnimationProxy`；native playback 使用通过 `SpatializedElement.createAnimation(config)` 创建的 `AnimationObject : SpatialObject`。

**能力契约：** `supports('useAnimation')` 是发布后的容器 motion 能力 gate。`useAnimation` 不再暴露按目标拆分的 `element`、`static3d`、`dynamic3d` sub-token；legacy `entity` sub-token 继续保留给 `useEntityAnimation`。

**不在本变更范围：** Reality 内部的 `SpatialEntity` transform timeline — 当前继续使用 `useEntityAnimation` / `AnimateTransform`。该路径同样使用 `supports('useAnimation')` gate。

## 属性白名单（汇总）

| Kind | 可动画路径（v1） |
|------|----------------|
| 2D | `opacity`、`transform.translate.*`、`transform.rotate.*`、`transform.scale.*` |
| Static3D | `opacity`、`transform.translate.*`、`transform.rotate.*`、`transform.scale.*` 应用到 `modelTransform` + host opacity |
| Dynamic3D | 同 2D（应用到容器 `element.transform` + opacity） |

## 独立 API（不合并）

| API | 用途 |
|-----|------|
| Model `ref.play()` / `pause()` | USD 内嵌动画 clip |
| `api.play()` / timeline | 空间化容器上的声明式 transform / opacity timeline；Static3D target 支持 model 根 transform 和 host opacity |