# 旧版会话动画（Plan A 兼容层）

## 状态

已被 `useSpatializedMotion`（timeline API）取代。保留用于现有 `useAnimation` + `animation` prop 集成在 `Spatialized2DElement` 上的向后兼容。

## 范围

本子规范记录了 **Plan A 会话式动画 API**（`useAnimation(config)` + `animation` prop）在统一空间化元素动画系统中的兼容层角色。新集成 SHOULD 使用 `useSpatializedMotion`。

## 与当前架构的关系

| 方面 | 旧版（Plan A） | 当前（Plan B / 统一） |
|------|---------------|---------------------|
| Hook | `useAnimation(config)` | `useSpatializedMotion(config)` |
| 绑定方式 | `animation` prop 传给 `enable-xr` 节点 | `style` 合并 + 可选 `motion` binding |
| 配置形状 | `from` / `to` 单段 | `from/to`（推荐）或 `tracks[]` 带 keyframes（互斥） |
| 播放后端 | 仅 native | Web RAF + native（双后端） |
| 支持 kind | 仅 `spatialized2d` | `spatialized2d`、`static3d`、`dynamic3d` |
| 能力 token | `supports('useAnimation', ['element'])` | `supports('useSpatializedMotion', [kind])` |

## 保留的需求

以下来自原始 `spatial-div-animation-api` spec 的需求对旧版路径仍然具有规范性：

### Requirement: 旧版 useAnimation hook 返回 [animation, api]

应用代码为 SpatialDiv 调用 `useAnimation(config)` 时，hook MUST 返回 `[animation, api]`，其中 `api` 暴露 `play`、`pause`、`cancel`、`isAnimating`、`isPaused`、`finished`、`playState`。

### Requirement: animation prop 仅绑定 SpatialDiv

`animation` 对象 MUST 传给 `enable-xr` HTML 节点。绑定到非空间化节点 MUST 发出 warning，`play()` MUST 为 no-op。同一 `animation` 对象 MUST NOT 跨元素复用。

### Requirement: 白名单属性（与统一规范一致）

旧版动画支持相同的视觉白名单：`transform.translate.x/y/z`、`transform.rotate.x/y/z`、`transform.scale.x/y/z`、`opacity`。影响布局的字段 MUST 被拒绝。

### Requirement: 会话状态机

会话状态（`idle`、`queued`、`delaying`、`running`、`paused`、`finished`）以及 `isAnimating`/`isPaused`/`finished`/`playState` 语义 MUST 与统一规范一致。完整场景覆盖见归档的 `spatial-div-animation/spec.md`。

### Requirement: 命令式播放与生命周期

`play`、`pause`、`cancel` 和生命周期回调（`onStart`、`onComplete`、`onCancel`、`onError`）MUST 遵循归档 spec 中记录的相同语义。

### Requirement: 播放期间 Portal 抑制

`opacity` 的属性级抑制和 transform 整体抑制 MUST 防止普通 DOM 同步覆盖动画中间态。抑制释放时机和 `cancel` 恢复到 `from` 保持不变。

### Requirement: 卸载时清理

alive 会话在卸载时 MUST 被停止/取消，且 MUST NOT 触发生命周期回调。

## 段降级（与 timeline API 互操作）

当 `useSpatializedMotion({ from, to })` 配置编译为 tracks 后，每个属性恰好有两个 keyframe（`at: 0` 和 `at: duration`）且共享一个 easing 时，SDK MAY 将其编译为旧版段 `play` 命令（`from`/`to`）发送到 native。这是内部优化；公共 API 为 `useSpatializedMotion`。

## 废弃路径

- 用于 SpatialDiv 的 `useAnimation` 保持可用，但文档 SHOULD 引导作者使用 `useSpatializedMotion`。
- `enable-xr` 节点上的 `animation` prop 仍被识别，但 motion 路径不需要它。
- 未来主版本 MAY 完全移除旧版路径。

## 交叉引用

- 完整归档 spec：`openspec/changes/archive/spatial-div-animation-api/specs/spatial-div-animation/spec.md`
- 可行性研究：`references/feasibility-visionOS.md`
- 可行性分析：`references/feasibility-visionOS-analysis.md`
