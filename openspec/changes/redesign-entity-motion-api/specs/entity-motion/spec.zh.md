## 新增需求

### Requirement: `useEntityAnimation` 暴露新的 Entity motion 三元组

SDK MUST 提供 `useEntityAnimation(config)` 作为公共 Entity motion hook。该 hook MUST 返回三元组 `[animation, api, entityProps]`。

返回的 `animation` 对象 MUST 能通过 Entity 组件上的 `animation` 属性进行绑定。返回的 `entityProps` 对象在首个 native confirmed state 之前 MAY 为空;一旦 native 回传 confirmed state,`entityProps` MUST 表示动画系统已提交的 transform 分量(被动画分量的终值,加上 `api.set` 写入的分量),字段范围限定在 `position`、`rotation`、`scale` 之内,且不包含其它属性;从未被动画或 `api.set` 写过的分量 MUST NOT 出现在 `entityProps` 中。

#### Scenario: Hook 返回结构
- **WHEN** 应用代码调用 `useEntityAnimation(config)`
- **THEN** hook MUST 返回 `[animation, api, entityProps]`
- **AND** `api` MUST 暴露 `play`、`pause`、`stop`、`reset`、`finish` 和 `set`
- **AND** `set` MUST 被记录为已提交 transform 值的状态 setter，而不是 playback 命令
- **AND** `entityProps` MUST 只包含 `position`、`rotation` 和 `scale`

#### Scenario: Entity 通过 `animation` 绑定
- **WHEN** 返回的 `animation` 对象通过 `animation` 属性传给 Entity 组件
- **THEN** SDK MUST 将其视为 Entity motion 的绑定输入

#### Scenario: 同一个 binding 不能驱动多个 Entity
- **GIVEN** 某个 `animation` 对象已经绑定到一个 Entity 实例
- **WHEN** 应用尝试把同一个对象绑定到第二个 Entity 实例
- **THEN** SDK MUST 立即失败，而不是允许多 Entity 共享

### Requirement: Entity motion authoring 使用 Entity props 层级

公共 Entity motion config MUST 使用与 Entity props 一致的字段：
- `position`
- `rotation`
- `scale`

公开的 v1 authoring surface MUST 支持三种形态：顶层 `from` / `to`、segment 风格的 `timeline.from` / `timeline.to`，以及百分比关键帧。顶层 `from` / `to` MUST 是 `timeline.from` / `timeline.to` 的等价 authoring 语法糖：Core MUST 把两者归一化为同一份内部轨道。`tracks` MUST 保持为内部、非公开的执行形态，MUST NOT 作为公开 authoring surface 文档化。对不支持的目标必须显式失败。

每个动画 MUST 同时具备起始边界与结束边界：起点是顶层 `from`、`timeline.from` 或 `0%` 帧之一，终点是顶层 `to`、`timeline.to` 或 `100%` 帧之一；缺少任一端的 config MUST 被显式拒绝（通过校验或 `onError`），MUST NOT 用 native baseline 或物体当前姿态兜底缺失的边界帧。此约束作用于全部三种 authoring 形态（顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧）。边界帧内部的**字段**仍可稀疏：某个边界帧未写的标量（如只写 `position` 不写 `rotation`）仍按逐通道缺帧规则回落到 native baseline；被约束的是边界帧本身必须存在，而非帧内每个字段都要写全。

在 `timeline` 内部，`from` MUST 等价于 `0%` 帧、`to` MUST 等价于 `100%` 帧；因此 `timeline.from` / `timeline.to` MAY 与百分比 key 混合出现在同一个 `timeline` 中。同一个 `timeline` 内 `from` 与 `0%`(或 `to` 与 `100%`)MUST NOT 同时出现，重复定义同一帧 MUST 被显式拒绝。

#### Scenario: Segment config 使用 Entity props 字段
- **WHEN** 应用在 Entity motion 中定义 `timeline.from` 或 `timeline.to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** `transform.translate`、`transform.rotate`、`transform.scale` MUST NOT 作为 Entity 的公开目标态 config 契约

#### Scenario: 顶层 from/to 书写一个 segment
- **WHEN** 应用在 Entity motion config 中定义顶层 `from` 和 `to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** Core MUST 把顶层 `from` / `to` 归一化为与 `timeline.from` / `timeline.to` 相同的内部轨道
- **AND** 当顶层 `from` / `to` 是唯一的 authoring 形态且未使用任何百分比 key 时，`duration` MUST 默认为 0.3 秒

#### Scenario: 顶层 from/to 要求两端都提供
- **WHEN** 应用只提供了顶层 `from` 或只提供了顶层 `to`
- **THEN** Core MUST 通过校验或 `onError` 显式拒绝该 config
- **AND** 缺失的边界 MUST NOT 用 native baseline 或物体当前姿态兜底

#### Scenario: timeline 要求起止边界都存在
- **WHEN** 应用定义的 `timeline` 缺少起始边界（既无 `timeline.from` 也无 `0%` 帧）或缺少结束边界（既无 `timeline.to` 也无 `100%` 帧）
- **THEN** Core MUST 通过校验或 `onError` 显式拒绝该 config
- **AND** 缺失的边界帧 MUST NOT 用 native baseline 或物体当前姿态隐式补齐
- **AND** 该约束只针对边界帧的存在性；边界帧内部未写的标量字段 MUST 仍按逐通道缺帧规则回落到 native baseline

#### Scenario: timeline 优先于顶层 from/to
- **GIVEN** 一个同时包含 `timeline` 与顶层 `from` / `to` 的 config
- **WHEN** Core 归一化该 config
- **THEN** `timeline` MUST 决定动画，顶层 `from` / `to` MUST 被忽略
- **AND** Core MUST 发出一条开发期警告，说明顶层 `from` / `to` 被忽略

#### Scenario: Timeline 使用百分比关键帧
- **WHEN** 应用通过 `timeline` 定义 Entity motion
- **THEN** SDK MUST 接受 `0%`、`50%`、`100%` 这类百分比 key
- **AND** 每个关键帧块 MUST 使用 `position`、`rotation` 和 `scale` 这组 Entity props 字段

#### Scenario: timeline 内混合 from/to 与百分比
- **WHEN** 应用在同一个 `timeline` 里同时定义 `from` / `to` 与百分比 key(如 `50%`)
- **THEN** Core MUST 把 `from` 视为 `0%` 帧、`to` 视为 `100%` 帧，并归一化为同一套内部轨道
- **AND** 若同一个 `timeline` 内 `from` 与 `0%`(或 `to` 与 `100%`)同时出现，Core MUST 通过校验或 `onError` 显式拒绝

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

`entityProps` MUST NOT 逐帧更新。它 MUST 只在动画系统提交有意义的生命周期值时更新,包括 start、complete、stop、reset、finish 以及 native 接受的 `api.set(values)` 写入。在首个 confirmed state 之前,`entityProps` MAY 为空;一旦 native 回传 confirmed state,它 MUST 镜像动画系统已提交的 transform 分量(被动画分量的终值,加上 `api.set` 写入的分量),字段范围限定在 `position` / `rotation` / `scale` 之内;从未被动画或 `api.set` 写过的分量 MUST NOT 出现在 `entityProps` 中,以免 spread 时覆盖用户通过 React props 控制的分量。

#### Scenario: complete 把终态写入 `entityProps`
- **WHEN** 一个非循环 Entity 动画自然完成
- **THEN** `entityProps` MUST 反映完成后的 transform 终态
- **AND** 后续 React render 可以通过把 `entityProps` spread 到 Entity 组件上来保留该终态

#### Scenario: 不做逐帧 React outlet 更新
- **WHEN** native 播放正在关键帧之间插值
- **THEN** SDK MUST NOT 在每一帧都更新 `entityProps`

#### Scenario: 循环动画不在 loop 边界提交 `entityProps`
- **GIVEN** 一个 `loop: true` 的 Entity 动画
- **WHEN** 动画越过一个 loop 边界
- **THEN** SDK MUST NOT 在该边界更新 `entityProps`
- **AND** `entityProps` MUST 只在 `stop`、`finish` 或 native 接受的 `api.set(values)` 时提交

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

### Requirement: 每次 fresh play 使用最新 native baseline 编译

Native 创建动画时 MUST 兜底校验并保存规范时间轴、注册动画对象并返回 `animationId`,MUST NOT 在创建阶段读取播放 baseline 或生成 RealityKit 播放资源。fresh play 定义为创建后的首次 `play` / `autoStart`,以及动画在 `complete`、`finish`、`stop` 或 `reset` 后重新开始的 `play`。每次 fresh play 被接受后、进入 `delay` / `running` 前,Native MUST 读取当前 `entity.transform` 作为本轮 baseline,并用规范时间轴与该 baseline 编译本轮 RealityKit 播放资源。config 明确声明的字段 MUST 使用 config 值,config 未声明的字段 MUST 使用本轮 baseline 补全。

`pause` 后的 `play` MUST 恢复当前播放控制器和进度,MUST NOT 读取新 baseline 或重新编译。单次 fresh play 内的 loop MUST 复用本轮播放资源,MUST NOT 在每个 loop 边界重新读取 baseline 或编译。

#### Scenario: 首次播放在 play 时读取 baseline
- **GIVEN** Native 已创建并注册动画对象
- **WHEN** 应用首次调用 `play` 或触发 `autoStart`
- **THEN** Native MUST 在 fresh play 被接受后读取当前 `entity.transform`
- **AND** Native MUST 使用该 transform 作为本轮 baseline 编译并开始播放

#### Scenario: terminal 后重新播放使用最新 baseline
- **GIVEN** 动画已通过 `complete`、`finish`、`stop` 或 `reset` 进入非活跃状态,且当前 native transform 已改变
- **WHEN** 应用再次调用 `play`
- **THEN** Native MUST 将该调用作为 fresh play
- **AND** Native MUST 读取最新 native transform 并重新编译本轮播放资源

#### Scenario: pause 后 play 恢复当前播放
- **GIVEN** 动画已暂停并持有当前播放控制器与资源
- **WHEN** 应用调用 `play`
- **THEN** Native MUST 恢复当前播放进度
- **AND** Native MUST NOT 读取新 baseline 或重新编译

#### Scenario: loop 复用本轮播放资源
- **GIVEN** 当前 fresh play 配置了循环
- **WHEN** 播放到达 loop 边界
- **THEN** Native MUST 复用当前播放资源进入下一圈
- **AND** Native MUST NOT 在该边界读取新 baseline 或重新编译

#### Scenario: fresh play 编译失败
- **WHEN** Native 无法从规范时间轴与本轮 baseline 生成 RealityKit 播放资源
- **THEN** fresh play 的控制命令 MUST 显式失败
- **AND** 动画 MUST 保持非活跃

### Requirement: 动画 alive 期间由动画系统持有整个 Entity transform

在动画处于活跃播放状态时,动画系统 MUST 持有整个 Entity transform 的 ownership:底层平台(visionOS / picoOS)只能绑定整个 `.transform`,因此只要 config 中出现任一动画字段,活跃播放期间整个 transform 归动画所有。config 中未写的分量 MUST 冻结在基准值。此期间对任何分量的 React 直接 props 写入或 `api.set` 写入 MUST NOT 打断播放,MUST NOT 立即覆盖活动动画,也 MUST NOT 在完成后自动 replay;这些写入 MUST 在动画进入非活跃状态后才生效。

#### Scenario: React props 不覆盖活动动画
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用在动画活跃期间更新任一 transform 分量
- **THEN** 这些 props 写入 MUST NOT 覆盖活动动画

#### Scenario: config 未写的分量在动画期间冻结在基准值
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`,且 config 未动画某个分量(例如只动画 `position`)
- **WHEN** 应用在动画活跃期间更新该**未写入 config 的分量**(例如 `rotation`)
- **THEN** 该 props 写入 MUST NOT 立即生效,该分量 MUST 冻结在基准值,并 MUST 在动画进入非活跃状态后才由 props / `api.set` 接管

#### Scenario: terminal 状态优先于陈旧 base props
- **GIVEN** 一个 Entity 组件同时组合了静态 props 与 spread 的 `entityProps`
- **WHEN** 动画进入 terminal 状态
- **THEN** `entityProps` 中的已提交值 MUST 代表权威终态 transform
- **AND** 推荐的组合顺序是让 `entityProps` 放在陈旧 base props 之后应用


### Requirement: 动态接管使用 `api.set`

在没有活跃动画时（`idle` 或 terminal），Source A 权威。应用如果需要在动画后动态接管已提交的 Entity transform，MUST 使用 `api.set`。普通 Entity props 在推荐组合模式中保持为 static/base 输入，MUST NOT 被视为与 `entityProps` 竞争的第二条动态接管通道。

#### Scenario: 非活跃动态接管使用 set
- **GIVEN** 没有活跃的 Entity 动画（`idle` 或 terminal）
- **WHEN** 应用需要接管已提交的 `position`、`rotation` 或 `scale`
- **THEN** 它 MUST 调用 `api.set` 并传入期望的 Entity transform 值
- **AND** static/base Entity props MUST NOT 在推荐组合顺序中覆盖 `entityProps`

### Requirement: Callback 只是通知，不驱动终态

Entity motion 的生命周期 callback MUST 只是通知。它们的返回值 MUST 被忽略，MUST NOT 用于控制终态 transform。终态 transform MUST 由播放前声明的 config（例如顶层 `to` 或 `timeline.to`）决定，或由播放后通过 `entityProps` / `api.set` 的显式接管决定。

#### Scenario: onComplete 返回值被忽略
- **WHEN** 一个 `onComplete` 回调返回了某个值
- **THEN** SDK MUST 忽略该返回值
- **AND** 该返回值 MUST NOT 覆盖或重定义已提交的终态 transform

#### Scenario: 动态终态通过 config 或显式 set 表达
- **WHEN** 应用需要一个不同于静态顶层 `to` 或 `timeline.to` 的终态 transform
- **THEN** 它 MUST 通过播放前的 config 或动画结束后的显式 `api.set` 调用来表达
- **AND** 它 MUST NOT 依赖回调返回值来实现

### Requirement: `api.set` 是已提交 transform 状态的命令式写入入口

SDK MUST 提供 `api.set` 作为 `entityProps` 所镜像的已提交 Entity transform 状态的命令式写入入口。`api.set` MUST 只接受一个稀疏的 `EntityMotionPatch` object(写入侧 patch 类型；与读取侧 `EntityMotionProps` 同为 `{ position?, rotation?, scale? }` 形态，但命名区分)，MUST NOT 支持 updater 函数 `(prev) => next`。`api.set` MUST NOT 是 playback 命令，MUST NOT seek、start 或改变播放进度。

Entity transform 由两个数据源合成:Source A 是 static/base React props 加 `entityProps`(由 SDK 镜像的已提交状态;动态接管通过 `api.set` 写入),Source B 是 `animation` 绑定(逐帧采样值)。仲裁 MUST 对整个 transform 统一进行:动画活跃(`delay` / `running` / `paused`)时 Source B 对整个 transform 权威(config 中未写的分量由 Source B 冻结在基准值),动画非活跃(`idle` / terminal)时 Source A 权威。`api.set` 始终写入 Source A,且仅在动画非活跃时才反映到 transform 上。

SDK MUST NOT 提供裸 `api.get`。需要读取当前已提交值的应用代码 MUST 读取声明式的 `entityProps`，并在需要写入时自行计算 patch 后调用 `api.set(values)`。首个 native confirmed state 之前 `entityProps` MAY 为空，且 MUST NOT 承诺在 mount 时可读：创建或绑定动画 MUST NOT 额外 emit 一个初始 confirmed value。要读取有意义的 native 姿态，应用代码 MUST 先触发一次提交 confirmed value 的 lifecycle（一次到达终态 / lifecycle 节点的 `play`，或一次被接受的 `api.set`）。

#### Scenario: set 更新已提交状态与 entityProps
- **WHEN** 应用调用 `api.set(values)` 并传入 Entity transform 值
- **THEN** SDK MUST 把该写入下发 native,由 native 决定是否接受
- **AND** native 接受后 `entityProps` MUST 更新为 native 回传的 confirmed transform 值
- **AND** native 拒绝时 `entityProps` MUST NOT 更新,且该拒绝 MUST 输出一条 console warning,而不是触发 `onError`

#### Scenario: set 执行稀疏合并
- **WHEN** 应用调用 `api.set` 只传入部分 transform 字段，例如 `{ position: { y: 0.3 } }`
- **THEN** SDK MUST 将该 sparse patch 下发 native，而不是在 JS/Core 侧以 `entityProps` 合并完整值
- **AND** native MUST 以当前 committed `entity.transform` 为基线，只覆盖 patch 中提供的字段
- **AND** 未传入的字段如 `rotation`、`scale` MUST 沿用 native committed baseline 中之前的已提交值

#### Scenario: set 不支持 updater 形式
- **WHEN** 应用以 updater 函数形式调用 `api.set`
- **THEN** SDK MUST 显式拒绝该调用
- **AND** SDK MUST NOT 用空对象、默认值或 stale mirror 伪造 `prev`
- **AND** 读-改-写 MUST 通过读取 `entityProps` 后显式调用 `api.set(values)` 表达

#### Scenario: 活跃动画期间调用 set 不暂存
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用调用 `api.set`
- **THEN** SDK MUST NOT 打断或覆盖活动动画
- **AND** native MUST NOT 暂存该写入，也 MUST NOT 在动画结束后 replay
- **AND** `entityProps` MUST NOT 因该写入更新
- **AND** 被拒绝的写入 MUST 是一次 no-op,并输出一条 console warning,MUST NOT 通过 `onError` 抵达用户

#### Scenario: 未绑定或 native object 未创建前调用 set 无效
- **GIVEN** Entity motion binding 尚未绑定，或对应 native object 尚未创建
- **WHEN** 应用调用 `api.set`
- **THEN** SDK MUST NOT 创建 pending write
- **AND** 该写入 MUST NOT 在后续绑定或 native object 创建后 replay
- **AND** 被拒绝的写入 MUST 是一次 no-op,并输出一条 console warning,MUST NOT 通过 `onError` 抵达用户

#### Scenario: set 之后 play 的起点
- **WHEN** 应用先调用 `api.set` 再调用 `api.play()`
- **THEN** 播放 MUST 从 config 声明的起始边界（顶层 `from`、`timeline.from` 或 `0%` 帧）开始
- **AND** 本次 `api.play()` MUST 作为 fresh play 读取 `api.set` 后的最新 native transform
- **AND** config 未声明的字段 MUST 使用该最新 transform 作为本轮 baseline
- **AND** 由于起始边界是必填项，不存在“未声明起始帧”的合法 config；缺少起始边界的 config 在归一化阶段已被拒绝

#### Scenario: 终态填充不 snap 回退
- **WHEN** 动画到达 terminal 状态
- **THEN** SDK MUST 填充到终态 transform 并回写到 `entityProps`
- **AND** SDK MUST NOT 把 Entity snap 回动画前的值

### Requirement: 播放错误可分类

SDK MUST 为 Entity motion 失败暴露一个封闭的 `SpatializedPlaybackError.code` 分类,至少覆盖 `TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET`、`TARGET_DESTROYED`。所有已分类失败 MUST 通过 `onError` 抵达用户。被拒绝的 `api.set` 写入——发生在活跃动画期间,或在绑定 / native object 创建之前——MUST NOT 通过 `onError` 抵达用户;它们 MUST 是 no-op,并输出一条 console warning。

#### Scenario: 错误码可区分
- **WHEN** 某个 Entity motion 操作失败
- **THEN** `onError` MUST 收到一个 `SpatializedPlaybackError`,其 `code` 标识失败类型
- **AND** 应用代码 MUST 能够按 `code` 分支,而无需解析 `message`
