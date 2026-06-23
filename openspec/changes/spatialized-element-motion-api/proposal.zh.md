## 为什么

对三种空间化容器提供统一的声明式 timeline 动画：

- **Spatialized2DElement**（`enable-xr` div）
- **SpatializedStatic3DElement**（`<Model>`）
- **SpatializedDynamic3DElement**（`<Reality>` 容器）

动画以 **Native 一等对象**（`AnimationObject : SpatialObject`）建模：由 `SpatializedElement.createAnimation(config)` 创建，**uuid 由 native 生成**；timeline 在创建时锁定；播放状态由 native 独占并通过 WebMsg 广播。

## 概览

```tsx
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// 绑定时 createAnimation(config) → native AnimationObject
<div enable-xr xr-animation={animation} />
<Model src="robot.usdz" xr-animation={animation} />
<Reality xr-animation={animation}><Entity /></Reality>

api.play()   // ControlSpatializedElementAnimation
api.pause()
api.stop()
```

**平台约束：** `useAnimation` **仅**在 native spatial runtime 可用时工作。纯 Web 环境不支持；开发者使用 CSS animation、framer-motion 等替代方案。

## 核心对象模型

| 层 | 对象 | 职责 |
|----|------|------|
| Native | `AnimationObject : SpatialObject` | 锁定 timeline、帧采样、写入 element、广播状态 |
| Core | `AnimationObject extends SpatialObject` | uuid 句柄、`play/pause/...`、`destroy()` |
| Core | `SpatializedElement.createAnimation(config)` | 归一化 config → Create JSB → 返回句柄 |
| React | `useAnimation` + `AnimationProxy` | bind 前 API 排队；bind 时 create + flush |

## 变更内容

- **创建即锁定 timeline**：`createAnimation(config)` 时编译 canonical tracks 并传给 native；后续控制命令不带 timeline。改动画须 `destroy()` 后重新 `createAnimation`。
- **JSB 拆分**：`CreateSpatializedElementAnimation`（创建）+ `ControlSpatializedElementAnimation`（控制）；移除合一的 `AnimateSpatializedElementMotion`。
- **状态广播**：native → JS 统一 `SpatialAnimationStateChanged`（`animationId` + `action` + 可选 `values`）。
- **Element 级抑制**：播放期间 native `SpatializedElement` 设置 animating mask，忽略冲突的 transform/property JSB；**不**与 `PortalInstanceObject` 耦合。
- **移除 Web RAF**：Core 不含 `WebPlaybackBackend`；无 native 时 `useAnimation` 抛错或 documented fail-fast。
- **销毁**：`animationObject.destroy()` 走通用 `DestroyCommand`。
- **React 创建时机**：`xr-animation` 绑定、element 就绪后 `createAnimation`；bind 前 `api.play()` 由 `AnimationProxy` 排队。

## 能力

### 新增

- `spatialized-element-motion` — 伞式需求与对象模型
- `spatialized-2d-motion` — 2D 容器
- `spatialized-static3d-motion` — Model 根 `modelTransform`
- `spatialized-dynamic3d-motion` — Reality 容器 transform + opacity

### 修改

- `runtime-capabilities` — `supports('useAnimation', ['element'|'static3d'|'dynamic3d'])` 仅在 native runtime 为 true

## 非目标

- `SpatialEntity` 子节点动画（不在本 change）
- 布局字段动画（`width`、`height`、`back`、`depth`）
- Model USD clip 播放（`ref.play()`）与 timeline 合并
- Static3D 材质/变体动画
- 纯 Web 环境的 `useAnimation` / Core RAF 后端
- `updateConfig` 热更新已锁定 timeline（须 destroy + recreate）

## 影响

- **包**：`@webspatial/react-sdk`、`@webspatial/core-sdk`、visionOS native
- **破坏性**：替换 `SpatializedMotionController` + `AnimateSpatializedElementMotion` 路径；删除 Web RAF fallback
