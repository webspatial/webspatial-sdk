## 新增需求

### Requirement: `useEntityAnimation` 暴露新的 Entity motion 三元组

SDK MUST 提供 `useEntityAnimation(config)` 作为公共 Entity motion hook。该 hook MUST 返回三元组 `[animation, api, entityProps]`。

返回的 `animation` 对象 MUST 能通过物体组件上的 `animation` 属性进行绑定。首个原生已确认状态产生前,SDK MUST 接受空的 `entityProps` 对象。首个原生已确认状态产生后,`entityProps` MUST 表示完整的已提交变换,字段固定为完整的 `position`、`rotation`、`scale`。绑定存续期间,播放空闲状态下的变换 MUST 由这份完整镜像控制;解绑后 React 属性 MUST 恢复控制。

#### Scenario: Hook 返回结构
- **WHEN** 应用代码调用 `useEntityAnimation(config)`
- **THEN** hook MUST 返回 `[animation, api, entityProps]`
- **AND** `api` MUST 暴露 `play`、`pause`、`stop`、`reset`、`finish` 和 `set`
- **AND** `set` MUST 被记录为已提交 transform 值的状态 setter，而不是 playback 命令
- **AND** 首个原生已确认状态之后,`entityProps` MUST 包含完整的 `position`、`rotation` 和 `scale` 值

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

公开的 v1 配置语法 MUST 支持三种形态：顶层 `from` / `to`、分段形式的 `timeline.from` / `timeline.to`，以及百分比关键帧。顶层 `from` / `to` MUST 是 `timeline.from` / `timeline.to` 的等价配置语法糖：Core MUST 把两者归一化为同一份内部轨道。`tracks` MUST 保持为内部、非公开的执行形态，MUST NOT 作为公开配置语法写入文档。对不支持的目标必须显式失败。

每个动画 MUST 同时具备起始边界与结束边界：起点是顶层 `from`、`timeline.from` 或 `0%` 帧之一，终点是顶层 `to`、`timeline.to` 或 `100%` 帧之一。缺少任一端时，Core MUST 同步抛出 config 错误。此约束作用于全部三种 authoring 形态（顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧）。边界帧内部的**字段**仍可稀疏：某个边界帧未写的标量（如只写 `position` 不写 `rotation`）仍按逐通道缺帧规则回落到 native baseline。

在 `timeline` 内部，`from` MUST 等价于 `0%` 帧、`to` MUST 等价于 `100%` 帧；因此 `timeline.from` / `timeline.to` MAY 与百分比 key 混合出现在同一个 `timeline` 中。同一个 `timeline` 内 `from` 与 `0%`(或 `to` 与 `100%`)MUST NOT 同时出现，重复定义同一帧 MUST 被显式拒绝。

默认值 MUST 为 `autoStart: true`、`timingFunction: 'easeInOut'`、`delay: 0`、`playbackRate: 1` 和 `loop: false`。包含 `timeline` 的 config MUST 提供 `duration`;纯顶层 `from` / `to` 的 `duration` MUST 默认为 0.3 秒。每个 transform 标量和百分比 MUST 是有限数值，`duration` MUST 是正有限数值，`delay` MUST 是非负有限数值，`playbackRate` MUST 是正有限数值，`scale` MUST 非负，百分比 MUST 位于 `[0%, 100%]`。每个 timeline frame MUST 至少包含一个 transform 标量。空 timeline、空 frame，以及 `50%` 与 `50.0%` 这类归一化到同一帧的百分比 key MUST 由 Core 同步抛错。

#### Scenario: Segment config 使用 Entity props 字段
- **WHEN** 应用在 Entity motion 中定义 `timeline.from` 或 `timeline.to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** `transform.translate`、`transform.rotate`、`transform.scale` MUST NOT 作为 Entity 的公开目标态 config 契约

#### Scenario: 顶层 from/to 书写一个时间段
- **WHEN** 应用在 Entity motion config 中定义顶层 `from` 和 `to`
- **THEN** Entity transform 值 MUST 通过 `position`、`rotation` 和 `scale` 进行 authoring
- **AND** Core MUST 把顶层 `from` / `to` 归一化为与 `timeline.from` / `timeline.to` 相同的内部轨道
- **AND** 当顶层 `from` / `to` 是唯一的 authoring 形态且未使用任何百分比 key 时，`duration` MUST 默认为 0.3 秒

#### Scenario: 顶层 from/to 要求两端都提供
- **WHEN** 应用只提供了顶层 `from` 或只提供了顶层 `to`
- **THEN** Core MUST 同步抛出 config 错误
- **AND** 缺失的边界 MUST NOT 用 native baseline 或物体当前姿态兜底

#### Scenario: timeline 要求起止边界都存在
- **WHEN** 应用定义的 `timeline` 缺少起始边界（既无 `timeline.from` 也无 `0%` 帧）或缺少结束边界（既无 `timeline.to` 也无 `100%` 帧）
- **THEN** Core MUST 同步抛出 config 错误
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
- **AND** 若同一个 `timeline` 内 `from` 与 `0%`(或 `to` 与 `100%`)同时出现，Core MUST 同步抛出 config 错误

#### Scenario: Tracks property 使用 Entity 风格路径
- **WHEN** SDK 内部处理 Entity motion `tracks`
- **THEN** property 路径 MUST 使用 `position.*`、`rotation.*`、`scale.*`
- **AND** `transform.translate.*`、`transform.rotate.*`、`transform.scale.*` MUST NOT 作为 Entity target 的 property 路径契约

#### Scenario: 不支持的目标必须显式失败
- **WHEN** Entity motion config 包含 `opacity` 这类不支持的目标
- **THEN** Core MUST 同步抛出 config 错误
- **AND** 不支持的目标 MUST NOT 被静默忽略

### Requirement: Entity rotation 具有确定的跨端欧拉角语义

Entity motion MUST 使用 Entity 相对父节点的局部右手坐标系和角度制欧拉角。旋转组合 MUST 使用 ZYX intrinsic 顺序，等价于 XYZ extrinsic，矩阵顺序为 `Rz × Ry × Rx`。旋转拆解 MUST 使用旋转矩阵，并返回位于 `[-90°, 90°]` 的 `y` 和位于 `(-180°, 180°]` 的 `x`、`z`；gimbal lock 时 MUST 返回 `z = 0°`，并从矩阵计算 `x`。稀疏 rotation patch MUST 先合并到这份规范化完整欧拉角，再重新组合姿态。

#### Scenario: 等价旋转和稀疏 patch 产生规范化欧拉角
- **WHEN** visionOS 或 picoOS 确认 Entity rotation，或应用稀疏 `api.set` rotation patch
- **THEN** 等价 quaternion 表示 MUST 产生相同的规范化欧拉角
- **AND** 未传入的 rotation 轴 MUST 沿用规范化完整欧拉角基准中的值

### Requirement: `entityProps` 持久化已提交的 transform 状态

SDK MUST 使用 `entityProps` 作为动画系统持有的物体完整已提交变换在 React 侧的持久化出口。

`entityProps` MUST 只在动画系统提交生命周期值时更新,包括 `start`、`complete`、`stop`、`reset`、`finish` 以及原生层接受的 `api.set(values)` 写入。首个已确认状态产生前,SDK MUST 接受空的 `entityProps` 对象。首个已确认状态产生后,它 MUST 以完整的 `position`、`rotation`、`scale` 值镜像完整的已提交变换。每次确认后的字段集合 MUST 固定为完整的 `position`、`rotation`、`scale`。动画绑定存续期间,把 `entityProps` 展开在基础属性之后 MUST 使完整的已提交变换保持控制权。

#### Scenario: complete 把终态写入 `entityProps`
- **WHEN** 一个非循环 Entity 动画自然完成
- **THEN** `entityProps` MUST 反映完成后的完整变换终态,包括 `position`、`rotation` 和 `scale`
- **AND** 后续 React render 可以通过把 `entityProps` spread 到 Entity 组件上来保留该终态

#### Scenario: 解绑后 React 属性恢复控制
- **GIVEN** `entityProps` 已包含原生层确认的变换
- **WHEN** 物体动画解除绑定
- **THEN** SDK MUST 把返回的 `entityProps` 重置为 `{}` 并触发 React 渲染
- **AND** 该空对象展开在普通 React 变换属性之后时 MUST 保持这些属性的控制权

#### Scenario: 不做逐帧 React outlet 更新
- **WHEN** native 播放正在关键帧之间插值
- **THEN** SDK MUST NOT 在每一帧都更新 `entityProps`

#### Scenario: 循环动画不在 loop 边界提交 `entityProps`
- **GIVEN** 一个 `loop: true` 的 Entity 动画
- **WHEN** 动画越过一个 loop 边界
- **THEN** SDK MUST NOT 在该边界更新 `entityProps`
- **AND** `entityProps` MUST 只在 `stop`、`reset`、`finish` 或 native 接受的 `api.set(values)` 时提交

### Requirement: Playback 与 callback 语义对齐新的 motion 模型

Entity motion MUST 在保持 transform-only 约束的前提下，对齐新的 motion 家族 playback surface 与生命周期语义。

目标 callback 签名 MUST 为 `onStart(values: EntityMotionProps)`、`onComplete(values: EntityMotionProps)`、`onStop(values: EntityMotionProps)`、`onReset(values: EntityMotionProps)` 和 `onError(error: SpatializedPlaybackError)`。每个生命周期 `values` 参数 MUST 包含完整的已确认 `position`、`rotation` 和 `scale`。callback 返回值 MUST 被忽略。

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

### Requirement: Entity motion 具有确定的状态与生命周期转换

公开 Entity motion 状态 MUST 使用 `queued`、`idle`、`running`、`paused` 和 `finished`。`queued` MUST 表示原生动画对象创建前的 React 绑定阶段。原生层状态事件 MUST 使用 `idle`、`running`、`paused` 和 `finished`。公开 `finished` 标记 MUST 等于 `playState === 'finished'` 的结果。

每次 fresh play MUST 保存当前原生层业务控制器身份。原生层 MUST 串行处理控制命令与控制器完成回调。控制器身份匹配当前业务控制器的完成事件 MUST 具备完成该次运行的资格。

#### Scenario: 命令以确定方式保持 idle 和 finished 状态
- **GIVEN** 原生层动画状态是 `idle` 或 `finished`
- **WHEN** 应用调用 `pause` 或 `stop`
- **THEN** 当前状态和回调次数 MUST 保持稳定
- **AND** `play` MUST 启动全新运行
- **AND** `reset` MUST 提交配置声明的起始姿态并进入 `idle`
- **AND** `idle` 状态下的 `finish` MUST 提交配置声明的终点姿态并进入 `finished`
- **AND** `finished` 状态下的 `finish` MUST 保持 finished 状态和回调次数

#### Scenario: 活跃命令遵循同一份转换表
- **GIVEN** 原生层动画状态是 `running` 或 `paused`
- **WHEN** 应用调用 playback 命令
- **THEN** `play` MUST 保持 `running`,或把 `paused` 恢复为 `running`
- **AND** `pause` MUST 把 `running` 转为 `paused`,并保持 `paused`
- **AND** `stop` MUST 提交当前姿态并进入 `idle`
- **AND** `reset` MUST 提交本轮起始姿态并进入 `idle`
- **AND** `finish` MUST 提交配置声明的终点姿态并进入 `finished`

#### Scenario: 首次 play 前的 reset 和 finish 按需解析姿态
- **GIVEN** 原生层动画对象处于首次运行之前
- **WHEN** 应用调用 `reset` 或 `finish`
- **THEN** 原生层 MUST 读取当前 transform 作为基准姿态
- **AND** 原生层 MUST 为 `reset` 计算并提交配置声明的起始姿态,或为 `finish` 计算并提交配置声明的终点姿态

#### Scenario: 所有 loop 模式的 finish 使用配置终点
- **GIVEN** 普通、reset loop 或 reverse loop Entity 动画
- **WHEN** 应用调用 `finish`
- **THEN** 原生层 MUST 提交配置声明的 `to` / `100%` 姿态
- **AND** 动画 MUST 进入 `finished`

#### Scenario: 控制器完成与控制命令串行处理
- **GIVEN** 控制器完成回调与 `stop`、`reset` 或 `finish` 同时就绪
- **WHEN** 原生层处理这些动作
- **THEN** 最先处理的动作 MUST 提交其状态转换
- **AND** 每个后续动作 MUST 根据转换后的状态查询同一份转换表
- **AND** 来自当前业务控制器之外的完成事件 MUST 保持当前状态和回调次数

#### Scenario: 生命周期回调具有一次性触发次数
- **WHEN** 一次全新运行及其控制命令被处理
- **THEN** 已接受的 fresh play MUST 恰好触发一次 `onStart`
- **AND** 自然完成或 `finish` MUST 为该次运行恰好触发一次 `onComplete`
- **AND** 每个已接受的 `stop` 转换 MUST 恰好触发一次 `onStop`
- **AND** 每个已接受的 `reset` MUST 恰好触发一次 `onReset`

### Requirement: Entity motion 清理限定控制器范围并隔离内部提交

每个 `EntityMotionAnimationObject` MUST 把清理范围限定为自身持有的动画控制器。同一 Entity 及其子节点上的其它动画控制器 MUST 保持原有播放状态。零时长姿态提交 MUST 产生请求的命令动作,自然 `complete` MUST 由当前业务播放控制器唯一产生。

#### Scenario: 播放控制保持其它动画运行
- **GIVEN** Entity motion 运行和其它 Entity 或子节点动画处于活跃状态
- **WHEN** Entity motion 处理 `stop`、`reset`、`finish`、替换或销毁
- **THEN** 原生层 MUST 停止并释放该 Entity motion 对象持有的控制器
- **AND** 其它 Entity 和子节点动画控制器 MUST 保持原有播放状态

#### Scenario: 零时长姿态提交产生命令动作
- **GIVEN** 已接受的 `stop`、`reset`、`finish` 或 `set` 需要零时长姿态提交
- **WHEN** 原生层确认该姿态
- **THEN** 原生层 MUST 发出携带确认姿态的请求命令动作
- **AND** 自然 `complete` MUST 由当前业务播放控制器唯一产生

### Requirement: Entity motion 命令保持 binding 级 FIFO 顺序

公开 Entity playback 方法 MAY 返回 `void`,但 SDK MUST 通过每个 Entity motion binding 独立的一条 FIFO 命令链保持调用顺序。Native animation object 创建后,binding MUST 等待前一条命令的内部 JSB reply settled,再发送下一条 playback 或 `set` 命令。失败命令或映射为 warning + no-op 的 `set` MUST 结束当前队列项,且 MUST NOT 阻塞或改变后续命令顺序。

JSB 成功回执 MUST 表示 Native 已完成命令的同步状态转换和所需姿态提交。命令产生状态事件时,Native MUST 先发出事件,再返回成功回执。自然完成产生的异步 `complete` 事件不属于此前的 `play` 回执。

#### Scenario: Native object 创建前的 playback 命令按顺序 flush
- **GIVEN** Entity motion binding 的 Native animation object 尚未创建
- **WHEN** 应用调用 `play`、`pause`、`stop`、`reset` 或 `finish`
- **THEN** binding MUST 按调用顺序把这些 playback 命令追加到 pending 队列
- **AND** 创建成功后 MUST 按 FIFO 每次只发送一条命令
- **AND** `autoStart` 开启时,其生成的 `play` MUST 排在创建完成时已有的 pending playback 命令之前

#### Scenario: Native object 创建后的命令串行执行
- **GIVEN** Native animation object 已创建
- **WHEN** 应用不等待地连续调用多个 playback 或 `set` 命令
- **THEN** binding MUST 把这些命令追加到同一条 FIFO 命令链
- **AND** MUST 等待每条命令的内部 JSB reply settled 后再发送下一条命令

#### Scenario: 连续 set 后 play 使用已提交的 set 结果
- **GIVEN** Native animation object 已创建且播放处于非活跃状态
- **WHEN** 应用调用 `api.set(values)` 后立即调用 `api.play()`
- **THEN** binding MUST 等待 `set` 回执后再发送 `play`
- **AND** fresh play MUST 把该 `set` 已提交的 Native transform 作为最新 baseline

#### Scenario: 解绑或销毁使 pending 命令失效
- **GIVEN** binding 存在 in-flight 命令或尚未发送的命令
- **WHEN** binding 被移除、target 或 animation object 被替换,或 binding 被销毁
- **THEN** SDK MUST 丢弃该队列 generation 中所有尚未发送的命令
- **AND** in-flight 命令 settled 后 MUST NOT 派发失效 generation 中的下一条命令

### Requirement: 绑定替换与配置更新具有确定的生命周期

Entity motion 绑定 MUST 根据生效的时间轴、时长、缓动、延迟、播放速率、循环和 `autoStart` 计算归一化执行签名。等价的公开配置写法 MUST 生成同一个签名。生命周期回调引用 MUST 独立于执行签名处理。

解绑和目标替换 MUST 推进绑定代次、注销当前动画对象、销毁对应原生对象,并把 `entityProps` 重置为 `{}`。同一目标的归一化执行签名变化 MUST 推进绑定代次并替换动画对象,同时保持当前 `entityProps` 镜像。命令、回执和事件 MUST 关联唯一的绑定代次与动画对象身份。

#### Scenario: 重新绑定时新目标从空镜像开始
- **GIVEN** 当前目标已经生成确认后的 `entityProps`
- **WHEN** 绑定转移到另一个目标
- **THEN** SDK MUST 注销并销毁旧目标的动画对象
- **AND** SDK MUST 在为新目标建立确认值之前把 `entityProps` 重置为 `{}`

#### Scenario: 同一目标的执行配置变化会替换对象
- **GIVEN** Entity motion 绑定继续连接同一个目标
- **WHEN** 归一化执行签名发生变化
- **THEN** SDK MUST 注销并销毁当前动画对象,再使用最新配置创建新对象
- **AND** 旧对象的销毁生命周期 MUST 在新对象成为当前对象前停止并释放其控制器
- **AND** 替换期间当前 `entityProps` MUST 保持为该目标最近一次确认的已提交姿态
- **AND** 替换对象的首次 fresh play MUST 读取当前原生姿态作为基准姿态

#### Scenario: 仅更新回调时保持当前播放对象
- **GIVEN** 归一化执行签名保持相同
- **WHEN** 一个或多个生命周期回调引用发生变化
- **THEN** 绑定 MUST 保持当前动画对象、控制器、命令队列、播放状态和 `entityProps`
- **AND** 后续已接受事件 MUST 使用最新回调引用

#### Scenario: 命令与 autoStart 使用替换后的代次
- **GIVEN** 执行配置变化已经启动动画对象替换
- **WHEN** 应用在替换对象就绪前发出命令
- **THEN** 这些命令 MUST 进入替换代次的待执行队列
- **AND** 创建完成后,`autoStart: true` MUST 在这些命令之前加入一次隐式 `play`
- **AND** `autoStart: false` MUST 从显式待执行命令开始

#### Scenario: 替换过程只接受当前代次结果
- **GIVEN** 上一个动画对象已经注销
- **WHEN** 命令回执或状态事件到达
- **THEN** 绑定代次和动画对象身份均匹配当前对象的结果 MUST 成为状态、`entityProps` 和回调更新的唯一来源

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

动画处于活跃播放状态时,动画系统 MUST 持有完整的物体变换控制权。底层平台(visionOS / picoOS)绑定整个 `.transform`;配置字段执行动画,其余字段 MUST 保持基准姿态。此期间活动动画 MUST 保持控制权,最新的 `entityProps` 已确认值 MUST 保持稳定,SDK MUST 立即丢弃 React 属性写入和 `api.set` 写入。首个已确认状态产生后,播放空闲时的动态写入 MUST 使用 `api.set`;普通 React 变换属性在解绑前保持为基础输入。

#### Scenario: React props 不覆盖活动动画
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用在动画活跃期间更新任一 transform 分量
- **THEN** 这些 props 写入 MUST NOT 覆盖活动动画

#### Scenario: config 未写的分量在动画期间冻结在基准值
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`,且 config 未动画某个分量(例如只动画 `position`)
- **WHEN** 应用在动画活跃期间更新该**未写入 config 的分量**(例如 `rotation`)
- **THEN** 该分量 MUST 保持基准姿态,SDK MUST 立即丢弃该属性写入
- **AND** 动画进入播放空闲状态后,动态变换修改 MUST 通过 `api.set` 表达

#### Scenario: terminal 状态优先于陈旧 base props
- **GIVEN** 一个 Entity 组件同时组合了静态 props 与 spread 的 `entityProps`
- **WHEN** 动画进入 terminal 状态
- **THEN** `entityProps` 中完整的已提交 `position`、`rotation`、`scale` 值 MUST 代表权威终态变换
- **AND** 推荐的组合顺序是让 `entityProps` 放在陈旧 base props 之后应用


### Requirement: 动态接管使用 `api.set`

首个已确认状态产生前,普通物体变换属性控制完整变换。已确认状态产生后且动画绑定存续期间,播放空闲状态下的完整变换由 `entityProps` 控制。`api.set` MUST 是该已提交变换的唯一动态写入通道。

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

SDK MUST 提供 `api.set` 作为 `entityProps` 所镜像的已提交 Entity transform 状态的命令式写入入口。`api.set` MUST 只接受一个稀疏的 `EntityMotionPatch` object(写入侧 patch 类型；与读取侧 `EntityMotionProps` 同为 `{ position?, rotation?, scale? }` 形态，但命名区分)，MUST NOT 支持 updater 函数 `(prev) => next`。合法 patch MUST 至少包含一个 transform 标量;`api.set({})` 和只包含空嵌套对象的 patch MUST 同步抛错。`api.set` MUST NOT 是 playback 命令，MUST NOT seek、start 或改变播放进度。

物体变换控制权 MUST 按完整变换统一仲裁。首个已确认状态产生前,完整变换由基础 React 属性控制。动画处于活跃状态(`delay`、`running`、`paused`)时,完整变换由 `animation` 绑定控制;配置字段执行动画,其余字段保持基准姿态。原生层产生已确认状态后且绑定存续期间,播放空闲状态下的完整变换由 `entityProps` 控制。播放空闲状态下,`api.set` 更新原生层的已提交变换。解绑后 React 属性恢复控制。

SDK MUST NOT 提供裸 `api.get`。需要读取当前已提交值的应用代码 MUST 读取声明式的 `entityProps`，并在需要写入时自行计算 patch 后调用 `api.set(values)`。首个 native confirmed state 之前 `entityProps` MAY 为空，且 MUST NOT 承诺在 mount 时可读：创建或绑定动画 MUST NOT 额外 emit 一个初始 confirmed value。要读取有意义的 native 姿态，应用代码 MUST 先触发一次提交 confirmed value 的 lifecycle（一次到达终态 / lifecycle 节点的 `play`，或一次被接受的 `api.set`）。

#### Scenario: set 更新已提交状态与 entityProps
- **WHEN** 应用调用 `api.set(values)` 并传入 Entity transform 值
- **THEN** SDK MUST 把该写入下发 native,由 native 决定是否接受
- **AND** 原生层接受后 `entityProps` MUST 更新为原生层回传的完整已确认 `position`、`rotation`、`scale` 值
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
- **GIVEN** Native animation object 已创建且播放处于非活跃状态
- **WHEN** 应用先调用 `api.set` 再调用 `api.play()`
- **THEN** 播放 MUST 从 config 声明的起始边界（顶层 `from`、`timeline.from` 或 `0%` 帧）开始
- **AND** binding MUST 等待 `api.set` 的 JSB reply 后再发送 `api.play()`
- **AND** 本次 `api.play()` MUST 作为 fresh play 读取 `api.set` 后的最新 native transform
- **AND** config 未声明的字段 MUST 使用该最新 transform 作为本轮 baseline
- **AND** 由于起始边界是必填项，不存在“未声明起始帧”的合法 config；缺少起始边界的 config 在归一化阶段已被拒绝

#### Scenario: 终态填充不 snap 回退
- **WHEN** 动画到达 terminal 状态
- **THEN** SDK MUST 填充到终态 transform 并回写到 `entityProps`
- **AND** SDK MUST NOT 把 Entity snap 回动画前的值

### Requirement: 播放错误可分类

SDK MUST 对公开 config 或方法参数中可直接检测的 programmer error 同步抛错。Bridge 或 Native 操作开始后发现的失败 MUST 通过 `onError` 以分类后的 `SpatializedPlaybackError` 抵达用户，错误码至少覆盖 `TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET` 和 `ANIMATION_NOT_FOUND`。动画活跃期间或 binding / native object 创建前被拒绝的 `api.set` MUST 保持为 no-op，并输出一条 console warning。

#### Scenario: 错误码可区分
- **WHEN** 某个 Entity motion 操作失败
- **THEN** `onError` MUST 收到一个 `SpatializedPlaybackError`,其 `code` 标识失败类型
- **AND** 应用代码 MUST 能够按 `code` 分支,而无需解析 `message`

### Requirement: Entity target 销毁会使关联动画失效

若 Entity target 先销毁,SDK MUST 销毁其关联 animation objects。销毁同步到 Core 后,playback 命令 MUST 是 no-op,`api.set` MUST 是 warning + no-op 且不触发 `onError`;与销毁竞态的命令 MAY 以 `ANIMATION_NOT_FOUND` 失败。

#### Scenario: target 先销毁时级联清理动画
- **WHEN** Entity target 在关联 native animation object 之前销毁
- **THEN** Native MUST 销毁该 target 的所有关联 Entity animation objects
- **AND** 销毁同步到 Core 后,playback MUST 是 no-op,`api.set` MUST 是 warning + no-op 且不触发 `onError`

#### Scenario: 控制命令与销毁竞态
- **WHEN** 控制命令与 animation object 销毁发生竞态
- **THEN** 它 MAY 以 `ANIMATION_NOT_FOUND` 失败
