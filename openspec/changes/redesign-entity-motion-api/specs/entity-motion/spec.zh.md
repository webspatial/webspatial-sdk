## 新增需求

### Requirement: `useEntityAnimation` 暴露新的 Entity motion 三元组

SDK MUST 提供 `useEntityAnimation(config)` 作为公共 Entity motion hook。该 hook MUST 返回三元组 `[animation, api, entityProps]`。

返回的 `animation` 对象 MUST 能通过 Entity 组件上的 `xr-animation` 进行绑定，并且 SHOULD 继续兼容 `animation` 绑定。返回的 `entityProps` 对象 MUST 是一个稀疏的 React outlet，并且只包含 Entity transform 字段：`position`、`rotation`、`scale`。

#### Scenario: Hook 返回结构
- **WHEN** 应用代码调用 `useEntityAnimation(config)`
- **THEN** hook MUST 返回 `[animation, api, entityProps]`
- **AND** `api` MUST 暴露 `play`、`pause`、`resume`、`stop`、`reset` 和 `finish`
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

公开的 v1 authoring surface MUST 支持 segment 风格的 `from` / `to` 和百分比 `timeline`。`tracks` MAY 作为内部或高级执行形态存在，但对不支持的目标必须显式失败。

#### Scenario: Segment config 使用 Entity props 字段
- **WHEN** 应用在 Entity motion 中定义 `from` 或 `to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** `transform.translate`、`transform.rotate`、`transform.scale` MUST NOT 作为 Entity 的公开目标态 config 契约

#### Scenario: Timeline 使用百分比关键帧
- **WHEN** 应用通过 `timeline` 定义 Entity motion
- **THEN** SDK MUST 接受 `0%`、`50%`、`100%` 这类百分比 key
- **AND** 每个关键帧块 MUST 使用 `position`、`rotation` 和 `scale` 这组 Entity props 字段

#### Scenario: Tracks property 使用 Entity 风格路径
- **WHEN** SDK 暴露或内部处理 Entity motion `tracks`
- **THEN** property 路径 MUST 使用 `position.*`、`rotation.*`、`scale.*`
- **AND** `transform.translate.*`、`transform.rotate.*`、`transform.scale.*` MUST NOT 作为 Entity target 的 property 路径契约

#### Scenario: 不支持的目标必须显式失败
- **WHEN** Entity motion config 包含 `opacity` 这类不支持的目标
- **THEN** SDK MUST 通过校验失败或 `onError` 暴露显式错误
- **AND** 不支持的目标 MUST NOT 被静默忽略

### Requirement: `entityProps` 持久化已提交的 transform 状态

SDK MUST 使用 `entityProps` 作为动画系统持有的已提交 Entity transform 值在 React 侧的持久化 outlet。

`entityProps` MUST NOT 逐帧更新。它 MUST 只在动画系统提交有意义的生命周期值时更新，包括 start、complete、stop、reset 和 finish。

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

`api.set(values)` 目前不是已定 requirement；是否暴露以及是否属于 playback API 仍待后续决策。

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

### Requirement: 动画 alive 期间由动画系统持有被动画控制的 transform 字段

在动画处于活跃播放状态时，动画系统 MUST 持有被动画控制的 Entity transform 字段。此时 React 对相同字段的直接 props 写入 MUST NOT 打断播放，MUST NOT 立即覆盖动画值，也 MUST NOT 在完成后自动 replay。

#### Scenario: React props 不覆盖活动动画
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用更新当前正在被动画控制的 `position`、`rotation` 或 `scale` props
- **THEN** 这些 props 写入 MUST NOT 覆盖活动动画

#### Scenario: terminal 状态优先于陈旧 base props
- **GIVEN** 一个 Entity 组件同时组合了静态 props 与 spread 的 `entityProps`
- **WHEN** 动画进入 terminal 状态
- **THEN** `entityProps` 中的已提交值 MUST 代表权威终态 transform
- **AND** 推荐的组合顺序是让 `entityProps` 放在陈旧 base props 之后应用