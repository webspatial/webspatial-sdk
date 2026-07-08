## 新增需求

### Requirement: `useEntityAnimation` 暴露新的 Entity motion 三元组

SDK MUST 提供 `useEntityAnimation(config)` 作为公共 Entity motion hook。该 hook MUST 返回三元组 `[animation, api, entityProps]`。

返回的 `animation` 对象 MUST 能通过 Entity 组件上的 `xr-animation` 进行绑定，并且 SHOULD 继续兼容 `animation` 绑定。返回的 `entityProps` 对象 MUST 是一个稀疏的 React outlet，并且只包含 Entity transform 字段：`position`、`rotation`、`scale`。

#### Scenario: Hook 返回结构
- **WHEN** 应用代码调用 `useEntityAnimation(config)`
- **THEN** hook MUST 返回 `[animation, api, entityProps]`
- **AND** `api` MUST 暴露 `play`、`pause`、`resume`、`stop`、`reset`、`finish` 和 `set`
- **AND** `set` MUST 被记录为已提交 transform 值的状态 setter，而不是 playback 命令
- **AND** `entityProps` MUST 只包含 `position`、`rotation` 和 `scale`

#### Scenario: Entity 通过 `xr-animation` 绑定
- **WHEN** 返回的 `animation` 对象通过 `xr-animation` 传给 Entity 组件
- **THEN** SDK MUST 将其视为 Entity motion 的绑定输入

#### Scenario: Entity 继续兼容 `animation` 绑定
- **WHEN** 返回的 `animation` 对象通过 `animation` 传给 Entity 组件
- **THEN** SDK MUST 继续将其视为可用的 Entity motion 绑定输入
- **AND** 文档 SHOULD 将 `xr-animation` 描述为推荐写法

#### Scenario: 同一个 binding 不能驱动多个 Entity
- **GIVEN** 某个 `animation` 对象已经绑定到一个 Entity 实例
- **WHEN** 应用尝试把同一个对象绑定到第二个 Entity 实例
- **THEN** SDK MUST 立即失败，而不是允许多 Entity 共享

### Requirement: Entity motion authoring 使用 Entity props 层级

公共 Entity motion config MUST 使用与 Entity props 一致的字段：
- `position`
- `rotation`
- `scale`

公开的 v1 authoring surface MUST 支持 segment 风格的 `from` / `to` 和百分比 `timeline`。`tracks` MUST 保持为内部、非公开的执行形态，MUST NOT 作为公开 authoring surface 文档化。对不支持的目标必须显式失败。

#### Scenario: Segment config 使用 Entity props 字段
- **WHEN** 应用在 Entity motion 中定义 `from` 或 `to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** `transform.translate`、`transform.rotate`、`transform.scale` MUST NOT 作为 Entity 的公开目标态 config 契约

#### Scenario: Timeline 使用百分比关键帧
- **WHEN** 应用通过 `timeline` 定义 Entity motion
- **THEN** SDK MUST 接受 `0%`、`50%`、`100%` 这类百分比 key
- **AND** 每个关键帧块 MUST 使用 `position`、`rotation` 和 `scale` 这组 Entity props 字段

#### Scenario: Tracks property 使用 Entity 风格路径
- **WHEN** SDK 内部处理 Entity motion `tracks`
- **THEN** property 路径 MUST 使用 `position.*`、`rotation.*`、`scale.*`
- **AND** `transform.translate.*`、`transform.rotate.*`、`transform.scale.*` MUST NOT 作为 Entity target 的 property 路径契约

#### Scenario: 不支持的目标必须显式失败
- **WHEN** Entity motion config 包含 `opacity` 这类不支持的目标
- **THEN** SDK MUST 通过校验失败或 `onError` 暴露显式错误
- **AND** 不支持的目标 MUST NOT 被静默忽略

### Requirement: `entityProps` 持久化已提交的 transform 状态

SDK MUST 使用 `entityProps` 作为动画系统持有的已提交 Entity transform 值在 React 侧的持久化 outlet。

`entityProps` MUST NOT 逐帧更新。它 MUST 只在动画系统提交有意义的生命周期值时更新，包括 start、complete、stop、reset、finish 以及每次 `api.set` 调用（含其 updater 形式）。

#### Scenario: complete 把终态写入 `entityProps`
- **WHEN** 一个非循环 Entity 动画自然完成
- **THEN** `entityProps` MUST 反映完成后的 transform 终态
- **AND** 后续 React render 可以通过把 `entityProps` spread 到 Entity 组件上来保留该终态

#### Scenario: 不做逐帧 React outlet 更新
- **WHEN** native 播放正在关键帧之间插值
- **THEN** SDK MUST NOT 在每一帧都更新 `entityProps`

### Requirement: Playback 与 callback 语义对齐新的 motion 模型

Entity motion MUST 在保持 transform-only 约束的前提下，对齐新的 motion 家族 playback surface 与生命周期语义。

目标 callback surface MUST 包含：
- `onStart`
- `onComplete`
- `onStop`
- `onReset`
- `onError`

callback values MUST 只包含受支持的 Entity transform 字段。

`api.set` 是已确定的 requirement。它是已提交 transform 状态的命令式写入入口，并在下面专门的 `api.set` requirement 中定义。它 MUST NOT 被当作 playback 命令。

#### Scenario: stop 提交 stopped transform 状态
- **WHEN** 应用调用 `api.stop()`
- **THEN** SDK MUST 把当前会话转到文档定义的 stopped terminal 行为
- **AND** `onStop` MUST 只接收 Entity transform 值
- **AND** `entityProps` MUST 更新为 stopped 后已提交的 transform 状态

#### Scenario: reset 恢复 reset-state transform
- **WHEN** 应用调用 `api.reset()`
- **THEN** SDK MUST 恢复到文档定义的 reset transform 状态
- **AND** `onReset` MUST 只接收 Entity transform 值
- **AND** `entityProps` MUST 更新为 reset 后已提交的 transform 状态

#### Scenario: 错误回调不暴露不支持字段
- **WHEN** Entity motion 的播放或校验失败
- **THEN** `onError` MUST 接收到失败信息
- **AND** Entity motion API 的任何 callback value payload 都 MUST NOT 包含 `opacity` 这类不支持字段

### Requirement: 动画 alive 期间由动画系统持有整个 Entity transform

在动画处于活跃播放状态时，动画系统 MUST 持有整个 Entity transform。此时 React 对 `position`、`rotation`、`scale` 的直接 props 写入 MUST NOT 打断播放，MUST NOT 立即覆盖活动动画，也 MUST NOT 在完成后自动 replay。v1 不实现字段级 ownership 组合，因此无论 config 动画了哪些字段，ownership 都作用于整个 transform。

#### Scenario: React props 不覆盖活动动画
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用在动画活跃期间更新任意 `position`、`rotation` 或 `scale` props
- **THEN** 这些 props 写入 MUST NOT 覆盖活动动画，即使是 config 未动画的字段

#### Scenario: terminal 状态优先于陈旧 base props
- **GIVEN** 一个 Entity 组件同时组合了静态 props 与 spread 的 `entityProps`
- **WHEN** 动画进入 terminal 状态
- **THEN** `entityProps` 中的已提交值 MUST 代表权威终态 transform
- **AND** 推荐的组合顺序是让 `entityProps` 放在陈旧 base props 之后应用


### Requirement: 非活跃状态下的 props 写入经 native confirm

在没有活跃动画时（`idle` 或 terminal），Source A 权威，应用通过更新 `position`、`rotation`、`scale` props（或调用 `api.set`）改变 Entity transform。由于 native 是唯一权威 transform 数据源，此类 props 写入 MUST 走与 `api.set` 相同的 native-first 路径:SDK 把写入下发 native,由 native 决定是否接受,`entityProps` 只镜像 native 已 confirm 的值。SDK MUST NOT 额外维护一份与 native 竞争的本地 committed cache。

#### Scenario: 非活跃 props 写入经 native confirm
- **GIVEN** 没有活跃的 Entity 动画（`idle` 或 terminal）
- **WHEN** 应用更新 `position`、`rotation` 或 `scale` props
- **THEN** SDK MUST 把该写入下发 native,由 native 决定是否接受
- **AND** native 接受后 `entityProps` MUST 更新为 native 回传的 confirmed transform 值
- **AND** native 拒绝时 `entityProps` MUST NOT 更新

### Requirement: Callback 只是通知，不驱动终态

Entity motion 的生命周期 callback MUST 只是通知。它们的返回值 MUST 被忽略，MUST NOT 用于控制终态 transform。终态 transform MUST 由播放前声明的 config（例如 `to`）决定，或由播放后通过 `entityProps` / `api.set` 的显式接管决定。

#### Scenario: onComplete 返回值被忽略
- **WHEN** 一个 `onComplete` 回调返回了某个值
- **THEN** SDK MUST 忽略该返回值
- **AND** 该返回值 MUST NOT 覆盖或重定义已提交的终态 transform

#### Scenario: 动态终态通过 config 或显式 set 表达
- **WHEN** 应用需要一个不同于静态 `to` 的终态 transform
- **THEN** 它 MUST 通过播放前的 config 或动画结束后的显式 `api.set` 调用来表达
- **AND** 它 MUST NOT 依赖回调返回值来实现

### Requirement: `api.set` 是已提交 transform 状态的命令式写入入口

SDK MUST 提供 `api.set` 作为 `entityProps` 所镜像的已提交 Entity transform 状态的命令式写入入口。`api.set` MUST 接受一个稀疏的 `EntityMotionProps` 值，或一个 updater 函数 `(prev) => next`。`api.set` MUST NOT 是 playback 命令，MUST NOT seek、start 或改变播放进度。

Entity transform 由两个数据源合成：Source A 是 React props / `entityProps`（已提交状态，通过声明式或 `api.set` 写入），Source B 是 `xr-animation` 绑定（逐帧采样值）。动画活跃（`delay` / `running` / `paused`）时 Source B 权威；动画非活跃（`idle` / terminal）时 Source A 权威。`api.set` 始终写入 Source A。

SDK MUST NOT 提供裸 `api.get`。需要读取当前已提交值的应用代码 MUST 使用 `api.set` 的 updater 形式或读取声明式的 `entityProps`。

#### Scenario: set 更新已提交状态与 entityProps
- **WHEN** 应用调用 `api.set(values)` 并传入 Entity transform 值
- **THEN** SDK MUST 把该写入下发 native,由 native 决定是否接受
- **AND** native 接受后 `entityProps` MUST 更新为 native 回传的 confirmed transform 值
- **AND** native 拒绝时 `entityProps` MUST NOT 更新

#### Scenario: set 执行稀疏合并
- **WHEN** 应用调用 `api.set` 只传入部分 transform 字段，例如 `{ position: { y: 0.3 } }`
- **THEN** SDK MUST 在 JS/Core 侧以最近 confirmed 的 `entityProps` 为基线，只覆盖传入的字段并整份下发 native
- **AND** 未传入的字段如 `rotation`、`scale` MUST 沿用基线中之前的已提交值

#### Scenario: updater 形式读取当前已提交值
- **WHEN** 应用以 updater 函数形式调用 `api.set`
- **THEN** `prev` MUST 是最近 native confirmed 的 `entityProps` 镜像值（Source A），MAY 滞后于 native 实时 transform
- **AND** 读-改-写 MUST 通过 updater 表达，不暴露裸 getter

#### Scenario: 活跃动画期间调用 set 不抛错，且不在终态填充后存留
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用调用 `api.set`
- **THEN** SDK MUST NOT 抛错
- **AND** SDK MUST NOT 打断或覆盖活动动画
- **AND** 写入值 MUST NOT 被排队等待动画结束后 replay
- **AND** 动画到达终态时，终态填充 MUST 覆盖动画活跃期间写入的值

#### Scenario: set 之后 play 的起点
- **WHEN** 应用先调用 `api.set` 再调用 `api.play()`
- **THEN** 如果 config 声明了 `from`，播放 MUST 从 `from` 开始
- **AND** 如果 config 未声明 `from`，播放 MUST 从当前已提交值开始

#### Scenario: 终态填充不 snap 回退
- **WHEN** 动画到达 terminal 状态
- **THEN** SDK MUST 填充到终态 transform 并回写到 `entityProps`
- **AND** SDK MUST NOT 把 Entity snap 回动画前的值
