## 为什么

三种空间化容器（2D / Model / Reality）需要统一的 timeline 动画 API。动画建模为 native **`AnimationObject : SpatialObject`**：`createAnimation` 锁定 timeline，uuid 由 native 生成，状态经 WebMsg 广播。

## 概览

```tsx
const [animation, api, style] = useAnimation({ from: {...}, to: {...}, duration: 0.6 })
<div enable-xr xr-animation={animation} />
<Model xr-animation={animation} />
<Reality xr-animation={animation} />
```

**仅 native runtime**；纯 Web 不支持 `useAnimation`。

## 变更要点

- `SpatializedElement.createAnimation(config)` + `AnimationObject` 播放 API
- JSB：`CreateSpatializedElementAnimation` + `ControlSpatializedElementAnimation`
- WebMsg：`SpatialAnimationStateChanged`
- Element animating mask（无 Portal 耦合）
- 移除 `SpatializedMotionController`、Web RAF、`AnimateSpatializedElementMotion`

## 规范文档

| 文件 | 用途 |
|------|------|
| [specs/spatialized-element-motion/spec.zh.md](./specs/spatialized-element-motion/spec.zh.md) | **唯一 normative spec**（含三种 kind 差异） |
| [design.zh.md](./design.zh.md) | 架构与 JSB 细节 |
| [API.zh.md](./API.zh.md) | 开发者 API 摘要 |
| [tasks.zh.md](./tasks.zh.md) | 实现任务 |

## 能力

- `spatialized-element-motion` — 唯一 capability（2D / Static3D / Dynamic3D 差异内联于 spec 表格）

## 非目标

布局字段动画、Static3D 材质动画、USD clip 与 timeline 合并、Web RAF、`updateConfig` 热更新
