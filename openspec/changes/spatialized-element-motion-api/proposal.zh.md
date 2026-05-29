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
   - 作为向后兼容子路径保留（见 `specs/legacy-session-animation/`）

2. **Plan B — Motion Timeline API**（`spatial-div-motion-api`，已归档）
   - 引入 `useSpatializedMotion(config)` 多轨 timeline + `style` outlet
   - 双后端：Web RAF 降级 + native timeline 播放
   - 将 `animation` binding 更名为 `xr-animation` binding，并开始回传 `style`、定义 `style` 的同步规则

本**伞式变更**将两者合并为单一规范 surface：
- Plan B 的 **timeline 数据模型** 为规范配置形状
- Plan A 的 **会话语义**（状态机、抑制、生命周期）保持规范性
- 覆盖范围扩展到 Static3D 和 Dynamic3D（仅 native，无 Web RAF）
- `useSpatializedMotion` 的所有 authoring 形状（`from/to`、`timeline`、`tracks`）都编译为同一个 canonical `tracks` 执行模型

## 概览

```tsx
// 统一 API — hook 与目标无关；目标在绑定时自动解析
const [animation, api, style] = useSpatializedMotion({
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
const [animation, api, style] = useSpatializedMotion({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// 旧版 Plan A（仍可用，新代码不推荐）
const [animation, api] = useAnimation({
  from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5,
})
<div enable-xr animation={animation} />
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

- **统一公共 API**：`useSpatializedMotion(config)` 接受 `from/to`（推荐）、`tracks`（高级）或 `timeline`（CSS @keyframes 风格）三种互斥配置，内部统一编译为 tracks 执行，返回 `[animation, api, style]`。
- **Timeline 数据模型**：按属性的 track + 绝对时间 keyframe + 每轨 timingFunction — 规范配置形状。
- **2D 双后端**：native 不可用时走 Web RAF；WebSpatial 运行时 native 侧统一走 canonical tracks 路径。
- **3D 仅 native**：Static3D 和 Dynamic3D 仅使用 native `animateMotion`（无 Web RAF 降级）。
- **单一 Core 控制器**：`SpatializedMotionController`，通过 `MOTION_KIND_POLICIES` 按 kind 分派。
- **旧版兼容**：Plan A `useAnimation` + `animation` prop 对 SpatialDiv 保留，但作为独立兼容路径存在。
- **Portal 抑制**：native 播放期间抑制被动画控制的字段（opacity 属性级、transform 整体级）。
- **会话语义**：状态机、生命周期回调、错误处理在所有路径上统一。
- **能力探测**：`supports('useSpatializedMotion', [target])`，支持 `spatialized2d` | `static3d` | `dynamic3d`。

## 能力

### 新增

- `spatialized-element-motion` — 伞式需求与按 kind 矩阵。
- `spatialized-2d-motion` — 2D timeline + 双后端（参考实现）。- `spatialized-static3d-motion` — Model 根 transform timeline（仅 native）。
- `spatialized-dynamic3d-motion` — Reality 容器 transform timeline（仅 native）。

### 修改

- `runtime-capabilities` — 文档化每种 kind 的 motion 后端 sub-token。

### 保留（旧版）

- `spatial-div-animation` — Plan A 会话 API 用于 SpatialDiv（向后兼容，新代码不推荐）。

### 推迟

- `spatialized-entity-motion` — Entity transform timeline 通过 `useAnimation`（独立栈，不走 `SpatializedMotionController`）。

## 非目标

- 动画化任何 kind 的布局字段（`width`、`height`、`back`、`depth`）。
- 替代 Model 上的 USD clip 播放（`ref.play()` / `pause()`）。
- v1 中 Static3D 的材质/变体动画。
- 完整物理/弹簧模拟（仅 timingFunction + keyframes）。
- 任意 CSS transform 字符串插值或 matrix/skew/perspective。

## 影响

- **包**：`@webspatial/react-sdk`、`@webspatial/core-sdk`、visionOS native bridge/runtime。
- **公共 API**：`useSpatializedMotion` hook、`SpatializedMotionConfig`、`SpatializedPlaybackApi`、`<Model>` 和 `<Reality>` 上的 `xr-animation` binding prop。
- **旧版 API**：用于 SpatialDiv 的 `useAnimation` 保持可用（无破坏性变更）。
- **破坏性变更**：无。本变更为纯增量。