# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义绑定时目标解析的声明式动画

平台 MUST 为以下目标文档化和实现声明式 timeline 动画：`spatialized2d`、`static3d`、`dynamic3d`。每个目标 MUST 有子 spec 定义属性白名单、native 后端和 React 集成。公开 hook MUST NOT 需要 `config.kind`；目标在返回的 `animation` binding 作为 `xr-animation` prop 传给组件时自动解析（`<div enable-xr>` → spatialized2d、`<Model>` → static3d、`<Reality>` → dynamic3d）。`SpatialEntity` transform timeline 不在本伞式范围内，当前继续通过独立 entity 栈上的 `useEntityAnimation` 处理。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的已交付 vs 计划状态

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

- **WHEN** 调用 `api.finish()`
- **THEN** style MUST 跳到 `to`（最终）值，`playState` MUST 变为 `finished`，`finished` MUST 变为 `true`，且 MUST 调用 `onComplete` 并传入最终值

#### Scenario: idle.reset() 不得为 no-op

- **GIVEN** 动画已经处于 `idle`
- **WHEN** 调用 `api.reset()`
- **THEN** SDK MUST 继续发出 `from` 值，并且 MUST 保持 `playState` 为 `idle`

#### Scenario: idle.finish() 不得为 no-op

- **GIVEN** 动画已经处于 `idle`
- **WHEN** 调用 `api.finish()`
- **THEN** SDK MUST 继续发出 `to` 值，并且 MUST 将 `playState` 切换为 `finished`

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

#### Scenario: Style 值来源遵循后端对称性

- **WHEN** 调用终止方法（`stop`、`reset`、`finish`）
- **THEN** Web 后端 MUST 由 JS timeline 评估器计算 style 值；Native 后端 MUST 由 native 运行时提供 style 值（native 未返回值时以 JS 评估器作为 fallback）

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

- **WHEN** 调用 `api.finish()`
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

- **WHEN** 调用 `api.finish()`
- **THEN** `finished` 标记 MUST 为 `true`

#### Scenario: Controller state 只表达整体会话

- **WHEN** 开发者暂停或恢复 motion controller
- **THEN** controller 状态机 MUST 只表达整体会话状态（`idle`、`queued`、`running`、`paused`、`finished`）
- **AND** controller MUST NOT 暴露 partially-paused 或 key-level 聚合状态

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

### Requirement: 单一 Core 控制器实现

SDK MUST 以一个 `SpatializedMotionController` 类（按绑定目标参数化，`animation` 挂载到组件时解析）实现容器动画。按目标的控制器类别名 MUST NOT 作为公共 API 的一部分。

#### Scenario: React 单一 hook + 绑定时解析

- **WHEN** 开发者调用 `useAnimation(config)` 并将 `animation` 通过 `xr-animation` prop 传给组件
- **THEN** SDK MUST 从组件类型解析目标，路由到匹配目标策略的同一控制器实现

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
- **THEN** SDK MUST 将目标解析为 `spatialized2d` 并激活 2D 策略（Web RAF + native）

#### Scenario: 绑定到 Model 解析为 static3d

- **WHEN** `animation` 作为 `xr-animation` 传给 `<Model>`
- **THEN** SDK MUST 将目标解析为 `static3d` 并激活仅 native 策略

#### Scenario: 绑定到 Reality 解析为 dynamic3d

- **WHEN** `animation` 作为 `xr-animation` 传给 `<Reality>`
- **THEN** SDK MUST 将目标解析为 `dynamic3d` 并激活仅 native 策略

#### Scenario: 单绑定约束

- **WHEN** 同一 `animation` binding 同时传给多个组件
- **THEN** SDK MUST 抛错或警告，仅第一次绑定 MUST 生效

#### Scenario: 绑定前播放排队

- **WHEN** 在 `animation` 绑定到任何组件之前调用 `api.play()`
- **THEN** play 命令 MUST 被排队，目标解析后执行