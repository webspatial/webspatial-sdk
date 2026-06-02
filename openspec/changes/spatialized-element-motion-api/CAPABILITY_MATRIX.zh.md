# 空间化元素动画 — 能力矩阵

| 元素 kind | Core 类型 | React surface | 已交付 timeline | Web RAF 降级 | Native 后端 | 能力 token |
|-----------|-----------|---------------|----------------|-------------|-------------|-----------|
| **2D** | `Spatialized2DElement` | `useAnimation(config)` → `[animation, api, style]` | 是 | 是 | `SpatialDivAnimationManager` | `supports('useAnimation', ['element'])` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | 是 | **否** | `SpatializedContainerMotionAnimationManager` | `supports('useAnimation', ['static3d'])` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | 是 | **否** | `SpatializedContainerMotionAnimationManager` | `supports('useAnimation', ['dynamic3d'])` |

**实现说明：** TypeScript 使用**单一** `SpatializedMotionController` 覆盖三种 kind；native 侧 Static3D/Dynamic3D 共享 `SpatializedContainerMotionAnimationManager` + `SpatializedMotionTransformSink`，2D 使用独立的 `SpatialDivAnimationManager`。

**不在本变更范围：** Reality 内部的 `SpatialEntity` transform timeline — 继续使用现有 `useAnimation` / `AnimateTransform`。

## 属性白名单（汇总）

| Kind | 可动画路径（v1） |
|------|----------------|
| 2D | `opacity`、`transform.translate.*`、`transform.rotate.*`、`transform.scale.*` |
| Static3D | 同 2D（应用到 `modelTransform`） |
| Dynamic3D | 同 2D（应用到容器 `element.transform` + opacity） |

## 独立 API（不合并）

| API | 用途 |
|-----|------|
| Model `ref.play()` / `pause()` | USD 内嵌动画 clip |
| `motion.play()` / timeline | 空间化容器上的声明式 transform / opacity timeline |
