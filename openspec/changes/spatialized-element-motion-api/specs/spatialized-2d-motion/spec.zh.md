# 空间化 2D 动画（参考实现）

## 范围

`Spatialized2DElement`（HTML SpatialDiv / `enable-xr`）是统一动画系统的**参考目标**。当 `useAnimation` 返回的 `animation` 通过 `xr-animation` prop 绑定到 `enable-xr` 节点时，SDK 将目标解析为 `spatialized2d`。它是唯一支持**双后端**（Web RAF + native）的目标。

## 新增需求

### Requirement: 2D 为 timeline 动画的参考 kind

SDK MUST 将 `Spatialized2DElement` 动画视为 `xr-animation` 绑定到 `enable-xr` 节点时解析的 2D 目标。实现使用共享的 `SpatializedMotionController`，配合 2D 策略（Web RAF + native `SpatializedContainerMotionAnimationManager`）。

#### Scenario: 公共 React 入口

- **WHEN** 开发者调用 `useAnimation(config)`（`from/to` 或 `tracks` 配置）并将 `animation` 绑定到 `enable-xr` 节点
- **THEN** hook MUST 返回 `[animation, api, style]`，native 不可用时启用 Web RAF

#### Scenario: Core 控制器等价性

- **WHEN** 开发者创建 `new SpatializedMotionController(config)` 并在绑定流程中将目标解析为 `spatialized2d`
- **THEN** 相同 timeline 配置下的播放行为 MUST 等价

---

### Requirement: 提供带单一 style outlet 的 SpatialDiv motion API

SDK MUST 提供 `useAnimation(config)` 返回 `[animation, api, style]`。对于 `spatialized2d`（绑定到 `enable-xr`），`style` 携带活跃动画值。`style` 对象 MUST 仅携带白名单动画字段（`opacity` 和结构化 `transform` CSS 字符串，按 translate → rotate → scale 组合）。应用 MUST 通过合并 `style` 到空间化 HTML 节点来集成动画。

#### Scenario: Hook 返回结构

- **WHEN** 应用代码调用 `useAnimation(config)` 并将 `animation` 绑定到 `enable-xr` 节点
- **THEN** hook MUST 返回包含 `animation`、`api` 和 `style` 的元组
- **AND** `api` MUST 暴露 `play`、`pause`、`stop`、`reset`、`finish`、`isAnimating`、`isPaused`、`finished`、`playState`

#### Scenario: from/to 配置内部编译为 tracks

- **WHEN** 应用调用 `useAnimation({ from, to, duration, ... })` 并绑定到 `enable-xr` 节点
- **THEN** SDK MUST 内部将 `from/to` 编译为 `tracks`（每个动画标量一条 track，keyframe 在 `at: 0` 和 `at: duration`），然后通过同一 timeline pipeline 执行

---

### Requirement: Timeline 支持多轨重叠 keyframe

配置 MUST 包含全局 `duration`（秒，`> 0`，有限值）和非空 `tracks` 数组。每条 track MUST 指定白名单中的 `property`、至少两个 `at` 在 `[0, duration]` 范围内（秒）的 `keyframes`，MAY 指定每轨 `timingFunction`。

#### Scenario: 不同时间范围的重叠轨道

- **GIVEN** `duration: 5`，`transform.translate.x`（0→100，0s 到 5s）和 `opacity`（0→1，3s 到 5s）
- **WHEN** `api.play()` 播放完成
- **THEN** `t=1.5` 时 `translate.x` MUST 在 0 到 100 之间，`opacity` MUST 等于 `0`
- **AND** `t=5` 时 `translate.x === 100`，`opacity === 1`

#### Scenario: track 内 keyframe 范围外保持

- **GIVEN** 某 track 第一个 keyframe 在 `at: 3`
- **WHEN** 评估 `t=1`
- **THEN** track 值 MUST 等于第一个 keyframe 的 `value`

---

### Requirement: 仅白名单属性

Track `property` MUST 限于：`opacity`、`transform.translate.x/y/z`、`transform.rotate.x/y/z`、`transform.scale.x/y/z`。布局或空间尺寸字段 MUST 在校验时被拒绝。

#### Scenario: 拒绝布局属性 track

- **WHEN** track 引用 `width`、`height`、`back`、`backOffset` 或 `depth`
- **THEN** 校验 MUST 在播放前抛错

---

### Requirement: 双后端 — Web MUST 能播放动画

当 native 动画后端不活跃时，SDK MUST 使用 **Web 后端** 通过 keyframe 评估驱动同一 `style` outlet（如 `requestAnimationFrame`）。Web 后端 MUST NOT 将 `play()` 当作静默 no-op。

#### Scenario: 普通浏览器下 play 驱动 style 动画

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 应用将 `animation` 绑定到 `enable-xr` 节点并调用 `api.play()`
- **THEN** `style` MUST 随时间更新直到 timeline 完成
- **AND** 非循环 timeline 完成时 `onComplete` MUST 触发

#### Scenario: WebSpatial 运行时仅使用 native 后端

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`
- **WHEN** `api.play()` 被调用
- **THEN** SDK MUST 使用 native 动画后端
- **AND** Web RAF 后端 MUST NOT 在同一 hook 实例上运行

#### Scenario: bind 前 play 不降级到 Web RAF

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`
- **AND** `api.play()` 在 `xr-animation` binding 绑定元素前执行
- **THEN** SDK MUST NOT 启动 Web RAF 作为降级
- **AND** native 播放 MUST 在元素绑定后开始

---

### Requirement: Native 播放使用 canonical tracks 路径

对于 `useAnimation`，Bridge `play` 命令 MUST 携带供 native 执行的 canonical tracks 文档。Native MUST 评估该 tracks 文档，且 MUST NOT 对这个 API 回退到旧版 `from`/`to` segment 插值。

#### Scenario: 线格式匹配 canonical tracks 模型

- **WHEN** JS 为 `useAnimation` 发送 native `play`
- **THEN** payload MUST 包含 canonical tracks 文档，其中有 `duration`、可选 `delay`、可选 `playbackRate`、可选 `loop`、非空 `tracks`
- **AND** 每条 track MUST 包含 `property`、`keyframes`（`at` 单位秒）、`timingFunction`

#### Scenario: from/to authoring 形状在发送 native 前编译为 tracks

- **WHEN** 应用代码调用 `useAnimation({ from, to, duration, ... })`
- **THEN** SDK MUST 先将该 authoring 形状编译为 canonical `tracks`，再发送 native `play`

#### Scenario: timeline authoring 形状在发送 native 前编译为 tracks

- **WHEN** 应用代码调用 `useAnimation({ duration, timeline, ... })`
- **THEN** SDK MUST 先将该 authoring 形状编译为 canonical `tracks`，再发送 native `play`

#### Scenario: tracks authoring 形状保持在同一执行路径

- **WHEN** 应用代码调用 `useAnimation({ duration, tracks, ... })`
- **THEN** SDK MUST 通过同一个 canonical tracks 路径执行 native 播放，不得降级成 segment

#### Scenario: useAnimation 禁止 segment 降级

- **WHEN** canonical tracks 文档已经为 native 播放准备完成
- **THEN** SDK MUST NOT 用旧版 native `from`/`to` segment 命令替换它

---

### Requirement: Native timeline 评估与 Web 评估器匹配

Native MUST 在 timeline 时间 `t` 独立采样每条 track，然后按与 Web `evaluateMotionTimeline` 相同的规则组装目标。

#### Scenario: 逐轨段插值

- **GIVEN** track 有 keyframes `[{ at: a, value: va }, { at: b, value: vb }]` 和 `timingFunction` `e`
- **WHEN** 在 `a <= t <= b` 采样
- **THEN** native MUST 计算线性进度 `(t - a) / (b - a)`，应用 `timingFunction`，然后 lerp

#### Scenario: 首末 keyframe 外保持

- **WHEN** `t` 在首 keyframe 前 → 值等于首 keyframe 的 value
- **WHEN** `t` 在末 keyframe 后 → 值等于末 keyframe 的 value

#### Scenario: Transform 组合顺序

- **WHEN** 多条 transform 标量 track 在时间 `t` 活跃
- **THEN** native MUST 以固定顺序 translate → rotate → scale 组合

---

### Requirement: 命令式播放和生命周期

`play`、`pause`、`stop`、`reset`、`finish` 和生命周期回调 MUST 遵循会话语义：paused 时 `play` 恢复；running 时 `play` 为 no-op；`stop` 冻结当前采样值且只终止 active session；`reset` 总是 seek 到会话起始值；`finish` 总是 seek 到终态值；`onComplete`/`onStop`/`onReset` 互斥；`onError` 用于异步 native 失败。

#### Scenario: running 时 play 为 no-op

- **GIVEN** 非循环 timeline 正在播放
- **WHEN** 未 `reset()` 就再次调用 `api.play()`
- **THEN** 该调用 MUST 为 no-op

#### Scenario: idle.reset() 仍然发出起点值

- **GIVEN** 动画已经处于 `idle`
- **WHEN** 调用 `api.reset()`
- **THEN** SDK MUST 发出 `from` 值，MUST 保持 `playState` 为 `idle`，且 MUST 保持 `finished` 为 `false`

#### Scenario: idle.finish() 仍然发出终点值

- **GIVEN** 动画已经处于 `idle`
- **WHEN** 调用 `api.finish()`
- **THEN** SDK MUST 发出 `to` 值，MUST 将 `playState` 置为 `finished`，且 MUST 将 `finished` 置为 `true`

---

### Requirement: Native 播放期间 Portal 抑制

当 native 播放正在主动控制会话时，一直到会话到达终态或解绑为止，SDK MUST 抑制被动画字段的 Portal DOM 同步。

#### Scenario: 根据 tracks 确定抑制字段集

- **GIVEN** timeline 包含任何 `transform.*` track → `transform` 在抑制集中
- **GIVEN** timeline 包含 `opacity` track → `opacity` 在抑制集中

#### Scenario: 终态时清除抑制

- **WHEN** 会话到达终态，或执行 `stop`、`reset`、`finish`、`unbind`
- **THEN** 抑制 MUST 清除

---

### Requirement: Native 会话使用 xr-animation binding

Native 会话 MUST 使用 `xr-animation` prop / `SpatializedMotionBinding`，而非旧版 `animation` prop。

#### Scenario: 解绑取消会话

- **GIVEN** 活跃的 native 会话
- **WHEN** xr-animation binding 解绑
- **THEN** SDK MUST 终止会话；`onReset` MUST NOT 触发（与解绑语义对齐）

---

### Requirement: 发送 native 前校验

Timeline 配置 MUST 在任何 native `play` 发送前通过校验。

#### Scenario: 拒绝重复属性 track

- **WHEN** 两条 track 共享同一 `property` → 校验 MUST 抛错

#### Scenario: 拒绝未排序 keyframe

- **WHEN** keyframe 未按 `at` 非递减排列 → 校验 MUST 抛错

---

## 交叉引用

- 详细 2D 场景（归档）：`archive/spatial-div-motion-api/specs/spatial-div-motion/spec.md`
- Native timeline spec（归档）：`archive/spatial-div-motion-api/specs/spatial-div-motion-native-timeline/spec.md`
- 旧版会话 spec：`specs/legacy-session-animation/spec.md`
- 伞式：`specs/spatialized-element-motion/spec.md`