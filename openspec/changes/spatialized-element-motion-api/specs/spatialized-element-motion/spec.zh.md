# 空间化元素动画

## 新增需求

### Requirement: 绑定时解析目标的声明式动画

平台 MUST 为 `spatialized2d`、`static3d`、`dynamic3d` 提供声明式 timeline 动画。公开 hook MUST NOT 需要 `config.kind`；目标在 `animation` 作为 `xr-animation` 传给组件时解析：

| 组件 | 解析目标 | Native 写入 |
|------|---------|-------------|
| `<div enable-xr>` | `spatialized2d` | `element.transform` + `opacity` |
| `<Model>` | `static3d` | `modelTransform`（无 opacity sink） |
| `<Reality>` | `dynamic3d` | 容器 `element.transform` + `opacity` |

能力 token：`supports('useAnimation', ['element'|'static3d'|'dynamic3d'])`，仅在 native runtime 为 true。纯 Web **不支持** `useAnimation`。

### Requirement: AnimationObject 由 SpatializedElement 创建

`SpatializedElement` MUST 提供 `createAnimation(config)` → `CreateSpatializedElementAnimation` JSB → native `AnimationObject : SpatialObject`，返回 Core 句柄，`id` = native uuid。

Timeline MUST 在 create 时编译为 canonical `tracks` 并**锁定**；控制命令不带 timeline。改 config MUST `destroy()` 后重新 `createAnimation`。

#### Scenario: timeline 锁定

- **WHEN** `createAnimation(configA)` 后 `play()`，应用再持有 `configB`
- **THEN** SDK MUST NOT 将 `configB` 应用到该对象；须 destroy + recreate

### Requirement: AnimationObject 生命周期

- `destroy()` 走通用 `DestroyCommand`；停止帧驱动、清除 animating mask
- `play` / `pause` / `resume` / `stop` / `reset` / `finish` — 整体会话，无 `keys` 参数
- 终止回调 `onComplete` / `onStop` / `onReset` 互斥；`onError` 独立

### Requirement: Native 状态与 WebMsg

播放状态由 native 独占，通过 `SpatialAnimationStateChanged`（`animationId` + `action` + 可选 `values`）广播。Core `playState` MUST 以此为准。

JSB：`CreateSpatializedElementAnimation` + `ControlSpatializedElementAnimation`。`AnimateSpatializedElementMotion` MUST NOT 为目标态协议。

### Requirement: Element animating mask

播放期间 native `SpatializedElement` 标记 animating 字段；冲突的 `UpdateSpatializedElementTransform` 等 JSB MUST 被忽略。MUST NOT 依赖 `PortalInstanceObject`。

### Requirement: React bind 与 Proxy

`useAnimation` 返回 `[animation, api, style]`。bind 后 `createAnimation`；bind 前 `api` 调用由 `AnimationProxy` 排队。config 变更 → destroy + recreate。单 binding 仅允许绑定一个组件。

`style`：2D 可为初始 `from` 预览；播放中由 native 写入。Static3D / Dynamic3D 为 `{}`。

### Requirement: Authoring 与校验

互斥配置：`from/to`、`timeline`（百分比关键帧）、或高级 `tracks`（内部 canonical 模型）。`createAnimation` 前 MUST `validateSpatializedMotionConfig`。

可动画属性：`opacity`、`transform.translate|rotate|scale.*`。布局字段（`width`、`height`、`back`、`depth`）MUST 拒绝。Static3D opacity track MUST 拒绝或忽略。

### Requirement: Model clip 独立

`ref.play()` / `pause()` USD clip MUST 与 `AnimationObject` timeline 无关。
