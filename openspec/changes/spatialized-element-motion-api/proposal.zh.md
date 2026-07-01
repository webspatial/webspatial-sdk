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
- v1 推荐公开主路径为 `from/to` 与 `timeline`
- `tracks` 继续作为内部 canonical 执行模型；当前实现 / 类型仍接受 `tracks` 输入作为兼容 / 高级 escape hatch，但它不是面向用户评审的主路径
- Plan A 的旧公共路径（`useAnimation` + `animation` prop）已从目标态 API 中移除

## 概览

```tsx
// 统一的空间动画 API — hook 与目标无关；目标在绑定时自动解析
// 返回的 style 是宿主状态闭环契约的一部分，必须合并回绑定宿主
<div enable-xr style={{ width: 300, height: 200, ...style }} xr-animation={animation}>
  <h2>Hello Spatial</h2>
</div>

// Static3D — 绑定到 <Model> 时自动解析为 static3d
<Model src="robot.usdz" style={{ ...style }} xr-animation={animation} />

// Dynamic3D — 绑定到 <Reality> 时自动解析为 dynamic3d
<Reality style={{ ...style }} xr-animation={animation}>
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
// Entity 不在本次容器 motion change 范围内；当前入口为
// useEntityAnimation()。未来可再收敛回 useAnimation family，
// 但不是当前 PR 行为。
```

## 目标解析（Target Resolution）

Hook 与目标无关 — 不接受 `kind` 参数。返回的 `animation` binding 携带一个**延迟目标槽位**。当 React 调和并挂载接受 `xr-animation={animation}` 的组件时，SDK 自动解析目标：

| 组件 | 解析目标 | `style` 行为 |
|------|---------|------------------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` | 合并/快照出口；开发者 MUST 将其合并回绑定宿主 |
| `<Model>` | `static3d` | 宿主状态闭环出口；开发者 MUST 将其合并回绑定宿主 |
| `<Reality>` | `dynamic3d` | 宿主状态闭环出口；开发者 MUST 将其合并回绑定宿主 |

**约束：**
- 单个 `animation` binding MUST NOT 同时绑定到多个组件（1:1 绑定）。
- bind 前调用 `api.play()` MAY 排队；绑定解析后播放开始。
- 应用 MUST 将返回的 `style` 合并到接收 `xr-animation` 的同一个宿主元素或组件上。不合并该 `style` 时，播放 MAY 仍然开始，但 `stop()`、`reset()`、`finish()`、自然结束或后续 resync 之后的终态视觉持久性不受保证。

## 变更内容

- **统一公共 API**：v1 用户主路径使用 `useAnimation(config)` 的 `from/to`（推荐）与 `timeline`（CSS `@keyframes` 风格）两种写法，二者内部统一归一化为 canonical tracks 执行。
- **Timeline 数据模型**：按属性的 track + 绝对时间 keyframe + 每轨 timingFunction 继续作为内部 canonical 配置模型；当前实现 / 类型仍保留 `tracks` 输入作为兼容 / 高级 escape hatch。
- **native-first 运行时路径**：所有 spatialized container kind 都通过 `SpatializedElement.createAnimation(config)` 创建 native `AnimationObject`；纯 Web runtime 对该能力返回 false，且不会启动 RAF playback fallback。
- **create-time timeline payload**：Core 通过 `CreateSpatializedElementAnimation` 发送编译后的 canonical `timeline` 文档；`duration`、`timingFunction`、`delay`、`loop`、`playbackRate` 等时序控制信息都内嵌在该 payload 中，不再作为 JSB 顶层字段存在。
- **2D style 语义**：2D 保留 `style` outlet 作为面向作者的合并/快照出口；应用 MUST 将其合并回绑定宿主，以便在 rerender 和 resync 后保持视觉状态闭环。它不是 pure Web playback backend。
- **3D style 语义**：Static3D 与 Dynamic3D 也将返回的 `style` 视为宿主状态闭环契约的一部分。播放仍由绑定的 `xr-animation` handle 驱动，但应用 MUST 将 `style` 合并回绑定宿主，以便在后续 rerender 和 resync 后保持终态视觉状态。
- **单一路径 Core 对象**：React `AnimationBinding` 最多绑定一个目标，并创建一个 Core `AnimationObject`；per-target controller alias 不属于目标态 API。
- **Entity 专用 API**：Entity transform animation 命名为 `useEntityAnimation(config)`，并继续保留在独立的 `AnimateTransform` 栈上。
- **Animating mask 所有权**：播放期间由 native `SpatializedElement` runtime / write adapter 持有被动画控制的字段（opacity 属性级、transform 整体级），而不是依赖 React Portal suppression。
- **会话语义**：状态机、生命周期回调、错误处理在所有路径上统一。
- **Controller surface**：`pause()` / `resume()` 只表示整体会话控制；选择性 pause/resume 本次变更明确不做。如果未来需要局部控制，必须在新的 proposal 中设计独立的 track/action 级 API。
- **legacy 删除目标**：旧的 `animation` prop 路径、legacy SpatialDiv session hook 路径，以及 visionOS 专用的旧 2D backend path 已从目标态中移除；目标态仅保留统一的 `xr-animation` motion 路径。
- **能力探测**：运行时能力探测使用单一 `supports('useAnimation')` key 表达发布后的 motion API 是否可用。`spatialized2d`、`static3d`、`dynamic3d` 等目标名仍是内部绑定解析 kind，不再是 capability sub-token。
- **timeline 命名**：`timeline` 指单个 CSS `@keyframes` 风格的百分比关键帧对象，不是串行动画编排器。v1 不支持 `timeline: []`、多个 action 或多段编排语义。

## PR 1236 后续修复

PR 1236 在 `useAnimation` 重命名落地后暴露出一批 React motion surface 的模块设计问题：

- `useAnimation` 与 `useEntityAnimation` 的入口仍通过含混的文件名和分散的导出路径暴露。
- React 侧仍重复承担了一部分本应属于 Core 的职责，尤其是 `autoStart` 触发和 motion kind 维护。
- SpatialDiv、Model、Reality 三种容器的 binding 生命周期逻辑仍有重复实现。
- binding 协议里仍保留重复的 suppression 访问面。

本次 follow-up 不改变公开 API，但会收紧实现边界：

- `useAnimation` 继续作为 SpatialDiv、Model、Reality 的默认容器动画 hook。
- `useEntityAnimation` 继续保持 entity 专用。
- `useSpatializedMotion` 不再作为主概念或公开路由名使用。
- React 只负责生命周期接线、target binding、保持 tuple 形态一致的 `style` outlet 和容器适配。
- Core 继续负责 config 归一化、校验、canonical timeline 编译、`AnimationObject` 生命周期，以及 bind-time auto-start 行为。

## 两阶段命名迁移

- **Phase 1**：先把当前公共 `useAnimation` 导出重命名为 `useEntityAnimation`，并优先重构 Entity 相关的 `test-server` 页面，先释放 `useAnimation` 这个符号。
- **Phase 2**：再把空间动画 hook 重命名为 `useAnimation`，保持现有目标无关 timeline 语义不变，同时把空间动画相关的 `test-server` 页面迁移到新的 import 和能力探测名称。
- **验证范围**：两个阶段都需要同步更新对应的 `test-server` 页面，并确认重构后的页面仍可正常渲染和控制播放。

## 能力

### 新增

- `spatialized-element-motion` — 伞式需求与按 kind 矩阵。
- `spatialized-2d-motion` — 2D timeline + native-first `AnimationObject` 路径。
- `spatialized-static3d-motion` — Model 根 transform timeline（仅 native）。
- `spatialized-dynamic3d-motion` — Reality 容器 transform timeline（仅 native）。

### 修改

- `runtime-capabilities` — 文档化 `supports('useAnimation')` 是 motion API 的唯一能力 gate。

### 推迟

- `spatialized-entity-motion` — Entity transform timeline 通过 `useEntityAnimation`（独立栈，不属于容器 `AnimationObject` 路径）。

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
- **能力契约**：`supports('useAnimation')` 是发布后的容器 motion 公开能力 gate。`useAnimation` 不再暴露 `element`、`static3d` 或 `dynamic3d` target sub-token；legacy `entity` sub-token 继续保留给 `useEntityAnimation`。
- **破坏性变更**：有；当前公共 `useAnimation` 会迁移为 `useEntityAnimation`，当前空间动画 hook 会迁移为 `useAnimation`。