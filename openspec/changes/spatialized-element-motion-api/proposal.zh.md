## 为什么

声明式空间动画的产品需求**不局限于 HTML SpatialDiv**（`Spatialized2DElement`）。开发者期望在以下三类容器上拥有统一的 **timeline + 播放 API** 心智模型：

- **Spatialized2DElement**（2D 面板 / `enable-xr` div）
- **SpatializedStatic3DElement**（`<Model>` — 根 transform + opacity）
- **SpatializedDynamic3DElement**（`<Reality>` 容器 — 根 transform + opacity）

### 历史背景

本提案统一了此前两次迭代：

1. **Plan A — 会话动画 API**（`spatial-div-animation-api`，已归档）
   - 引入 `useAnimation(config)` + `animation` prop 用于 SpatialDiv
   - 单段 `from`/`to`，仅 native 播放
   - 确立了：属性白名单、会话状态机、Portal 抑制、生命周期回调
   - 仅作为历史背景保留；legacy 公共入口及其 backend path 已从目标态 API 中移除

2. **Plan B — Motion Timeline API**（`spatial-div-motion-api`，已归档）
   - 引入 `useAnimation(config)` 多轨 timeline + `style` outlet
   - 双后端：Web RAF 降级 + native timeline 播放
   - 将 `animation` binding 更名为 `xr-animation` binding，并开始回传 `style`、定义 `style` 的同步规则

本**伞式变更**将两者合并为单一规范 surface：
- Plan B 的 **timeline 数据模型** 为规范配置形状
- Plan A 的 **会话语义** 仅作为归档 spec 中的历史参考保留；目标态 API 为统一的 `xr-animation` motion 路径
- 覆盖范围扩展到 Static3D 和 Dynamic3D（仅 native，无 Web RAF）
- `useAnimation` 的所有 authoring 形状（`from/to`、`timeline`、`tracks`）都编译为同一个 canonical `tracks` 执行模型
- Plan A 的旧公共路径（`useAnimation` + `animation` prop）已从目标态 API 中移除

## 概览

```tsx
// 统一的空间动画 API — hook 与目标无关；目标在绑定时自动解析
const [animation, api, style] = useAnimation({
  duration: 5,
  tracks: [
    { property: 'transform.translate.x', keyframes: [{ at: 0, value: 0 }, { at: 5, value: 100 }], timingFunction: 'linear' },
    { property: 'opacity', keyframes: [{ at: 3, value: 0 }, { at: 5, value: 1 }], timingFunction: 'easeOut' },
  ],
})

// 2D — 绑定到 enable-xr 节点时自动解析为 spatialized2d
<div enable-xr style={{ width: 300, height: 200, ...style }} xr-animation={animation}>
  <h2>Hello Spatial</h2>
</div>

// Static3D — 绑定到 <Model> 时自动解析为 static3d
<Model src="robot.usdz" xr-animation={animation} />

// Dynamic3D — 绑定到 <Reality> 时自动解析为 dynamic3d
<Reality xr-animation={animation}>
  <Entity position={{ x: 0, y: 1, z: -2 }} />
</Reality>

// from/to 配置（推荐默认，等价于 Plan A 的 from/to）
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// Entity transform animation 保持独立命名和独立栈
const [animation, api] = useEntityAnimation({
  from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5,
})
// Entity 示例当前仍位于独立 entity 栈；在 API 重新收敛前，
// capability 仍通过 `useAnimation:entity` 进行探测。
```

## 目标解析（Target Resolution）

Hook 与目标无关 — 不接受 `kind` 参数。返回的 `animation` binding 携带一个**延迟目标槽位**。当 React 调和并挂载接受 `xr-animation={animation}` 的组件时，SDK 自动解析目标：

| 组件 | 解析目标 | `style` 行为 |
|------|---------|------------------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` | 活跃 CSSProperties（Web RAF 驱动） |
| `<Model>` | `static3d` | 空对象 `{}`（仅 native，可安全展开） |
| `<Reality>` | `dynamic3d` | 空对象 `{}`（仅 native，可安全展开） |

**约束：**
- 单个 `animation` binding MUST NOT 同时绑定到多个组件（1:1 绑定）。
- bind 前调用 `api.play()` MAY 排队；绑定解析后播放开始。

## 变更内容

- **统一公共 API**：`useAnimation(config)` 接受 `from/to`（推荐）、`tracks`（高级）或 `timeline`（CSS @keyframes 风格）三种互斥配置，内部统一编译为 tracks 执行，返回 `[animation, api, style]`。
- **Timeline 数据模型**：按属性的 track + 绝对时间 keyframe + 每轨 timingFunction — 规范配置形状。
- **2D 双后端**：native 不可用时走 Web RAF；WebSpatial 运行时 native 侧统一走 canonical tracks 路径。
- **3D 仅 native**：Static3D 和 Dynamic3D 仅使用 native `animateMotion`（无 Web RAF 降级）。
- **单一 Core 控制器**：`SpatializedMotionController`，通过 `MOTION_KIND_POLICIES` 按 kind 分派。
- **Entity 专用 API**：Entity transform animation 命名为 `useEntityAnimation(config)`，并继续保留在独立的 `AnimateTransform` 栈上。
- **Portal 抑制**：native 播放期间抑制被动画控制的字段（opacity 属性级、transform 整体级）。
- **会话语义**：状态机、生命周期回调、错误处理在所有路径上统一。
- **legacy 删除目标**：旧的 `animation` prop 路径、legacy SpatialDiv session hook 路径，以及 visionOS 专用的旧 2D backend path 已从目标态中移除；目标态仅保留统一的 `xr-animation` motion 路径。
- **能力探测**：运行时能力探测继续使用 `useAnimation` family key 和其 subtoken（`entity`、`element`、`static3d`、`dynamic3d`）。判断具体能力时 MUST 使用 subtoken。之所以保留 family 级命名，是因为长期路线仍计划把 `useEntityAnimation` 再整合回 `useAnimation` family。

## 两阶段命名迁移

- **Phase 1**：先把当前公共 `useAnimation` 导出重命名为 `useEntityAnimation`，并优先重构 Entity 相关的 `test-server` 页面，先释放 `useAnimation` 这个符号。
- **Phase 2**：再把空间动画 hook 重命名为 `useAnimation`，保持现有目标无关 timeline 语义不变，同时把空间动画相关的 `test-server` 页面迁移到新的 import 和能力探测名称。
- **验证范围**：两个阶段都需要同步更新对应的 `test-server` 页面，并确认重构后的页面仍可正常渲染和控制播放。

## 能力

### 新增

- `spatialized-element-motion` — 伞式需求与按 kind 矩阵。
- `spatialized-2d-motion` — 2D timeline + 双后端（参考实现）。
- `spatialized-static3d-motion` — Model 根 transform timeline（仅 native）。
- `spatialized-dynamic3d-motion` — Reality 容器 transform timeline（仅 native）。

### 修改

- `runtime-capabilities` — 文档化每种 kind 的 motion 后端 sub-token。

### 推迟

- `spatialized-entity-motion` — Entity transform timeline 通过 `useEntityAnimation`（独立栈，不走 `SpatializedMotionController`）。

## 非目标

- 动画化任何 kind 的布局字段（`width`、`height`、`back`、`depth`）。
- 替代 Model 上的 USD clip 播放（`ref.play()` / `pause()`）。
- v1 中 Static3D 的材质/变体动画。
- 完整物理/弹簧模拟（仅 timingFunction + keyframes）。
- 任意 CSS transform 字符串插值或 matrix/skew/perspective。

## 影响

- **包**：`@webspatial/react-sdk`、`@webspatial/core-sdk`、visionOS native bridge/runtime。
- **公共 API**：空间动画使用 `useAnimation`，Entity transform 使用 `useEntityAnimation`，其余包括 `SpatializedMotionConfig`、`SpatializedPlaybackApi` 以及 `<Model>` 和 `<Reality>` 上的 `xr-animation` binding prop。
- **迁移形态**：命名调整分两阶段落地，先迁移 Entity demo，再迁移空间动画 demo；legacy `animation` prop 路径已移除，不再保留兼容层。
- **能力契约**：`supports('useAnimation')` 仅保留 family 级探测语义。调用方 MUST 使用 `supports('useAnimation', [subtoken])` 判断 `entity`、`element`、`static3d` 或 `dynamic3d` 是否在当前运行时可用。
- **破坏性变更**：有；当前公共 `useAnimation` 会迁移为 `useEntityAnimation`，当前空间动画 hook 会迁移为 `useAnimation`。
