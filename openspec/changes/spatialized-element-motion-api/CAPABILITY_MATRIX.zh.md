# 空间化元素动画 — 能力矩阵

| 元素 kind | Core 类型 | React surface | Timeline | Web 支持 | Native 后端 | 能力 token |
|-----------|-----------|---------------|----------|----------|-------------|-----------|
| **2D** | `Spatialized2DElement` | `useAnimation` → `[animation, api, style]` + `xr-animation` | 是 | **否** | `AnimationObject` + `SpatializedElementMotionManager` | `supports('useAnimation', ['element'])` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation>` + `useAnimation` | 是 | **否** | 同上 | `supports('useAnimation', ['static3d'])` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation>` + `useAnimation` | 是 | **否** | 同上 | `supports('useAnimation', ['dynamic3d'])` |

**对象模型：** `SpatializedElement.createAnimation(config)` → native `AnimationObject : SpatialObject`（uuid 由 native 生成）。timeline 在 create 时锁定。控制走 `ControlSpatializedElementAnimation`。状态走 `SpatialAnimationStateChanged` WebMsg。

**能力契约：** `supports('useAnimation', [subtoken])` 仅在 native spatial runtime 为 true。

## 属性白名单（v1）

| Kind | 可动画路径 |
|------|-----------|
| 2D | `opacity`、`transform.translate.*`、`transform.rotate.*`、`transform.scale.*` |
| Static3D | `transform.*` → `modelTransform`；无 opacity sink |
| Dynamic3D | 同 2D，作用于容器 `element.transform` + opacity |

## 独立 API

| API | 用途 |
|-----|------|
| Model `ref.play()` / `pause()` | USD 内嵌 clip |
| `AnimationObject.play()` | 容器声明式 timeline |
