# 空间化 2D 动画（参考实现）

## 范围

`Spatialized2DElement`（HTML SpatialDiv / `enable-xr`）是统一动画系统的**参考 kind**。它是唯一支持**双后端**（Web RAF + native）的 kind。

## 新增需求

### Requirement: 2D 为 timeline 动画的参考 kind

SDK MUST 将 `Spatialized2DElement` 动画视为 `kind: 'spatialized2d'`。实现使用共享的 `SpatializedMotionController`，配合 2D 策略（Web RAF + native `SpatialDivAnimationManager`）。

#### Scenario: 公共 React 入口

- **WHEN** 开发者调用 `useSpatializedMotion({ kind: 'spatialized2d', … })` 或 `useSpatializedMotion.simple({ kind: 'spatialized2d', … })`
- **THEN** hook MUST 返回 `{ kind, style, api, motion?, controller }`，native 不可用时启用 Web RAF

#### Scenario: Core 控制器等价性

- **WHEN** 开发者调用 `element.motion(config)` 或 `new SpatializedMotionController(config, 'spatialized2d')`
- **THEN** 相同 timeline 配置下的播放行为 MUST 等价

---

### Requirement: 提供带单一 style outlet 的 SpatialDiv motion API

SDK MUST 提供 `useSpatializedMotion(config)` 返回至少 `{ style, api }`。`style` 对象 MUST 仅携带白名单动画字段（`opacity` 和结构化 `transform` CSS 字符串，按 translate → rotate → scale 组合）。应用 MUST 通过合并 `style` 到空间化 HTML 节点来集成动画。

#### Scenario: Hook 返回结构

- **WHEN** 应用代码以 `kind: 'spatialized2d'` 调用 `useSpatializedMotion(config)`
- **THEN** hook MUST 返回包含 `style` 和 `api` 的对象
- **AND** `api` MUST 暴露 `play`、`pause`、`cancel`、`isAnimating`、`isPaused`、`finished`、`playState`

#### Scenario: simple 语法糖反糖化为 timeline

- **WHEN** 应用调用 `useSpatializedMotion.simple({ kind: 'spatialized2d', from, to, duration, ... })`
- **THEN** SDK MUST 行为等同于对应的 `useSpatializedMotion` 调用（每个动画标量一条 track，keyframe 在 `at: 0` 和 `at: duration`）

---

### Requirement: Timeline 支持多轨重叠 keyframe

配置 MUST 包含全局 `duration`（秒，`> 0`，有限值）和非空 `tracks` 数组。每条 track MUST 指定白名单中的 `property`、至少两个 `at` 在 `[0, duration]` 范围内（秒）的 `keyframes`，MAY 指定每轨 `easing`。

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

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` 为 `false`
- **WHEN** 应用调用 `useSpatializedMotion` 并 `api.play()`
- **THEN** `style` MUST 随时间更新直到 timeline 完成
- **AND** 非循环 timeline 完成时 `onComplete` MUST 触发

#### Scenario: WebSpatial 运行时仅使用 native 后端

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` 为 `true`
- **WHEN** `api.play()` 被调用
- **THEN** SDK MUST 使用 native 动画后端
- **AND** Web RAF 后端 MUST NOT 在同一 hook 实例上运行

#### Scenario: bind 前 play 不降级到 Web RAF

- **GIVEN** `supports('useSpatializedMotion', ['spatialized2d'])` 为 `true`
- **AND** `api.play()` 在 `motion` binding 绑定元素前执行
- **THEN** SDK MUST NOT 启动 Web RAF 作为降级
- **AND** native 播放 MUST 在元素绑定后开始

---

### Requirement: Native timeline play（Phase 2b）

Bridge `play` 命令 MUST 接受可选 `timeline` 字段。`timeline` 存在时 native MUST 评估该文档；不存在时 MUST 使用现有 `from`/`to` 段插值。

#### Scenario: 线格式匹配 motion 配置

- **WHEN** JS 发送带 `timeline` 的 `play`
- **THEN** `timeline` MUST 包含 `duration`、可选 `delay`、可选 `playbackRate`、可选 `loop`、非空 `tracks`
- **AND** 每条 track MUST 包含 `property`、`keyframes`（`at` 单位秒）、`easing`

#### Scenario: segment 与 timeline 互斥

- **WHEN** `play` 包含 `timeline` — native MUST 忽略 `from`/`to`
- **WHEN** `play` 省略 `timeline` — native MUST 使用 `from`/`to` 段

#### Scenario: 段等价 timeline 优化

- **GIVEN** 每条 track 恰好有两个 keyframe（`at === 0` 和 `at === duration`），所有 track 共享一个 easing
- **THEN** SDK MAY 发送 native 段 `from`/`to` 代替 `timeline`

---

### Requirement: Native timeline 评估与 Web 评估器匹配

Native MUST 在 timeline 时间 `t` 独立采样每条 track，然后按与 Web `evaluateMotionTimeline` 相同的规则组装目标。

#### Scenario: 逐轨段插值

- **GIVEN** track 有 keyframes `[{ at: a, value: va }, { at: b, value: vb }]` 和 easing `e`
- **WHEN** 在 `a <= t <= b` 采样
- **THEN** native MUST 计算线性进度 `(t - a) / (b - a)`，应用 easing，然后 lerp

#### Scenario: 首末 keyframe 外保持

- **WHEN** `t` 在首 keyframe 前 → 值等于首 keyframe 的 value
- **WHEN** `t` 在末 keyframe 后 → 值等于末 keyframe 的 value

#### Scenario: Transform 组合顺序

- **WHEN** 多条 transform 标量 track 在时间 `t` 活跃
- **THEN** native MUST 以固定顺序 translate → rotate → scale 组合

---

### Requirement: 命令式播放和生命周期

`play`、`pause`、`cancel` 和生命周期回调 MUST 遵循会话语义：paused 时 `play` 恢复；running 时 `play` 为 no-op；`cancel` 恢复会话起始值；`onComplete`/`onCancel` 互斥；`onError` 用于异步 native 失败。

#### Scenario: running 时 play 为 no-op

- **GIVEN** 非循环 timeline 正在播放
- **WHEN** 未 `cancel()` 就再次调用 `api.play()`
- **THEN** 该调用 MUST 为 no-op

---

### Requirement: Native 播放期间 Portal 抑制

Native 会话 alive 期间，SDK MUST 抑制被动画字段的 Portal DOM 同步。

#### Scenario: 根据 tracks 确定抑制字段集

- **GIVEN** timeline 包含任何 `transform.*` track → `transform` 在抑制集中
- **GIVEN** timeline 包含 `opacity` track → `opacity` 在抑制集中

#### Scenario: 终态时清除抑制

- **WHEN** 会话到达 finished 或 cancel 后 idle → 抑制清除

---

### Requirement: Native 会话使用 motion binding

Native 会话 MUST 使用 `motion` prop / `SpatializedMotionBinding`，而非旧版 `animation` prop。

#### Scenario: 解绑取消会话

- **GIVEN** 活跃的 native 会话
- **WHEN** motion binding 解绑
- **THEN** SDK MUST 取消会话；`onCancel` MUST NOT 触发（与解绑语义对齐）

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
