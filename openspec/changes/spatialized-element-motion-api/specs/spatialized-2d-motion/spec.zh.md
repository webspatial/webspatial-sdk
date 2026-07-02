# 空间化 2D 动画（参考实现）

## 范围

`Spatialized2DElement`（HTML SpatialDiv / `enable-xr`）是统一动画系统的**参考目标**。当 `useAnimation` 返回的 `animation` 通过 `xr-animation` prop 绑定到 `enable-xr` 节点时，SDK 将目标解析为 `spatialized2d` 并创建 native `AnimationObject`。

## 新增需求

### Requirement: 2D 为 timeline 动画的参考 kind

SDK MUST 将 `Spatialized2DElement` 动画视为 `xr-animation` 绑定到 `enable-xr` 节点时解析的 2D 目标。目标态执行使用 `SpatializedElement.createAnimation(config)` 和 `AnimationObject : SpatialObject`。

#### Scenario: 公共 React 入口

- **WHEN** 开发者调用 `useAnimation(config)`（`from/to` 或 `tracks` 配置）并将 `animation` 绑定到 `enable-xr` 节点
- **THEN** hook MUST 返回 `[animation, api, style]`
- **AND** runtime motion availability MUST 通过 `supports('useAnimation')` 报告

#### Scenario: AnimationObject 行为对齐

- **WHEN** 绑定流程将目标解析为 `spatialized2d`
- **THEN** 播放行为 MUST 由为相同 timeline config 创建的 `AnimationObject` 驱动

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

### Requirement: Native-first target path 且无 Web RAF fallback

对于目标态 `useAnimation` 路径，当 native spatial animation 不可用时，SDK MUST NOT 使用 Web RAF backend。纯 Web runtime MUST 报告 `supports('useAnimation') === false`。

#### Scenario: 普通浏览器报告 unsupported

- **GIVEN** `supports('useAnimation')` 为 `false`
- **WHEN** 应用将 `animation` 绑定到 `enable-xr` 节点并传入有效 tracks
- **THEN** SDK MUST NOT 启动 Web RAF playback 作为 fallback

#### Scenario: WebSpatial runtime 只使用 AnimationObject

- **GIVEN** `supports('useAnimation')` 为 `true`
- **WHEN** `api.play()` 被调用
- **THEN** SDK MUST 控制 native `AnimationObject`

#### Scenario: bind 前 play 不降级到 Web RAF

- **GIVEN** `supports('useAnimation')` 为 `true`
- **AND** `api.play()` 在 `xr-animation` binding 绑定元素前执行
- **THEN** SDK MUST NOT 启动 Web RAF 作为降级
- **AND** native 播放 MUST 在元素绑定后开始

---

### Requirement: Native create 使用 canonical tracks 路径

对于 `useAnimation`，`CreateSpatializedElementAnimation` MUST 携带供 native 执行的 canonical tracks 文档。Native MUST 评估该已锁定 tracks 文档，且 MUST NOT 对这个 API 回退到旧版 `from`/`to` segment 插值。

#### Scenario: 线格式匹配 canonical tracks 模型

- **WHEN** JS 为 `useAnimation` 发送 `CreateSpatializedElementAnimation`
- **THEN** payload MUST 包含 canonical tracks 文档，其中有 `duration`、可选 `delay`、可选 `playbackRate`、可选 `loop`、非空 `tracks`
- **AND** 每条 track MUST 包含 `property`、`keyframes`（`at` 单位秒）、`timingFunction`

#### Scenario: from/to authoring 形状在发送 native 前编译为 tracks

- **WHEN** 应用代码调用 `useAnimation({ from, to, duration, ... })`
- **THEN** SDK MUST 先将该 authoring 形状编译为 canonical `tracks`，再执行 native create

#### Scenario: timeline authoring 形状在发送 native 前编译为 tracks

- **WHEN** 应用代码调用 `useAnimation({ duration, timeline, ... })`
- **THEN** SDK MUST 先将该 authoring 形状编译为 canonical `tracks`，再执行 native create

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

#### Scenario: 已绑定的 idle.finish() 仍然发出终点值

- **GIVEN** 动画已经处于 `idle`
- **AND** 已经存在 native-backed `AnimationObject`
- **WHEN** 调用 `api.finish()`
- **THEN** SDK MUST 发出 `to` 值，MUST 将 `playState` 置为 `finished`，且 MUST 将 `finished` 置为 `true`

---

### Requirement: Native 播放期间的 element animating mask

当 native 播放正在主动控制会话时，一直到会话到达终态或解绑为止，SDK MUST 使用 element animating mask 防止常规 DOM sync 覆盖被动画字段。

#### Scenario: 根据 tracks 确定 animating mask 字段集

- **GIVEN** timeline 包含任何 `transform.*` track → `transform` 在 animating mask 中
- **GIVEN** timeline 包含 `opacity` track → `opacity` 在 animating mask 中

#### Scenario: 终态时更新 animating mask

- **WHEN** 会话到达终态，或执行 `stop`、`reset`、`finish`、`unbind`
- **THEN** animating mask MUST 按终态控制权更新

---

### Requirement: `opacity` 的终态控制权切换必须区分显式声明的 React `style.opacity`

对于 `spatialized2d`，`opacity` animating mask 在终态阶段释放或更新时，SDK MUST 区分显式声明的 React `style.opacity` 与其他一切 CSS 来源。显式声明透明度仅指绑定节点的 React props 中直接提供的 `style.opacity`。仅通过 `className`、样式表规则、父层带来的视觉变暗，或 `getComputedStyle()` 结果出现的值，MUST NOT 被视为显式声明透明度。

#### Scenario: `stop()` 在释放 mask 后恢复显式声明的 `style.opacity`

- **GIVEN** 一个 `opacity` motion 绑定到 `enable-xr` 节点，并且该节点的 React props 中显式包含 `style.opacity`
- **WHEN** `api.stop()` 完成
- **THEN** `opacity` 的终态后视觉控制方 MUST 变成这个显式声明的 `style.opacity`
- **AND** native 返回值或当前原生采样值仍然 MUST 用于 `onStop`

#### Scenario: `finish()` 在释放 mask 后恢复显式声明的 `style.opacity`

- **GIVEN** 一个 `opacity` motion 绑定到 `enable-xr` 节点，并且该节点的 React props 中显式包含 `style.opacity`
- **WHEN** `api.finish()` 完成
- **THEN** `opacity` 的终态后视觉控制方 MUST 变成这个显式声明的 `style.opacity`
- **AND** native 返回值或最终原生采样值仍然 MUST 用于 `onComplete`

#### Scenario: `reset()` 在释放 mask 后恢复显式声明的 `style.opacity`

- **GIVEN** 一个 `opacity` motion 绑定到 `enable-xr` 节点，并且该节点的 React props 中显式包含 `style.opacity`
- **WHEN** `api.reset()` 完成
- **THEN** `opacity` 的终态后视觉控制方 MUST 变成这个显式声明的 `style.opacity`
- **AND** reset 的起始值仍然 MUST 用于 `onReset`

#### Scenario: 不存在显式 React `style.opacity` 时，终态原生 `opacity` 保持权威

- **GIVEN** 一个 `opacity` motion 绑定到 `enable-xr` 节点，且该节点不存在显式 React `style.opacity`
- **WHEN** `api.stop()`、`api.reset()` 或 `api.finish()` 完成
- **THEN** `opacity` 的终态后视觉结果 MUST 继续来自终态原生采样值

#### Scenario: 终态控制权切换忽略仅由计算样式得到的 `opacity`

- **GIVEN** 绑定节点的可见 `opacity` 仅来自 `className`、样式表规则、父层造成的视觉变暗，或 `getComputedStyle()`
- **WHEN** 在 `stop()`、`reset()` 或 `finish()` 之后执行终态控制权切换
- **THEN** SDK MUST NOT 将该值判定为显式声明透明度

---

### Requirement: Native 会话使用 xr-animation binding

Native 会话 MUST 使用 `xr-animation` prop / `AnimationBinding`，而非旧版 `animation` prop。

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
