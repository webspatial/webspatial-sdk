# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义绑定时目标解析的声明式动画

平台 MUST 为以下目标文档化和实现声明式 timeline 动画：`spatialized2d`、`static3d`、`dynamic3d`。每个目标 MUST 有子 spec 定义属性白名单、native 后端和 React 集成。公开 hook MUST NOT 需要 `config.kind`；目标在返回的 `animation` binding 作为 `xr-animation` prop 传给组件时自动解析（`<div enable-xr>` → spatialized2d、`<Model>` → static3d、`<Reality>` → dynamic3d）。`SpatialEntity` transform timeline 不在本伞式范围内，当前继续通过独立 entity 栈上的 `useEntityAnimation` 处理。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的已交付 vs 计划状态

### Requirement: Native-first AnimationObject 架构

Spatialized element motion MUST 使用 native-first 的 `AnimationObject` 目标态架构。每个已绑定的 `SpatializedElement` MUST 暴露 `createAnimation(config)`，创建一个与单个 spatialized element target 关联的 `AnimationObject : SpatialObject`。创建时 MUST 发送 `CreateSpatializedElementAnimation`，其中包含归一化 timeline payload、目标 kind、元素 identity 和 animation identity。运行时控制 MUST 使用 `ControlSpatializedElementAnimation` 命令（`play`、`pause`、`resume`、`stop`、`reset`、`finish`、`destroy`）。Native runtime state change MUST 通过 `SpatialAnimationStateChanged` 观察。

目标态架构 MUST NOT 依赖 Web RAF playback、`SpatializedMotionController`、`NativePlaybackBackend`、Portal suppression 或 `AnimateSpatializedElementMotion` 作为规范性执行原语。既有 authoring 与 playback 语义继续保持规范性，但执行所有者是 native `AnimationObject`。

#### Scenario: SpatializedElement.createAnimation 创建 AnimationObject

- **WHEN** 一个 `animation` binding 解析为具体 spatialized element target
- **THEN** SDK MUST 对该 target 调用 `SpatializedElement.createAnimation(config)`
- **AND** 返回的 handle MUST 表示一个 `AnimationObject : SpatialObject`

#### Scenario: create 锁定 timeline config

- **WHEN** `CreateSpatializedElementAnimation` 成功
- **THEN** 创建出的 `AnimationObject` MUST 锁定用于创建的归一化 timeline config
- **AND** 在该 object 被 destroy 并 recreate 前，其后的终止命令 MUST 使用这份已锁定 timeline

#### Scenario: Config 变更必须 destroy 并 recreate

- **GIVEN** binding 已经创建了一个 `AnimationObject`
- **WHEN** authoring config 的变化导致归一化 timeline 或目标校验结果变化
- **THEN** SDK MUST destroy 现有 `AnimationObject`
- **AND** SDK MUST 创建新的 `AnimationObject`，而不是原地修改旧 object 锁定的 timeline

#### Scenario: 控制命令走 animation object 通道

- **WHEN** 开发者调用 `api.play()`、`api.pause()`、`api.resume()`、`api.stop()`、`api.reset()` 或 `api.finish()`
- **THEN** SDK MUST 向当前 `AnimationObject` 发送匹配的 `ControlSpatializedElementAnimation` 命令
- **AND** playback state MUST 基于 `SpatialAnimationStateChanged` 对齐

#### Scenario: Element animating mask 持有 animated sync fields

- **WHEN** 一个 `AnimationObject` 处于 active 状态或持有 terminal visual value
- **THEN** 目标元素 MUST 暴露 animated fields 的 animating mask
- **AND** 常规 element sync MUST NOT 覆盖 mask 标记为 animation-owned 的字段

#### Scenario: 纯 Web runtime 不运行 RAF fallback

- **WHEN** 已解析目标的 runtime capability 不可用，包括纯 Web runtime
- **THEN** `supports('useAnimation', [targetToken])` MUST 返回 `false`
- **AND** SDK MUST NOT 为目标态 `useAnimation` 路径启动 Web RAF playback 作为 fallback

### Requirement: 共享的播放 API 形状

支持声明式动画的所有 kind MUST 暴露 `SpatializedPlaybackApi`（`play`、`pause`、`resume`、`stop`、`reset`、`finish`、`playState`、`isAnimating`、`isPaused`、`finished`）。Controller 级 `pause()` 与 `resume()` MUST 只表示整体会话控制，且不接受 `keys` 参数。本次变更明确不包含任何按 track / action 的局部控制；如果未来确实需要局部控制，必须作为独立的 track/action 级 API 另行设计，例如 `pauseTrack(trackId)`，不能通过扩展 controller 的 `pause()` / `resume()` 来实现。

#### Scenario: 播放 API 与绑定目标无关

- **WHEN** 开发者从 `useAnimation(config)` 获得 motion 元组
- **THEN** 返回的 `api` MUST 暴露 `play`、`pause`、`resume`、`stop`、`reset`、`finish`、`playState`、`isAnimating`、`isPaused`、`finished`，无论 `animation` 后续绑定到哪个组件

#### Scenario: pause() 和 resume() 不接受额外参数

- **WHEN** 应用代码尝试以额外参数调用 `api.pause()` 或 `api.resume()`
- **THEN** controller API MUST 在类型层面拒绝该调用，且公开 surface 上不得提供任何接收附加 controller-control 参数的重载

#### Scenario: stop() 将 active session 冻结在当前值

- **WHEN** 动画正在运行或暂停时调用 `api.stop()`
- **THEN** active session MUST 被终止，style MUST 冻结在当前播放时刻的采样值，`playState` MUST 变为 `idle`，`finished` MUST 变为 `false`，且 MUST 调用 `onStop` 并传入冻结值

#### Scenario: reset() 回滚到初始值

- **WHEN** 调用 `api.reset()`
- **THEN** style MUST 回滚到 `from`（初始）值，`playState` MUST 变为 `idle`，`finished` MUST 变为 `false`，且 MUST 调用 `onReset` 并传入初始值

#### Scenario: finish() 跳到最终值

- **GIVEN** controller 已经持有一个 native-backed `AnimationObject`
- **WHEN** 调用 `api.finish()`
- **THEN** style MUST 跳到 `to`（最终）值，`playState` MUST 变为 `finished`，`finished` MUST 变为 `true`，且 MUST 调用 `onComplete` 并传入最终值

#### Scenario: idle.reset() 不得为 no-op

- **GIVEN** 动画已经处于 `idle`
- **WHEN** 调用 `api.reset()`
- **THEN** SDK MUST 继续发出 `from` 值，并且 MUST 保持 `playState` 为 `idle`

#### Scenario: 绑定前的 finish() 会排队，直到 native 确认终态

- **GIVEN** 动画处于 `idle`，且还不存在 native-backed `AnimationObject`
- **WHEN** 调用 `api.finish()`
- **THEN** SDK MUST 记录一条显式排队的 `finish` 命令
- **AND** 在 native 确认前，API MUST NOT 自行报告 `playState=finished` 或 `finished=true`
- **AND** native-backed `AnimationObject` 创建完成后，SDK MUST flush 这条排队的 `finish` 命令
- **AND** 只有后续 native 终态确认才 MAY 将 API 切换为 `playState=finished` 且 `finished=true`

#### Scenario: 只有从 idle 或 finished 启动的新 play 会话才会读取最新配置

- **GIVEN** controller 随后收到了 `updateConfig(nextConfig)`
- **WHEN** `api.play()` 从 `idle` 或 `finished` 启动一个新的播放会话
- **THEN** SDK MUST 读取并锁定最新 config 作为该新会话的配置
- **AND** 在下一个新会话开始前，该会话上的终止命令 MUST 始终基于这份已锁定的会话配置生效

#### Scenario: paused 状态下的 play() 只恢复当前会话，不读取更新后的配置

- **GIVEN** controller 当前处于 `paused`，并且已经持有一份会话配置快照
- **AND** 应用代码调用了 `updateConfig(nextConfig)`
- **WHEN** 应用代码再次调用 `api.play()`
- **THEN** 该调用 MUST 等价于 `resume()`
- **AND** SDK MUST NOT 把 `nextConfig` 读入当前会话

#### Scenario: finish() 之后 reset() 在下一次新 play 之前继续使用已完成会话的配置

- **GIVEN** 一次播放会话由 `configA` 启动
- **AND** 该会话通过 `api.finish()` 进入 `finished`
- **AND** 应用代码随后调用 `updateConfig(configB)`
- **WHEN** 在下一次新 `play()` 之前调用 `api.reset()`
- **THEN** SDK MUST 恢复由 `configA` 启动的该已完成会话的初始值
- **AND** SDK MUST NOT 使用 `configB` 的初始值

#### Scenario: stop() 之后 reset() 在下一次新 play 之前继续使用被 stop 的会话配置

- **GIVEN** 一次播放会话由 `configA` 启动
- **AND** 该会话通过 `api.stop()` 进入 `idle`
- **AND** 应用代码随后调用 `updateConfig(configB)`
- **WHEN** 在下一次新 `play()` 之前调用 `api.reset()`
- **THEN** SDK MUST 恢复由 `configA` 启动的该被 stop 会话的初始值
- **AND** SDK MUST NOT 使用 `configB` 的初始值

#### Scenario: Terminal values 来自 AnimationObject

- **WHEN** 调用终止方法（`stop`、`reset`、`finish`）
- **THEN** terminal style values MUST 由 native `AnimationObject` 提供
- **AND** JS timeline 评估 MAY 仅用于 config validation、测试夹具或显式非 runtime 工具，不作为目标态 playback backend

#### Scenario: 显式声明的 `style.opacity` 在 2D 终态控制权切换中优先

- **GIVEN** 一个绑定到 React 节点的 `spatialized2d` motion，并且该节点显式传入了 `style.opacity`
- **WHEN** `stop()`、`reset()` 或 `finish()` 完成，且 element animating mask 释放或更新 `opacity`
- **THEN** `opacity` 的终态后视觉控制方 MUST 变成这个显式声明的 `style.opacity`
- **AND** 终态原生采样值仍然 MUST 作为回调参数与终态会话语义的来源

#### Scenario: 非显式声明的 CSS `opacity` 不参与终态控制权切换

- **GIVEN** `opacity` 仅通过 `className`、样式表规则、父层造成的视觉变暗，或 `getComputedStyle()` 结果体现出来
- **WHEN** 一个 `spatialized2d` motion 到达 `stop()`、`reset()` 或 `finish()`
- **THEN** SDK MUST NOT 将该值视为用于终态控制权切换的显式声明透明度
- **AND** 当不存在显式 React `style.opacity` 时，终态 `opacity` 控制权 MUST 保持在原生采样结果一侧

#### Scenario: 显式声明的 `style.transform` 在 host transform 终态控制权切换中优先

- **GIVEN** 一个 host transform 目标（`spatialized2d` 或 `dynamic3d`）绑定到了带有显式 `style.transform` 的 React 节点
- **WHEN** `stop()`、`reset()` 或 `finish()` 完成，且 element animating mask 释放或更新 host `transform`
- **THEN** host `transform` 的终态后视觉控制方 MUST 变成这个显式声明的 `style.transform`
- **AND** 终态原生采样 transform 值仍然 MUST 作为回调参数与终态会话语义的来源

#### Scenario: 非显式声明的 CSS `transform` 不参与终态控制权切换

- **GIVEN** host `transform` 仅通过 `className`、样式表规则、继承布局副作用、`useAnimation()` 返回的 `style` outlet 或 `getComputedStyle()` 结果体现出来
- **WHEN** 一个 host transform 目标到达 `stop()`、`reset()` 或 `finish()`
- **THEN** SDK MUST NOT 将该值视为用于终态控制权切换的显式声明 transform
- **AND** 当不存在显式 React `style.transform` 时，终态 host transform 控制权 MUST 保持在原生采样结果一侧

### Requirement: 共享生命周期回调

Config MUST 支持以下生命周期回调：

| 回调 | 触发条件 | 参数 |
|------|---------|------|
| `onStart` | `play()` 后首帧播放 | 无 |
| `onComplete` | 自然播放结束 **或** `finish()` | `values: SpatializedVisualValues`（to 值） |
| `onStop` | 调用 `stop()` | `values: SpatializedVisualValues`（当前值） |
| `onReset` | 调用 `reset()` | `values: SpatializedVisualValues`（from 值） |
| `onError` | Native 桥异步失败 | `error: SpatializedPlaybackError` |

每次会话终止时回调 MUST 互斥：`onComplete`、`onStop`、`onReset` 中恰好触发一个。`onError` MAY 在 native 失败时独立触发。

三个终止方法 MUST 保持相互独立：`stop()` 只终止 active session 且不 seek，`reset()` 总是 seek 到起点值，`finish()` 总是 seek 到终点值。调用其中任一方法 MUST NOT 被另一个终止方法的语义吞掉或替代。

#### Scenario: 自然结束触发 onComplete

- **WHEN** 动画在未被中断的情况下到达 `duration`
- **THEN** MUST 调用 `onComplete` 并传入最终值，`playState` MUST 为 `finished`

#### Scenario: finish() 触发 onComplete

- **WHEN** 调用 `api.finish()` 且 native 确认终态
- **THEN** MUST 调用 `onComplete` 并传入 `to` 值（与自然结束相同）

#### Scenario: stop() 触发 onStop

- **WHEN** 调用 `api.stop()`
- **THEN** MUST 调用 `onStop` 并传入当前采样值

#### Scenario: reset() 触发 onReset

- **WHEN** 调用 `api.reset()`
- **THEN** MUST 调用 `onReset` 并传入初始（`from`）值

#### Scenario: stop() 和 reset() 会清除 finished 标记

- **WHEN** 调用 `api.stop()` 或 `api.reset()`
- **THEN** `finished` 标记 MUST 为 `false`

#### Scenario: finish() 会设置 finished 标记

- **WHEN** 调用 `api.finish()` 且 native 确认终态
- **THEN** `finished` 标记 MUST 为 `true`

#### Scenario: Controller state 只表达整体会话

- **WHEN** 开发者暂停或恢复 motion controller
- **THEN** controller 状态机 MUST 只表达整体会话状态（`idle`、`queued`、`running`、`paused`、`finished`）
- **AND** controller MUST NOT 暴露 partially-paused 或 key-level 聚合状态

#### Scenario: `opacity` 的终态控制权切换不允许双重控制权

- **GIVEN** 一个 `spatialized2d` motion 正在动画化 `opacity`
- **WHEN** `stop()`、`reset()` 或 `finish()` 之后 element animating mask 释放或更新 `opacity`
- **THEN** SDK MUST 避免进入 native 外层 `opacity` 与 inner DOM `opacity` 在终态后同时继续控制同一视觉 `opacity` 的状态

#### Scenario: host transform 的终态控制权切换不允许双重控制权

- **GIVEN** 一个 host transform 目标（`spatialized2d` 或 `dynamic3d`）正在动画化 host `transform`
- **WHEN** `stop()`、`reset()` 或 `finish()` 之后 element animating mask 释放或更新 host `transform`
- **THEN** SDK MUST 避免进入 native host transform 与 DOM host transform 在终态后同时继续控制同一视觉 `transform` 的状态

#### Scenario: 新的 play 会话会清除之前的 host transform 终态控制权

- **GIVEN** 一个 host transform 目标此前已通过 `stop()`、`reset()` 或 `finish()` 进入 host transform 终态控制权状态
- **WHEN** 应用代码从 `idle` 或 `finished` 调用 `api.play()` 启动一个新会话
- **THEN** SDK MUST 清除先前的 host transform 终态控制权决策
- **AND** 新的 active 会话 MUST 按目标类型更新 element animating mask

### Requirement: v1 公开 authoring 以 from/to 与 timeline 为主，tracks 保留为内部 canonical 模型

Hook MUST 接受三种互斥配置形状之一：

1. **段配置**（推荐默认）：`{ from, to, duration, timingFunction? }`
2. **Timeline 配置**（推荐关键帧路径）：`{ duration, timeline: { "0%": { ...values, timingFunction? }, ... "100%": { ...values } }, timingFunction? }`
3. **Tracks 配置**（兼容 / 高级 escape hatch）：`{ duration, tracks: [{ property, keyframes: [{ at, value, timingFunction? }], timingFunction? }], timingFunction? }`

在同一配置对象中同时传递 `from`/`to`、`tracks`、`timeline` 中多于一项 MUST 是类型错误（判别联合）。内部实现中，段配置和 timeline 配置 MUST 编译为 tracks 后再执行。当 `useAnimation` 使用 native 播放时，这条统一路径 MUST 持续执行 canonical tracks 模型，且 MUST NOT 降级到旧版 native segment 命令。

所有 kind MUST 在所有配置形状中使用视觉 transform 路径（`transform.translate.*`、`opacity` 等）。

#### Scenario: from/to 编译为 tracks

- **WHEN** 开发者传入 `{ from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5 }`
- **THEN** SDK MUST 内部编译为单条 track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 1 }] }` 后再执行

#### Scenario: tracks 配置直接执行

- **WHEN** 开发者传入 `{ duration, tracks: [...] }`
- **THEN** SDK MUST 直接执行 tracks 而无需变换

#### Scenario: timeline 配置编译为 tracks

- **WHEN** 开发者传入 `{ duration: 2, timeline: { "0%": { opacity: 0 }, "50%": { opacity: 0.8 }, "100%": { opacity: 1 } } }`
- **THEN** SDK MUST 编译为单条 track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 1, value: 0.8 }, { at: 2, value: 1 }] }` 后再执行

#### Scenario: tracks 不是 v1 用户评审主路径

- **WHEN** 面向用户的 API 摘要文档展示 v1 用法
- **THEN** 它们 MUST 优先展示 `from/to` 与 `timeline` 作为公开 authoring 路径
- **AND** `tracks` MAY 仅以内部 canonical 模型或当前实现 / 类型保留的兼容高级输入身份出现

#### Scenario: 同时传入 timeline 和 tracks 是类型错误

- **WHEN** 开发者传入 `{ duration, timeline: {...}, tracks: [...] }`
- **THEN** SDK MUST 在类型层面拒绝和/或在校验时抛错

#### Scenario: 同时传入 timeline 和 from/to 是类型错误

- **WHEN** 开发者传入 `{ from, to, duration, timeline: {...} }`
- **THEN** SDK MUST 在类型层面拒绝和/或在校验时抛错

#### Scenario: 共享配置形状与目标无关

- **WHEN** 开发者提交相同配置（段、tracks 或 timeline），且结果 `animation` 绑定到 `<div enable-xr>`、`<Model>` 或 `<Reality>` 中的任何一个
- **THEN** 校验 MUST 在目标特定播放开始前接受相同的配置结构

### Requirement: Timeline 百分比关键帧配置（CSS @keyframes 风格）

Hook MUST 接受含 `timeline` 字段的配置，该字段包含百分比 key（匹配 `/^\d+(\.\d+)?%$/` 的字符串）映射到 `SpatializedMotionKeyframeValues`（`SpatializedVisualValues` 扩展了可选 `timingFunction`）。`timeline` 对象 MUST NOT 包含非百分比 key；所有 config 级选项（`duration`、`timingFunction`、`delay`、`loop`、`playbackRate`、回调）保留在外层 config 上。

`timeline` 是单个 CSS `@keyframes` 风格的关键帧对象，不是串行动画编排原语。v1 不支持 `timeline: []`、多个 action 或多段编排语义。

脱糖规则：
- 每个百分比 key 解析为 `[0, 1]` 归一化比例，乘以 `duration` 得到秒级 `at` 值。
- 每个动画属性独立跨所有百分比帧收集，形成每属性一条 track。
- 如果某属性在某百分比帧中未出现，该属性在该时间点不生成 keyframe。
- `timeline` 对象 MUST 包含至少 2 个百分比 key；少于 2 个 MUST 校验报错。
- 小数百分比（如 `"30.33%"`）MUST 被支持。

#### Scenario: 小数百分比解析

- **WHEN** 开发者传入 `{ duration: 10, timeline: { "0%": { opacity: 0 }, "30.33%": { opacity: 0.5 }, "100%": { opacity: 1 } } }`
- **THEN** SDK MUST 编译为 `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 3.033, value: 0.5 }, { at: 10, value: 1 }] }`

#### Scenario: 每属性独立收集

- **GIVEN** `{ duration: 2, timeline: { "0%": { opacity: 0, transform: { translate: { x: 0 } } }, "50%": { opacity: 1 }, "100%": { opacity: 0.5, transform: { translate: { x: 100 } } } } }`
- **THEN** SDK MUST 生成两条 track：
  - `opacity`：keyframes 为 `[{ at: 0, value: 0 }, { at: 1, value: 1 }, { at: 2, value: 0.5 }]`
  - `transform.translate.x`：keyframes 为 `[{ at: 0, value: 0 }, { at: 2, value: 100 }]`（`at: 1` 无 keyframe，因为 `"50%"` 未声明 `transform.translate.x`）

#### Scenario: 缺失属性使用 hold 规则

- **GIVEN** 从 timeline 编译的 track 首个 keyframe 在 `at: 1`（来自 `"50%"`，`duration: 2`）
- **WHEN** 在 `t = 0.5` 评估时
- **THEN** track 值 MUST 等于首个 keyframe 的值（hold 规则）

#### Scenario: 少于 2 个百分比 key 被拒绝

- **WHEN** 开发者传入 `{ duration: 1, timeline: { "50%": { opacity: 1 } } }`
- **THEN** 校验 MUST 在播放前抛错

#### Scenario: timeline 中非法 key 被拒绝

- **WHEN** `timeline` 对象包含不匹配 `/^\d+(\.\d+)?%$/` 的 key（如 `"halfway"`、`"duration"`）
- **THEN** 校验 MUST 在播放前抛错

#### Scenario: timeline 数组会被拒绝

- **WHEN** 开发者传入 `timeline: []`
- **THEN** 校验 MUST 在播放前拒绝该配置

#### Scenario: timeline 中 per-keyframe timingFunction

- **WHEN** 开发者传入 `{ duration: 2, timeline: { "0%": { opacity: 0, timingFunction: "easeInOut" }, "100%": { opacity: 1 } } }`
- **THEN** 编译后 `at: 0` 的 keyframe MUST 携带 `timingFunction: "easeInOut"`（控制从 0% 到 100% 的插值）

#### Scenario: 最后一帧的 timingFunction 被忽略

- **GIVEN** timeline 中仅 `"100%"` 帧有 `timingFunction: "easeIn"`
- **WHEN** timeline 被编译和评估
- **THEN** 最后一帧上的 `timingFunction` MUST 无效果（没有下一个 keyframe 可以插值）

---

### Requirement: 三级 timingFunction 级联

评估两个相邻 keyframe 之间的插值曲线时，SDK MUST 按以下优先级（从高到低）解析 `timingFunction`：

1. `keyframe.timingFunction` -- 每帧级（控制本帧 -> 下一帧）
2. `track.timingFunction` -- 每轨默认
3. `config.timingFunction` -- 全局默认
4. `'linear'` -- 内置兜底

此级联统一适用于所有三种配置形状（段、tracks、timeline）。在 timeline 配置中，百分比帧内的 per-keyframe `timingFunction` 在脱糖后映射为第 1 级。

#### Scenario: 默认兜底为 linear

- **WHEN** 任何层级都未指定 `timingFunction`
- **THEN** keyframe 之间的插值 MUST 使用 `'linear'`

#### Scenario: config 级 timingFunction 覆盖默认

- **WHEN** config 指定 `timingFunction: 'easeInOut'` 且无 track 或 keyframe 覆盖
- **THEN** 所有 keyframe 对 MUST 使用 `'easeInOut'`

#### Scenario: track 级覆盖 config 级

- **GIVEN** config `timingFunction: 'linear'` 且某 track 有 `timingFunction: 'easeIn'`
- **THEN** 该 track 的 keyframe 对 MUST 使用 `'easeIn'`

#### Scenario: keyframe 级覆盖 track 级

- **GIVEN** 某 track 有 `timingFunction: 'easeIn'`，其中一个 keyframe 有 `timingFunction: 'easeOut'`
- **THEN** 从该 keyframe 到下一个的段 MUST 使用 `'easeOut'`

#### Scenario: 最后一个 keyframe 的 timingFunction 无效果

- **GIVEN** track 中最终 keyframe（最高 `at`）有 `timingFunction: 'easeIn'`
- **THEN** 它 MUST 被忽略（不存在后续 keyframe）

---

### Requirement: React API 中每个 binding 对应一个 AnimationObject

SDK MUST 通过一个 opaque React `animation` binding 实现容器动画，该 binding 同一时刻最多由一个 native `AnimationObject` 支撑。按目标的控制器类别名 MUST NOT 作为公共 API 的一部分。

#### Scenario: React 单一 hook + 绑定时创建 AnimationObject

- **WHEN** 开发者调用 `useAnimation(config)` 并将 `animation` 通过 `xr-animation` prop 传给组件
- **THEN** SDK MUST 从组件类型解析目标，并为该目标创建 `AnimationObject`

### Requirement: Model 上 clip 播放独立

`SpatializedStatic3DElement` 上的 USD 内嵌动画（model ref 的 `play`/`pause`）MUST 保持为独立于 transform timeline `motion.play()` 的 API。

#### Scenario: Model clip 播放不占用 motion api

- **WHEN** 开发者在 `<Model>` 上调用 `ref.play()`
- **THEN** motion 元组 API MUST 保持独立，MUST NOT 被 clip 播放调用所暗示

### Requirement: 目标在绑定时解析

公开 hook `useAnimation(config)` MUST NOT 要求 config 中有 `kind` 字段。返回的 `animation` binding MUST 携带延迟目标。目标解析 MUST 在 binding 作为 `xr-animation` prop 传给组件时发生：

| 组件 | 解析目标 |
|------|---------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` |
| `<Model>` | `static3d` |
| `<Reality>` | `dynamic3d` |

#### Scenario: 绑定到 enable-xr 解析为 2D

- **WHEN** `useAnimation(config)` 返回的 `animation` 作为 `xr-animation` 传给 `<div enable-xr>`
- **THEN** SDK MUST 将目标解析为 `spatialized2d` 并创建 element `AnimationObject`

#### Scenario: 绑定到 Model 解析为 static3d

- **WHEN** `animation` 作为 `xr-animation` 传给 `<Model>`
- **THEN** SDK MUST 将目标解析为 `static3d` 并创建 element `AnimationObject`

#### Scenario: 绑定到 Reality 解析为 dynamic3d

- **WHEN** `animation` 作为 `xr-animation` 传给 `<Reality>`
- **THEN** SDK MUST 将目标解析为 `dynamic3d` 并创建 element `AnimationObject`

#### Scenario: 单绑定约束

- **WHEN** 同一 `animation` binding 同时传给多个组件
- **THEN** SDK MUST 抛错或警告，仅第一次绑定 MUST 生效

#### Scenario: 绑定前播放排队

- **WHEN** 在 `animation` 绑定到任何组件之前调用 `api.play()`
- **THEN** play 命令 MUST 被排队，目标解析后执行

#### Scenario: autoStart false 不吞掉绑定前显式 play

- **GIVEN** `useAnimation({ ..., autoStart: false })` 返回了未绑定的 `animation`
- **WHEN** 应用代码在绑定前显式调用 `api.play()`
- **AND** `animation` 随后绑定到支持的目标
- **THEN** SDK MUST 执行排队的显式 play
- **AND** `autoStart: false` MUST 只禁止 implicit play-on-bind

#### Scenario: 绑定前显式 finish 会在绑定后 flush

- **GIVEN** `useAnimation({ ..., autoStart: false })` 返回了未绑定的 `animation`
- **WHEN** 应用代码在绑定前显式调用 `api.finish()`
- **AND** `animation` 随后绑定到支持的目标
- **THEN** native-backed `AnimationObject` 创建完成后，SDK MUST flush 这条排队的显式 `finish` 命令
- **AND** API MUST 继续以 native 状态确认作为唯一 finished 状态来源，而不是本地合成一个 `finished` 状态

#### Scenario: Static3D opacity 在校验阶段被拒绝

- **GIVEN** animation binding 解析为 `static3d`
- **WHEN** 归一化 config 包含 `opacity` track
- **THEN** `validateSpatializedMotionConfig` MUST 在 `CreateSpatializedElementAnimation` 前拒绝该 config
- **AND** SDK MUST NOT 静默忽略该 `opacity` track