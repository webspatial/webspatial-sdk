# 空间化容器动画

## 范围

本能力为 `Spatialized2DElement`、`SpatializedStatic3DElement` 和 `SpatializedDynamic3DElement` 定义一套公开容器动画 API。Entity 动画继续使用独立的 `useEntityAnimation` / `AnimateTransform` 栈。

## 新增需求

### Requirement: 一套与目标无关的容器动画 API

SDK 的实验入口 `@webspatial/react-sdk/experimental` MUST 暴露返回 `[animation, api, style]` 的 `useAnimation(config)`。React SDK 默认入口和 eager 入口 MUST NOT 暴露 `useAnimation` 或 `useEntityAnimation`。Config MUST NOT 包含目标 `kind`；SDK MUST 在 opaque `animation` binding 通过 `xr-animation` 绑定时解析目标。

| 绑定组件 | 解析目标 | Native 动画字段 |
|---|---|---|
| `<div enable-xr>` / SpatialDiv | `spatialized2d` | 容器根 `transform`、`opacity` |
| `<Model>` | `static3d` | 容器根 `transform`、`opacity` |
| `<Reality>` | `dynamic3d` | 容器根 `transform`、`opacity` |

#### Scenario: Binding 解析目标

- **WHEN** 同一份有效动画 config 绑定到 `enable-xr` 节点、`<Model>` 或 `<Reality>`
- **THEN** SDK MUST 对三种目标接受相同的公开 config 形状
- **AND** SDK MUST 为解析出的目标创建 native 播放

#### Scenario: 一个 binding 只有一个目标

- **WHEN** 同一 `animation` binding 同时绑定到多个组件
- **THEN** SDK MUST 拒绝后续绑定或发出警告
- **AND** 只有第一次绑定 MUST 生效

#### Scenario: Entity 动画保持独立

- **WHEN** 开发者通过 `useEntityAnimation` 动画化子 `Entity`
- **THEN** 该动画 MUST 保持在 Entity 栈
- **AND** 它 MUST NOT 使用容器 `AnimationObject`

### Requirement: 公开 config 支持简单写法和 timeline 写法

实验性的 `useAnimation(config)` 输入 MUST 支持以下两种写法之一：

1. 顶层 segment authoring，必须同时提供 `from` 和 `to` 视觉值。
2. `timeline` 对象，可以混合使用 `from`、`to` 和 key 匹配 `/^\d+(\.\d+)?%$/` 的百分比关键帧。

`duration`、`timingFunction`、`delay`、`autoStart`、`loop`、`playbackRate` 和生命周期回调保留在外层 config。未使用百分比 key 时，duration 可选并默认为 0.3 秒。Config 只要包含百分比 key，就 MUST 提供 `duration`。

存在 `timeline` 时，顶层 `from` 和 `to` MAY 同时不存在。若提供其中任意字段，Core MUST 忽略该字段；顶层值 MUST NOT 参与 validation 或 normalization。公开类型和运行时校验 MUST 拒绝顶层 `tracks`。

`timeline` 中的每个动画标量属性 MUST 生成至少两个关键帧。属性 MAY 晚于 0% 开始或早于 100% 结束；在其已声明关键帧范围之外采样时 MUST 保持首值或末值。同一属性同时出现在 `from` 和 `0%`，或同时出现在 `to` 和 `100%` 时，SDK MUST 将其作为重复边界声明拒绝。

#### Scenario: 接受顶层 segment

- **WHEN** 开发者在没有 `timeline` 时提供顶层 `from` 和 `to`
- **THEN** SDK MUST 将其作为简单 segment authoring 接受
- **AND** SDK MUST 在播放前将其归一化为内部按属性拆分的 tracks

#### Scenario: 拒绝不完整的顶层 segment

- **WHEN** config 没有 `timeline`，并且缺少顶层 `from` 或顶层 `to` 之一
- **THEN** 公开类型 MUST 拒绝该 config
- **AND** 运行时校验 MUST 在 native create 前拒绝该 config

#### Scenario: timeline 混合边界和百分比关键帧

- **WHEN** 开发者在 `timeline` 中提供 `from`、一个或多个中间百分比 key 和 `to`
- **THEN** SDK MUST 接受该混合 timeline
- **AND** SDK MUST 将 `from` 归一化为 0%、`to` 归一化为 100%，并按声明位置归一化百分比 key

#### Scenario: timeline authoring 省略顶层边界

- **WHEN** 有效 `timeline` 为每个动画属性提供至少两个关键帧
- **AND** 顶层 `from` 和 `to` 同时不存在
- **THEN** SDK MUST 接受该 config

#### Scenario: timeline 优先于顶层边界

- **GIVEN** config 同时包含 `timeline` 和顶层 `from` 或 `to`
- **WHEN** config 被校验和归一化
- **THEN** Core MUST 忽略顶层 `from` 和 `to`
- **AND** 只有 `timeline` 内容 MUST 决定动画

#### Scenario: 属性晚于 timeline 起点开始

- **GIVEN** 某动画属性首次出现在 0% 之后，并且至少还出现在一个更晚的帧中
- **WHEN** timeline 被校验，并在该属性首个关键帧之前采样
- **THEN** SDK MUST 接受该 config
- **AND** SDK MUST 在该属性首个关键帧之前保持其首值

#### Scenario: 属性早于 timeline 终点结束

- **GIVEN** 某动画属性至少出现在两个帧中，且最后一个关键帧早于 100%
- **WHEN** timeline 被校验，并在该属性最后一个关键帧之后采样
- **THEN** SDK MUST 接受该 config
- **AND** SDK MUST 将该属性末值保持到 timeline 结束

#### Scenario: 拒绝属性只有一个关键帧

- **WHEN** 某动画属性只出现在一个 timeline entry 中
- **THEN** 运行时校验 MUST 在 native create 前拒绝该 config

#### Scenario: 拒绝重复边界声明

- **WHEN** 同一属性同时出现在 `from` 和 `0%`，或同时出现在 `to` 和 `100%`
- **THEN** 运行时校验 MUST 在 native create 前拒绝该 config

#### Scenario: 拒绝 timeline 数组

- **WHEN** 开发者提供 `timeline: []`
- **THEN** 运行时校验 MUST 在 native create 前拒绝该 config

### Requirement: 百分比关键帧行为确定

SDK MUST 支持小数百分比。每个百分比 MUST 位于 `[0%, 100%]`；非法 key 和越界百分比 MUST 被拒绝。Timeline entry MAY 在不同属性之间保持 sparse，只要每个动画属性都生成至少两个关键帧。

归一化 MUST 将 `from` 视为 0%、将 `to` 视为 100%，将每个百分比解析为比例，并乘以 `duration` 得到内部绝对关键帧时间。每个动画标量属性 MUST 独立收集。如果某属性未出现在某个中间百分比帧中，该属性在该时间点不生成关键帧。

#### Scenario: 归一化小数百分比

- **WHEN** `duration` 为 10，某帧声明在 `30.33%`
- **THEN** 其内部绝对关键帧时间 MUST 为 3.033 秒

#### Scenario: 独立收集属性

- **GIVEN** opacity 声明在 `0%`、`50%` 和 `100%`
- **AND** translation X 只声明在 `0%` 和 `100%`
- **WHEN** timeline 被归一化
- **THEN** opacity track MUST 包含三个关键帧
- **AND** translation X track MUST 包含两个关键帧

#### Scenario: 属性关键帧范围外保持值

- **WHEN** 内部 track 在首个关键帧前或最后一个关键帧后被采样
- **THEN** 它 MUST 分别使用首值或末值

### Requirement: Tracks 仅供内部使用

SDK MUST 在 native create 前将顶层 segment authoring 和公开 timeline authoring 归一化为 canonical 内部 tracks 文档。内部文档 MUST 包含 `duration`、可选时序控制和非空 tracks 数组。每条 track MUST 包含一个白名单属性和至少两个按绝对时间排序的数值关键帧。Sparse track MAY 晚于 time zero 开始或早于 `duration` 结束。

Track、keyframe、property path、归一化 timeline 和 native wire 类型 MUST NOT 从稳定 Core 或 React 包入口导出。`useAnimation` MUST NOT 接受 tracks authoring。公开文档和 test-server 示例 MUST NOT 将 tracks 展示为 authoring。本变更 MUST NOT 提供 experimental tracks 入口。

#### Scenario: 顶层 segment 编译为内部 tracks

- **WHEN** 顶层 segment 在 0.5 秒内将 opacity 从 0 动画到 1
- **THEN** 归一化 MUST 创建时间为 0 和 0.5 秒的内部 opacity track

#### Scenario: 百分比 timeline 编译为内部 tracks

- **WHEN** 两秒 timeline 在 `0%`、`50%` 和 `100%` 声明 opacity
- **THEN** 归一化 MUST 创建时间为 0、1 和 2 秒的内部 opacity 关键帧

#### Scenario: Canonical tracks 发送给 native

- **WHEN** Core 发送 `CreateSpatializedElementAnimation`
- **THEN** command MUST 包含归一化后的内部 tracks 文档
- **AND** native MUST NOT 接收或解析公开 authoring 形状

### Requirement: 仅允许视觉容器属性

容器动画 MUST 支持 `opacity`，以及 `transform.translate`、`transform.rotate`、`transform.scale` 下的 X、Y、Z 标量路径。`width`、`height`、`back`、`backOffset`、`depth` 等布局和空间尺寸字段 MUST 在 native create 前被拒绝。

#### Scenario: 拒绝布局属性

- **WHEN** 公开 timeline 值解析出不可动画化的布局或空间尺寸字段
- **THEN** 校验 MUST 在 native 播放前失败

#### Scenario: Transform 组合顺序稳定

- **WHEN** 同一时间采样到多个 transform 标量
- **THEN** SDK MUST 按 translate、rotate、scale 的顺序组合

### Requirement: Timing function 解析可预测

对于百分比关键帧 authoring，从某帧到下一帧的插值 MUST 依次使用该帧的 `timingFunction`、外层 config 的 `timingFunction`、`linear`。最后一帧上的 timing function 不生效。段 authoring MUST 使用外层 config timing function 或 `linear`。

内部 tracks 文档 MAY 在关键帧或 track 上携带解析后的 timing function，但这些内部字段不属于公开 authoring API。

#### Scenario: 帧 timing 覆盖 config timing

- **WHEN** 某百分比帧声明 `easeOut`，外层 config 声明 `easeIn`
- **THEN** 从该帧到下一帧的插值 MUST 使用 `easeOut`

#### Scenario: 默认 timing 为 linear

- **WHEN** 当前帧和外层 config 都未声明 timing function
- **THEN** 插值 MUST 使用 `linear`

### Requirement: Native-first AnimationObject 播放

Binding 解析目标后，Core MUST 通过 `SpatializedElement.createAnimation(config)` 创建 native-backed `AnimationObject`。Create MUST 校验并归一化公开 config，为该对象锁定归一化 timeline；除非随后触发 implicit auto-start 或排队的显式 play，否则 create 本身 MUST NOT 启动采样。

播放控制 MUST 作用于同一对象。Config signature 变化或 target 重新绑定时，SDK MUST 销毁并重建对象，而不是修改已锁定 timeline。纯 Web runtime MUST NOT 启动 Web RAF fallback。

#### Scenario: Bind 前 play 排队

- **WHEN** `api.play()` 在 `xr-animation` 解析目标前调用
- **THEN** 命令 MUST 排队
- **AND** 它 MUST 在 native-backed 对象创建后运行
- **AND** 不得启动 Web RAF fallback

#### Scenario: 显式 play 不被 autoStart false 吞掉

- **GIVEN** `autoStart` 为 false
- **WHEN** bind 前显式调用 `api.play()`
- **THEN** 该命令 MUST 仍在 bind 后运行

#### Scenario: Config 变化重建播放对象

- **WHEN** 归一化 config signature 变化
- **THEN** 当前 native-backed 对象 MUST 被销毁
- **AND** SDK MUST 为已绑定目标创建拥有新锁定 timeline 的新对象

#### Scenario: 纯 Web runtime 无播放 fallback

- **WHEN** native `AnimationObject` 支持不可用
- **THEN** `supports('useAnimation')` MUST 为 false
- **AND** SDK MUST NOT 运行 JavaScript RAF sampler

### Requirement: Target-specific 写入保持组件边界

Static3D 动画 MUST 写 `<Model>` 容器根，MUST NOT 写模型内部 `entityTransform` 或 `modelTransform` 字段。Dynamic3D 动画 MUST 写 `<Reality>` 容器根；子 Entity 保持在局部空间并随容器移动。Spatialized2D 动画 MUST 写空间化容器根。

#### Scenario: Model clip 播放保持独立

- **WHEN** 开发者通过 Model ref 调用 `play()` 或 `pause()` 播放内嵌 USD clip
- **THEN** 容器动画会话 MUST 保持独立

#### Scenario: Reality 动画不成为 Entity 动画

- **WHEN** timeline 绑定到 `<Reality>`
- **THEN** native 播放 MUST 更新 Reality 容器根
- **AND** 它 MUST NOT 将子 Entity transform 路由到容器动画栈

### Requirement: 返回的 style 闭合宿主视觉状态

开发者 MUST 将返回的 `style` 合并到接收 `xr-animation` 的同一宿主。未合并时播放 MAY 启动，但 rerender 或 resync 后的终态视觉持久性不受保证。

对于 Spatialized2D 终态 handoff，只有直接在 React props 中提供的 `style.opacity` 或 `style.transform` 才属于显式声明样式。仅来自 `className`、样式表、继承视觉效果或 `getComputedStyle()` 的值 MUST NOT 被视为显式声明值。

#### Scenario: 合并 style 保持终态值

- **WHEN** stop、reset、finish 或自然完成后发生宿主 rerender 或 resync
- **THEN** 已合并返回 style 的宿主 MUST 保持动画发出的终态视觉值

#### Scenario: 2D 显式声明样式重新获得控制权

- **GIVEN** Spatialized2D 宿主在 React `style` 中显式声明被动画化字段
- **WHEN** 终态 mask handoff 完成
- **THEN** 该显式声明值 MUST 重新获得终态后控制权
- **AND** native 采样终态值 MUST 继续作为生命周期回调值

### Requirement: 播放和生命周期语义共享

API MUST 暴露 `play`、`pause`、`stop`、`reset` 和 `finish`，以及 `isAnimating`、`isPaused`、`finished`、`playState`。API MUST NOT 暴露 `resume()`。`play()` 和 `pause()` 是整体会话操作，MUST NOT 接受 track selector。

- Paused 状态下调用 `play()` 会恢复会话。
- Running 状态下调用 `play()` 是 no-op。
- `stop()` 冻结当前采样值，返回 `idle`，并设置 `finished=false`。
- `reset()` 总是采样 timeline 的 time zero，返回 `idle`，并设置 `finished=false`，即使已经处于 idle；sparse property track 使用其首值。
- `finish()` seek 到终态值，且仅在 native 确认后进入 `finished`。
- Bind 前的 `finish()` 保持 `queued` 且 `finished=false`，直到 native-backed 对象存在并确认终态。

#### Scenario: 终止命令保持独立

- **WHEN** 调用 stop、reset 或 finish
- **THEN** 其行为 MUST NOT 被另一个终止命令吞掉或替代

#### Scenario: Native 终态权威

- **WHEN** stop、reset、finish 或自然完成产生终态值
- **THEN** native-backed `AnimationObject` MUST 提供这些值和权威状态

### Requirement: 生命周期回调一致且互斥

Config MUST 支持 `onStart`、`onComplete`、`onStop`、`onReset` 和 `onError`。自然完成和已确认的 `finish()` 调用 `onComplete`；`stop()` 调用 `onStop`；`reset()` 调用 `onReset`。每次会话终止时，`onComplete`、`onStop`、`onReset` 中恰好一个 MUST 触发。`onError` MAY 因异步 native 失败独立触发。

#### Scenario: Finish 调用 onComplete

- **WHEN** native 确认显式 finish
- **THEN** `onComplete` MUST 接收终态值
- **AND** `finished` MUST 变为 true

#### Scenario: Stop 和 reset 清除 finished

- **WHEN** stop 或 reset 完成
- **THEN** `finished` MUST 为 false

### Requirement: Animating mask 保护 active native 控制权

Native 播放拥有 `transform` 或 `opacity` 时，普通 element sync MUST NOT 覆盖被拥有字段。Pause 保留采样值和 mask。Stop、reset、finish、自然完成、unbind、destroy 和 element destroy MUST 一致地释放或更新 mask 控制权，且 MUST NOT 让 native 与 React 同时拥有同一视觉字段。

#### Scenario: 普通更新不能覆盖 active animation

- **GIVEN** native 播放拥有 transform 或 opacity
- **WHEN** 普通 element sync 写入该字段
- **THEN** 冲突写入 MUST 被忽略或延迟到控制权 handoff 后

#### Scenario: Element destroy 清理 animation

- **WHEN** 已绑定的 spatialized element 被销毁
- **THEN** 所有关联 native-backed animation 状态和 mask 控制权 MUST 被清理
