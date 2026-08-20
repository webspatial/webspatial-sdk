## 新增需求

### Requirement: `useEntityAnimation` 暴露新的 Entity motion 三元组

SDK MUST 提供 `useEntityAnimation(config)` 作为公共 Entity motion hook。该 hook MUST 返回三元组 `[animation, api, entityProps]`。

返回的 `animation` 对象 MUST 能通过物体组件上的 `animation` 属性进行绑定。首个原生已确认状态产生前,SDK MUST 接受空的 `entityProps` 对象。首个原生已确认状态产生后,`entityProps` MUST 表示完整的已提交变换,字段固定为完整的 `position`、`rotation`、`scale`。播放空闲期间,Entity MUST 接受组件组合后的 React 属性所产生的 transform。动画对象初次创建失败 MUST 清空镜像并终止当前绑定生命周期;同一目标配置 update 失败 MUST 保留镜像和绑定生命周期。解绑 MUST 清空镜像,其余 React 属性继续控制。

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

每次全新执行 MUST 由一次全局初始延迟和随后的运动序列组成。`playbackRate` MUST 仅缩放运动序列,`loop` MUST 仅重复运动序列。全局延迟 MUST NOT 随 `playbackRate` 缩放,也 MUST NOT 在循环边界重复。

#### Scenario: 全局延迟先于变速循环运动
- **GIVEN** Entity motion config 配置了非零 `delay`、非默认 `playbackRate` 并启用循环
- **WHEN** 一次全新执行开始并跨越一个或多个循环边界
- **THEN** 全局延迟 MUST 在首次运动前执行一次
- **AND** `playbackRate` MUST 仅缩放运动序列
- **AND** 每次循环 MUST 仅重复运动序列,不重复延迟

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

SDK MUST 使用 `entityProps` 作为 Native 返回的物体完整已提交变换在 React 侧的持久化出口。

`start`、`stop`、`reset`、`finish`、自然完成和原生层接受的 `api.set` MUST 先提交姿态,再重新读取 Entity 当前的完整 transform;状态消息 `values`、callback values 和 `SetEntityAnimationResult.values` MUST 统一使用该回读结果,并包含完整的 `position`、`rotation`、`scale` 与规范化 ZYX 欧拉角。

`entityProps` MUST 在动画系统提交生命周期值时更新,包括 `start`、`complete`、`stop`、`reset`、`finish`、成功配置 update 以及原生层接受的 `api.set(update)` 写入。初次创建失败 MUST 把它清空为 `{}`;配置 update 失败 MUST 保持现有值。首个已确认状态产生前,SDK MUST 接受空的 `entityProps` 对象。首个已确认状态产生后,它 MUST 以完整的 `position`、`rotation`、`scale` 值镜像完整的已提交变换。每次确认后的字段集合 MUST 固定为完整的 `position`、`rotation`、`scale`。播放空闲期间,把 `entityProps` 展开在基础属性之后 MUST 使完整的已提交变换成为 React 最终传入的 transform。

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
- **AND** `entityProps` MUST 只在 `stop`、`reset`、`finish` 或 native 接受的 `api.set(update)` 时提交

### Requirement: Playback 与 callback 语义对齐新的 motion 模型

Entity motion MUST 在保持 transform-only 约束的前提下，对齐新的 motion 家族 playback surface 与生命周期语义。

目标 callback 签名 MUST 为 `onStart(values: EntityMotionProps)`、`onComplete(values: EntityMotionProps)`、`onStop(values: EntityMotionProps)`、`onReset(values: EntityMotionProps)` 和 `onError(error: EntityPlaybackError)`。每个生命周期 `values` 参数 MUST 包含完整的已确认 `position`、`rotation` 和 `scale`。callback 返回值 MUST 被忽略。

公开配置中存在的每个 callback 字段 MUST 为函数。Core MUST 在归一化阶段同步拒绝非函数的 `onStart`、`onComplete`、`onStop`、`onReset` 或 `onError` 值。

Core `EntityAnimationObject` MUST 提供与上述 callback 对齐的 `onStart`、`onComplete`、`onStop`、`onReset` 和 `onError` 调试监听方法。这些方法 MUST 只注册观察回调,MUST NOT 发送播放控制或配置 update 命令。`pause` MUST NOT 增加 `onPause`。

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
- **WHEN** Entity motion 在 Bridge 或 Native 阶段发生异步播放失败或兜底校验失败
- **THEN** `onError` MUST 接收到失败信息
- **AND** Entity motion API 的任何 callback value payload 都 MUST NOT 包含 `opacity` 这类不支持字段

#### Scenario: 非函数 callback 同步失败
- **WHEN** 公开 Entity motion 配置提供非函数的生命周期 callback 或错误 callback
- **THEN** 归一化 MUST 同步抛出内置 `Error`
- **AND** SDK MUST NOT 创建 Native animation object

### Requirement: Entity motion 具有确定的状态与生命周期转换

公开 Entity motion 状态 MUST 使用 `queued`、`idle`、`running`、`paused` 和 `finished`。`queued` MUST 表示至少一条播放命令正在等待原生动画对象创建。原生动画对象创建期间没有待执行播放命令时,公开状态 MUST 保持 `idle`。`autoStart` 生成的隐式 `play` MUST 视为待执行播放命令。`queued` 期间 `isAnimating`、`isPaused` 和 `finished` MUST 保持 `false`,排队命令 MUST 保持这些布尔值。当前绑定生命周期正常存续期间,原生层创建回执 MUST 建立初始公开 `idle` 状态。动画对象创建完成后,每次播放状态变化时,原生层 MUST 发送携带最新 `playState` 的状态消息,Core MUST 根据该消息更新公开状态。原生层状态 MUST 使用 `idle`、`running`、`paused` 和 `finished`。原生层创建成功回执 MUST 在执行待处理命令前确认初始 `idle` 状态。原生层创建失败回执 MUST 执行终止当前绑定生命周期的错误流程。公开 `finished` 标记 MUST 等于 `playState === 'finished'` 的结果。

每次 fresh play MUST 保存当前原生层业务控制器身份。原生层 MUST 串行处理控制命令与控制器完成回调。控制器身份匹配当前业务控制器的完成事件 MUST 具备完成该次运行的资格。

#### Scenario: 原生层创建回执结束 queued
- **GIVEN** 至少一条播放命令正在等待原生动画对象创建
- **WHEN** 原生层创建回执到达
- **THEN** 成功回执 MUST 在绑定对象执行待处理命令前确认公开 `idle`
- **AND** 待处理的 `pause` 或 `stop` 在原生层 `idle` 执行后 MUST 保持公开 `idle`
- **AND** 失败回执 MUST 执行创建失败的终止流程

#### Scenario: 初次创建失败终止当前绑定生命周期
- **GIVEN** 初次动画对象创建失败
- **WHEN** 对应异步失败回执到达
- **THEN** SDK MUST 使公开播放状态收敛为 `idle`
- **AND** SDK MUST 使当前绑定代次失效,清空动画对象引用、控制器派生状态和全部待执行命令
- **AND** SDK MUST 把 `entityProps` 清空为 `{}` 并触发 React 渲染,使基础 React 属性恢复完整变换控制
- **AND** `onError` MUST 使用分类后的 `EntityPlaybackError` 触发一次
- **AND** 当前绑定生命周期 MUST 终止
- **AND** 该绑定后续的 `play`、`pause`、`stop`、`reset`、`finish` 和 `set` MUST 输出控制台警告并执行空操作
- **AND** 这些后续调用 MUST 保持现有 `onError` 次数
- **AND** 后续 config 和 callback 更新 MUST 只刷新绑定保存的最新值
- **AND** 显式解绑后重新绑定,或创建新的 binding, MUST 使用届时最新的 config 和 callback 开启新代次

#### Scenario: 命令以确定方式保持 idle 和 finished 状态
- **GIVEN** 原生层动画状态是 `idle` 或 `finished`
- **WHEN** 应用调用 `pause` 或 `stop`
- **THEN** 当前状态和回调次数 MUST 保持稳定
- **AND** `play` MUST 启动全新运行
- **AND** `reset` MUST 提交配置声明的起始姿态并进入 `idle`
- **AND** `idle` 状态下的 `finish` MUST 提交配置声明的终点姿态并进入 `finished`
- **AND** 该 `idle → finished` 转换 MUST 触发一次 `onComplete` 并保持现有 `onStart` 次数
- **AND** `finished` 状态下的 `finish` MUST 保持 finished 状态和回调次数

#### Scenario: 活跃命令遵循同一份转换表
- **GIVEN** 原生层动画状态是 `running` 或 `paused`
- **WHEN** 应用调用 playback 命令
- **THEN** `play` MUST 保持 `running`,或把 `paused` 恢复为 `running`
- **AND** `paused` 恢复为 `running` 时,Native MUST 发送只携带 animation `id`、execution revision 和 `playState: running` 的状态消息
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
- **AND** 动画自然进入 `finished`,或 `finish()` 使动画从 `idle`、`running`、`paused` 进入 `finished` 时 MUST 恰好触发一次 `onComplete`
- **AND** 每个已接受的 `stop` 转换 MUST 恰好触发一次 `onStop`
- **AND** 每个已接受的 `reset` MUST 恰好触发一次 `onReset`

### Requirement: Entity motion 清理限定控制器范围并隔离内部提交

每个 `EntityMotionAnimationObject` MUST 把清理范围限定为自身持有的动画控制器。同一 Entity 及其子节点上的其它动画控制器 MUST 保持原有播放状态。零时长姿态提交 MUST 产生对应的 `callbackAction`,自然完成 MUST 由当前业务播放控制器唯一产生。

#### Scenario: 播放控制保持其它动画运行
- **GIVEN** Entity motion 运行和其它 Entity 或子节点动画处于活跃状态
- **WHEN** Entity motion 处理 `stop`、`reset`、`finish`、原地 retarget 或销毁
- **THEN** 原生层 MUST 停止并释放该 Entity motion 对象持有的控制器
- **AND** 其它 Entity 和子节点动画控制器 MUST 保持原有播放状态

#### Scenario: 播放控制的零时长姿态提交产生 callbackAction
- **GIVEN** 已接受的 `stop`、`reset` 或 `finish` 需要零时长姿态提交
- **WHEN** 原生层确认该姿态
- **THEN** 原生层 MUST 分别使用 `stop`、`reset`、`complete` 作为 `callbackAction`,并携带确认姿态
- **AND** 自然 `complete` MUST 由当前业务播放控制器唯一产生

### Requirement: Entity motion 命令无需 Core 串行化

公开 `EntityPlaybackApi` 方法 MAY 返回 `void`。具体的 Core `EntityAnimationObject.set(update)` MUST 返回 `Promise<EntityMotionProps | void>`,供绑定消费 `SetEntityAnimation` 回执。该 Promise MUST NOT 通过公开 `EntityPlaybackApi.set(update)` 暴露。每个 Entity motion 绑定只在 Native 创建动画对象前保存 pending playback 队列。创建后,Core MUST 立即提交每条 `update`、播放和 `set` 命令。每条命令回执只结算自身 Promise,不得阻塞后续提交。

播放控制命令产生状态消息时,Native MUST 先提交消息,再返回成功回执。自然完成 MUST 产生独立的异步完成状态消息。

#### Scenario: Native object 创建前的 playback 命令按顺序 flush
- **GIVEN** Entity motion binding 的 Native animation object 尚未创建
- **WHEN** 应用调用 `play`、`pause`、`stop`、`reset` 或 `finish`
- **THEN** binding MUST 按调用顺序把这些 playback 命令追加到 pending 队列
- **AND** 创建成功后,原生层创建回执 MUST 首先确认公开 `idle`
- **AND** binding MUST 随后按调用顺序立即提交全部 pending playback 命令
- **AND** `autoStart` 开启时,其生成的 `play` MUST 排在创建完成时已有的 pending playback 命令之前

#### Scenario: 原生对象创建后的命令立即提交
- **GIVEN** 原生动画对象已创建
- **WHEN** 应用连续产生 `update`、播放或 `set` 命令
- **THEN** Core MUST 立即提交每条命令,无需等待此前命令的回执
- **AND** 每条命令回执只结算自身 Promise

#### Scenario: 解绑或销毁使 pending playback 命令失效
- **GIVEN** binding 存在等待 Native 创建动画对象的 playback 命令
- **WHEN** binding 被移除、target 被替换、animation object 被销毁,或 binding 被销毁
- **THEN** SDK MUST 丢弃这些 pending playback 命令
- **AND** 已提交给 JSB 的命令 MAY 继续处理

### Requirement: 同一目标的配置更新原地提交并具有确定的 retarget 语义

Entity motion 绑定 MUST 根据规范时间轴和播放参数比较执行定义。等价配置 MUST 视为同一执行定义。回调和 `autoStart` MUST 独立处理。`autoStart` MUST 只控制初次创建后的隐式 `play`。

`SpatialEntity.createAnimation(config)` 和 `EntityAnimationObject.update(config)` MUST 分别同步归一化并校验初始配置和更新配置。

解绑和目标替换 MUST 推进绑定代次、销毁当前对象,并清空 `entityProps`。同一目标的配置变化 MUST 通过当前 `EntityAnimationObject` 和 id 原地提交,并保持绑定代次和对象。成功更新 MUST 推进执行版本。命令、回执和事件 MUST 关联绑定代次、id 和执行版本。

#### Scenario: 重新绑定时新目标从空镜像开始
- **GIVEN** 当前目标已经生成确认后的 `entityProps`
- **WHEN** 绑定转移到另一个目标
- **THEN** SDK MUST 注销并销毁旧目标的动画对象
- **AND** SDK MUST 在为新目标建立确认值之前把 `entityProps` 重置为 `{}`

#### Scenario: 同一目标的执行配置变化原地更新对象
- **GIVEN** 当前绑定生命周期正常,且 Entity motion 绑定继续连接同一个目标
- **WHEN** 规范执行定义发生变化
- **THEN** SDK MUST 通过当前 Core object 提交原地更新
- **AND** Core 对象、原生对象、id 和绑定代次 MUST 保持不变
- **AND** 成功更新 MUST 保存新配置、规范时间轴和执行版本
- **AND** 成功回执 MUST 携带完整确认姿态并更新 `entityProps`

#### Scenario: 仅更新回调时保持当前播放对象
- **GIVEN** 当前绑定生命周期正常且规范执行定义保持相同
- **WHEN** 一个或多个生命周期回调引用发生变化
- **THEN** 绑定 MUST 保持当前对象、控制器、创建前播放队列、状态和 `entityProps`
- **AND** 后续已接受事件 MUST 使用最新回调引用
- **AND** SDK MUST 仅更新回调引用

#### Scenario: 等价执行配置不产生更新
- **GIVEN** 当前绑定生命周期正常
- **WHEN** 新配置与已提交执行定义等价
- **THEN** SDK MUST 保持当前对象、控制器、状态、执行版本和 `entityProps`

#### Scenario: 活跃配置变化立即重新定向
- **GIVEN** 原生动画处于 `delay` 或 `running`
- **WHEN** 配置更新成功
- **THEN** Native MUST 使用当前姿态作为本次执行的临时起点
- **AND** 当前姿态 MUST 覆盖受控轨道的 `0%` 值,并作为未受控分量的基准
- **AND** 第一段 MUST 使用新 `0%` 的缓动;较晚出现的首个关键帧 MUST 从当前值平滑插值
- **AND** 新延迟、完整时长和播放参数 MUST 从头生效
- **AND** 旧执行 MUST 保持 `onStop` 和 `onComplete` 次数
- **AND** 新执行 MUST 触发一次 `onStart`
- **AND** 终点等于当前姿态时,新时间轴仍 MUST 执行

#### Scenario: 临时起点保留配置边界
- **GIVEN** 活跃更新已使用当前姿态作为临时起点
- **WHEN** 后续调用 `reset`、`finish` 或重新播放
- **THEN** `reset` 和重新播放 MUST 使用新配置的 `0%`
- **AND** `finish` MUST 使用新配置的 `100%`

#### Scenario: 暂停时更新保持暂停
- **GIVEN** 原生动画处于 `paused`
- **WHEN** 配置更新成功
- **THEN** Native MUST 保存当前姿态和新定义并保持 `paused`
- **AND** 回调次数 MUST 保持不变
- **AND** 下次 `play` MUST 从保存姿态执行新时间轴并触发一次 `onStart`

#### Scenario: 非活跃配置变化只安装定义
- **GIVEN** 原生动画处于 `idle` 或 `finished`
- **WHEN** 配置更新成功
- **THEN** Native MUST 安装新定义并保持当前状态和回调次数
- **AND** 下次播放 MUST 使用新配置的起点

#### Scenario: 更新失败原子回滚
- **GIVEN** 当前动画对象存在并持有一个已提交执行定义
- **WHEN** Core 同步校验失败,或 Native 校验、准备或提交失败
- **THEN** Core 可检测的参数错误 MUST 在本地同步抛出,Bridge 命令数 MUST 保持不变
- **AND** Native 异步失败 MUST 保持旧配置、时间轴、执行版本、控制器、状态、姿态、写入保护和 `entityProps`
- **AND** Native 异步失败 MUST 通过最新 `onError` 触发一次
- **AND** 绑定和后续命令 MUST 继续

#### Scenario: 更新只接受当前执行结果
- **GIVEN** 成功更新已推进执行版本
- **WHEN** 旧控制器完成事件、命令回执或状态事件随后到达
- **THEN** 只有绑定代次、id 和执行版本均匹配的结果 MAY 更新状态、`entityProps` 或回调
- **AND** 其它结果 MUST 保持当前状态和回调次数

### Requirement: Entity motion 使用独立 JSB 协议和统一 id

Core 与 Native MUST 使用独立于 Spatialized Element 动画的 `CreateEntityAnimation`、`UpdateEntityAnimation`、`ControlEntityAnimation` 和 `SetEntityAnimation` 四条命令。创建请求的 `id` MUST 是目标 Entity 的 `SpatialObject.id`;创建成功回执的 `id` MUST 是新建 Entity 动画对象的 `SpatialObject.id`。后续更新、控制、设置、状态事件和错误事件 MUST 直接使用该动画对象的 `id`,MUST NOT 引入 `elementId` 或 `animationId` 别名。

每次播放状态确认或 lifecycle callback MUST 使用同一个 `EntityMotionStateChangedDetail`,并携带 animation `id`、execution revision 与最新 `playState`。触发生命周期 callback 的消息 MUST 同时携带 `callbackAction` 和完整 `values`;`callbackAction` 的完整集合 MUST 为 `start`、`complete`、`stop` 和 `reset`。显式 `finish()` 与自然完成 MUST 统一使用 `callbackAction: complete`。暂停和恢复消息 MUST 只携带 `id`、execution revision 与 `playState`。公开 `finished` MUST 从 `playState === 'finished'` 派生。异步错误 MUST 使用独立的 `entityanimationerror` 事件。`EntityPlaybackError` MUST 只公开稳定的 `code` 和可读的 `reason`。

Native MUST 由目标 `SpatialEntity.createAnimation(config)` 创建 `EntityMotionAnimationObject`,MUST NOT 引入 `EntityMotionManager`。Core `EntityAnimationObject` MUST 直接使用继承自 `SpatialObject` 的 `id`,并私有保存最近一次成功提交的公开 `config`、归一化 `timeline` 和 execution revision。Native `EntityMotionAnimationObject.emitStateChanged()` MUST 是私有方法。

#### Scenario: 创建过程直接使用目标与动画对象 id
- **GIVEN** Core 为目标 `SpatialEntity` 请求创建 Entity 动画
- **WHEN** Native 处理 `CreateEntityAnimation`
- **THEN** 请求中的 `id` MUST 通过目标的 `SpatialObject.id` 查找目标
- **AND** 目标 `SpatialEntity.createAnimation(config)` MUST 创建动画对象
- **AND** 创建成功回执中的 `id` MUST 是动画对象继承自 `SpatialObject` 的 `id`

#### Scenario: 更新、控制、设置、状态与错误使用独立通道
- **GIVEN** Entity 动画对象已经创建
- **WHEN** Core 更新配置、控制播放、设置变换或消费 Native 事件
- **THEN** 更新命令、控制命令、设置命令和两类事件 MUST 通过 `id` 指向动画对象
- **AND** 更新成功 MUST 通过 `UpdateEntityAnimationResult` 返回完整确认姿态和 execution revision
- **AND** 每次播放状态确认或 lifecycle callback MUST 使用 `EntityMotionStateChangedDetail`
- **AND** 设置成功 MUST 通过 `SetEntityAnimationResult` 返回确认值且不产生状态事件
- **AND** 异步错误 MUST 使用携带 `code` 和 `reason` 的 `entityanimationerror`

### Requirement: 每次 fresh play 使用最新 native baseline 编译

Native 创建动画时 MUST 兜底校验并保存规范时间轴、注册动画对象并返回其 `id`,MUST NOT 在创建阶段读取播放 baseline 或生成 RealityKit 播放资源。fresh play 定义为创建后的首次 `play` / `autoStart`,以及动画在 `complete`、`finish`、`stop` 或 `reset` 后重新开始的 `play`。每次 fresh play 被接受后、进入 `delay` / `running` 前,Native MUST 读取当前 `entity.transform` 作为本轮 baseline,并用规范时间轴与该 baseline 编译本轮 RealityKit 播放资源。config 明确声明的字段 MUST 使用 config 值,config 未声明的字段 MUST 使用本轮 baseline 补全。

若暂停期间没有成功配置 update,`pause` 后的 `play` MUST 恢复当前播放控制器和进度,MUST NOT 读取新 baseline 或重新编译。若暂停期间成功配置 update,后续 `play` MUST 按 paused retarget 规则从保存 pose 启动新执行。单次 fresh play 内的 loop MUST 复用本轮播放资源,MUST NOT 在每个 loop 边界重新读取 baseline 或编译。

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

#### Scenario: 未更新配置时 pause 后 play 恢复当前播放
- **GIVEN** 动画已暂停并持有当前播放控制器与资源,且暂停期间没有成功配置 update
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

### Requirement: 活跃动画保护整个 Entity transform

动画处于 `delay`、`running` 或 `paused` 时,动画系统 MUST 控制完整的 Entity transform。底层平台(visionOS / picoOS)绑定整个 `.transform`;配置字段执行动画,其余字段 MUST 保持基准姿态。每次 fresh play 时,Native MUST 启用完整 transform 写入保护,并在暂停期间保持该保护。保护生效期间,最新的 `entityProps` 已确认值 MUST 保持稳定,SDK MUST 立即丢弃 React 属性写入。原生对象创建后的 `api.set` MUST 抵达 Native,接收 `INVALID_CONTROL_STATE`,再由 SDK 映射为一次 warning 与空操作,且不触发 `onError`。Native `SpatialScene` MUST 在普通 Entity transform 更新入口通过 animating mask 仲裁,返回成功并保持当前原生 transform。

执行 `stop`、`reset`、`finish` 或自然完成时,Native MUST 提交对应姿态,取得 Entity 当前的完整 transform,解除完整 transform 写入保护,再发出携带该 transform 的状态事件。解绑、绑定终止和销毁动画对象 MUST 作为清理路径解除保护。播放空闲且保护未生效时,普通 Entity transform 更新 MUST 更新原生 transform。

#### Scenario: React props 不覆盖活动动画
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用在动画活跃期间更新任一 transform 分量
- **THEN** 这些 props 写入 MUST NOT 覆盖活动动画

#### Scenario: 暂停保持 transform 写入保护
- **GIVEN** Entity 动画正在运行
- **WHEN** 应用暂停动画
- **THEN** 普通 React transform 写入 MUST 继续被阻止
- **AND** 暂停动画 MUST 保持当前姿态

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

#### Scenario: 播放结束后恢复 React transform 写入
- **GIVEN** Entity 动画处于活跃状态
- **WHEN** 动画停止、重置、结束或自然完成
- **THEN** Native MUST 提交对应的完整姿态
- **AND** Native MUST 在返回 Entity 当前的完整 transform 前解除完整 transform 写入保护
- **AND** 后续普通 React transform 更新 MUST 更新原生 transform


### Requirement: 动态接管使用 `api.set`

播放空闲期间,组件组合后的 React 属性 MUST 控制完整 Entity transform。首个已确认状态产生前,`entityProps` MAY 为空,因此组合结果由基础属性决定。已确认状态产生后,把完整 `entityProps` 展开在基础属性之后 MUST 使它成为 React 最终传入的 transform。`api.set` MUST 更新 Native 已提交 transform,Core MUST 使用 Native 返回的完整 transform 更新 `entityProps`。

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

SDK MUST 提供 `api.set` 作为 `entityProps` 所镜像的已提交 Entity transform 状态的命令式写入入口。`api.set` 返回 `void`,并接受稀疏的 Entity transform patch,其中包含 `position`、`rotation`、`scale` 中的一个或多个字段;updater 函数属于 programmer error。绑定不可用、创建中、绑定已终止以及 Core object 销毁中和已销毁时,对应生命周期门各输出一次 warning,在本地完成 no-op,JSB 调用和 `onError` 计数保持为零。Core object 存活时同步校验参数;非法 update 抛出内置 `Error`,合法 update 立即提交给 Core。Core object 存活时,包含至少一个 transform 标量的 update 可以写入;空 update 或只包含空嵌套对象的 update 同步抛出内置 `Error`。`api.set` 是保持播放进度与 `playState` 的状态写入口。

物体变换写入 MUST 按完整 transform 统一仲裁。播放空闲期间,组件组合后的 React 属性控制 transform。动画处于活跃状态(`delay`、`running`、`paused`)时,Native animation 控制完整 transform 并阻止普通 React transform 写入;配置字段执行动画,其余字段保持基准姿态。`stop`、`reset`、`finish` 和自然完成 MUST 在提交对应姿态后解除保护。活跃 retarget MUST 保持完整 transform 写入保护连续生效。播放空闲状态下,`api.set` 更新 Native 已提交 transform,Core 使用 Native 返回的完整结果更新 `entityProps`。初次创建失败终止当前绑定生命周期并清空 `entityProps`;配置 update 失败保留现有保护与镜像。解绑也清空 `entityProps`。

SDK MUST NOT 提供裸 `api.get`。需要读取当前已提交值的应用代码 MUST 读取声明式的 `entityProps`,并在需要写入时自行计算 update 后调用 `api.set(update)`。首个 native confirmed state 之前 `entityProps` MAY 为空,且 MUST NOT 承诺在 mount 时可读:创建或绑定动画 MUST NOT 额外 emit 一个初始 confirmed value。要读取有意义的 native 姿态,应用代码 MUST 先触发一次提交 confirmed value 的 lifecycle(一次到达终态 / lifecycle 节点的 `play`,或一次被接受的 `api.set`)。

#### Scenario: set 更新已提交状态与 entityProps
- **GIVEN** 一个存活的 Core animation object
- **WHEN** 应用调用 `api.set(update)` 并传入 Entity transform 更新
- **THEN** SDK MUST 把该写入下发 native,由 native 决定是否接受
- **AND** 原生层接受后 MUST 更新 Entity,通过 `SetEntityAnimationResult.values` 返回 Entity 当前完整的 `position`、`rotation`、`scale`
- **AND** Core MUST 使用该成功回执更新 `entityProps`
- **AND** `set` MUST NOT 产生 `EntityMotionStateChangedMsg`
- **AND** native 拒绝时 `entityProps` MUST NOT 更新,且该拒绝 MUST 输出一条 console warning,而不是触发 `onError`
- **WHEN** 应用以空 update 或只包含空嵌套对象的 update 调用 `api.set`
- **THEN** 调用 MUST 同步抛出内置 `Error`
- **AND** warning、`onError` 和 JSB 调用计数 MUST 保持为零

#### Scenario: set 执行稀疏合并
- **WHEN** 应用调用 `api.set` 只传入部分 transform 字段，例如 `{ position: { y: 0.3 } }`
- **THEN** SDK MUST 将该 sparse update 下发 native,而不是在 JS/Core 侧以 `entityProps` 合并完整值
- **AND** native MUST 以当前 committed `entity.transform` 为基线,只覆盖 update 中提供的字段
- **AND** 未传入的字段如 `rotation`、`scale` MUST 沿用 native committed baseline 中之前的已提交值

#### Scenario: set 不支持 updater 形式
- **WHEN** 应用以 updater 函数形式调用 `api.set`
- **THEN** SDK MUST 显式拒绝该调用
- **AND** SDK MUST NOT 用空对象、默认值或 stale mirror 伪造 `prev`
- **AND** 读-改-写 MUST 通过读取 `entityProps` 后显式调用 `api.set(update)` 表达

#### Scenario: 活跃动画期间调用 set 不暂存
- **GIVEN** 一个 Entity 动画处于 `delay`、`running` 或 `paused`
- **WHEN** 应用调用 `api.set`
- **THEN** SDK MUST NOT 打断或覆盖活动动画
- **AND** native MUST NOT 暂存该写入，也 MUST NOT 在动画结束后 replay
- **AND** `entityProps` MUST NOT 因该写入更新
- **AND** 被拒绝的写入 MUST 是一次 no-op,并输出一条 console warning,MUST NOT 通过 `onError` 抵达用户

#### Scenario: 未绑定、创建中或终止后调用 set 执行本地 no-op
- **GIVEN** Entity motion binding 不可用、正在创建或当前绑定生命周期已经终止
- **WHEN** 应用以非法或合法稀疏 update 调用 `api.set`
- **THEN** 每次调用 MUST 返回 `void`、输出一次 warning 并在本地完成
- **AND** pending write 与 `onError` 计数 MUST 保持为零
- **AND** 后续绑定或 native object 创建 MUST 观察到这些 update 对应的 `object.set` 调用数为零

#### Scenario: set 之后 play 的起点
- **GIVEN** Native animation object 已创建且播放处于非活跃状态
- **WHEN** 应用先调用 `api.set` 再调用 `api.play()`
- **THEN** 播放 MUST 从 config 声明的起始边界（顶层 `from`、`timeline.from` 或 `0%` 帧）开始
- **AND** Core MUST 按调用顺序提交 `api.set()` 与 `api.play()`
- **AND** 本次 `api.play()` MUST 作为 fresh play 读取 `api.set` 后的最新 native transform
- **AND** config 未声明的字段 MUST 使用该最新 transform 作为本轮 baseline
- **AND** 由于起始边界是必填项，不存在“未声明起始帧”的合法 config；缺少起始边界的 config 在归一化阶段已被拒绝

#### Scenario: 终态填充不 snap 回退
- **WHEN** 动画到达 terminal 状态
- **THEN** SDK MUST 填充到终态 transform 并回写到 `entityProps`
- **AND** SDK MUST NOT 把 Entity snap 回动画前的值

### Requirement: 播放错误可分类

SDK MUST 对公开 config 或方法参数中可直接检测的 programmer error 同步抛出内置 `Error`,并保持现有 `onError` 次数。JSB 命令失败 MUST 通过当前命令回执转换为一次 `EntityPlaybackError`。命令成功回执后发生的原生异步失败 MUST 只通过一次 `entityanimationerror` 触发 `onError`。状态事件 MUST NOT 携带错误,同一失败 MUST NOT 同时通过回执和错误事件报告。错误码至少覆盖 `TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET`、`ANIMATION_NOT_FOUND`、`INVALID_TIMELINE`、`COMPILATION_FAILED` 和 `INVALID_SET_VALUES`。动画对象初次创建的异步失败 MUST 终止当前绑定生命周期;配置 update 的异步失败 MUST 原子回滚并保留当前生命周期;其它异步播放错误 MUST 保持既有状态语义。动画活跃期间、binding / native object 创建前或当前绑定生命周期终止后被拒绝的 `api.set` MUST 保持为 no-op,并输出一条 console warning。

#### Scenario: 错误码可区分
- **WHEN** 某个 Entity motion 操作在 Bridge 或 Native 阶段异步失败
- **THEN** `onError` MUST 收到一个 `EntityPlaybackError`,其 `code` 标识失败类型
- **AND** 应用代码 MUST 能够按 `code` 分支,并使用 `reason` 记录可读原因

### Requirement: Entity target 销毁同步关联动画清理

若 Entity target 先销毁,SDK MUST 销毁其关联 animation objects,Native MUST 为每个 animation id 发送 `objectdestroy`。Core MUST 消费该消息、标记对应动画对象已销毁,并注销该 animation id 的事件接收器。同步完成后,playback 命令 MUST 在 Core 本地完成空操作并产生零条 JSB 命令;`api.set` MUST 在 Core 本地输出 warning、完成空操作、产生零条 JSB 命令并保持现有 `onError` 次数。与销毁竞态的在途命令 MAY 以 `ANIMATION_NOT_FOUND` 结束。

#### Scenario: target 先销毁时级联清理动画
- **WHEN** Entity target 在关联 native animation object 之前销毁
- **THEN** Native MUST 销毁全部关联动画并为每个 animation id 发送 `objectdestroy`
- **AND** Core MUST 标记对象已销毁、注销事件接收器,并在本地完成后续 playback
- **AND** 后续以非法或合法稀疏 update 调用 `api.set` 时,每次调用 MUST 返回 `void`、输出一次 warning、在本地完成,且 JSB 调用和 `onError` 计数 MUST 保持为零

#### Scenario: 控制命令与销毁竞态
- **WHEN** 控制命令与 animation object 销毁发生竞态
- **THEN** 它 MAY 以 `ANIMATION_NOT_FOUND` 失败