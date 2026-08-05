## 1. 提案对齐

- [x] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [x] 1.2 确认 `spatialized-element-motion-api` 将 Entity motion 排除在其范围外，并由本变更定义 Entity 权威目标态
- [x] 1.3 从本提案的文档契约和保留 sub-token 中移除 `supports('useEntityAnimation', ['entity'])`；`spatialized-element-motion-api` 的相关措辞另行协调，不在本提案修改批次中直接改动
- [x] 1.4 对齐 Entity motion OpenSpec 状态消息、`callbackAction`、控制完成回执、提交后原生回读和 target 销毁同步契约

## 2. 类型与契约重设计

- [x] 2.1 先编写失败测试,覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`、公开 playback surface(`play`、`pause`、`stop`、`reset`、`finish`)以及只接受 `EntityTransformUpdate` object 的 `api.set`
- [x] 2.2 先编写失败测试,覆盖完整公开 config 契约、`position` / `rotation` / `scale` authoring、顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧、公开默认值、finite 与范围校验、起止边界必填、空 timeline、frame 与 `api.set` update 拒绝、边界帧内部字段稀疏、旧 config 拒绝和 `opacity` 等不支持目标
- [x] 2.2a 先编写失败测试,覆盖 Core 可检测的公开 config 与方法参数错误同步抛出内置 `Error` 且保持 `onError` 次数、命令回执错误与独立 `entityanimationerror` 事件分别通过一次 `onError(EntityPlaybackError)` 返回、状态事件不携带错误,以及 `api.set` 状态拒绝保持 warning + no-op
- [x] 2.3 重设计 Core 和 React 类型面,实现上述 Entity motion config、transform-only callback values、playback API、写入侧 `EntityTransformUpdate` 与 Core `EntityAnimationObject` 调试 `onXXX`

## 3. Entity 绑定迁移

- [x] 3.1 先编写失败测试，证明 Entity motion 通过 `animation` 属性绑定
- [x] 3.1a 先编写失败测试，证明绑定完成后 React Binding 调用 `SpatialEntity.createAnimation(config)`，且不直接调用 `AnimationObject.create(...)` 或构造内部规范时间轴 payload
- [x] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [x] 3.2a 在 Core 为 `SpatialEntity` 实现 `createAnimation(config)`,由它封装自身空间对象 id、Entity 专属归一化与校验,通过 `CreateEntityAnimation` 创建并返回私有保存 config 与 timeline 的 `EntityAnimationObject`
- [x] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [x] 3.4 在文档中把 `animation` 作为 Entity motion 的绑定方式
- [x] 3.5 删除 JS 侧旧 entity-transform-animation 遗留,包括 suppression 机制 `animation.__getSuppressedFields` 与 suppression 释放后 base props 重同步路径;复用 Element 动画的 Native animating mask,fresh play 时启用完整 transform 写入保护,暂停期间保持保护,停止、重置、结束和自然完成后解除保护,并在解绑、绑定终止或销毁动画对象时完成清理

## 4. Playback、Outlet 与 Core 归一化

- [x] 4.1 先编写红灯测试,覆盖 `entityProps` 在 `start`、`complete`、`stop`、`reset`、`finish` 和原生层接受 `api.set(update)` 后包含完整的 `position`、`rotation`、`scale`,`set` 确认值来自 `SetEntityAnimationResult.values` 且不产生状态事件,React 更新时机限定为生命周期节点或成功设置回执,`onStart` / `onComplete` / `onStop` / `onReset` 接收精确的 `EntityMotionProps` 参数、`onError` 接收精确的 `EntityPlaybackError` 参数、callback 返回值被忽略,`idle → finish → finished` 触发一次 `onComplete` 并保持现有 `onStart` 次数,以及终态由配置或 `api.set` 决定
- [x] 4.2 实现 React/Core 状态消息、设置回执和独立错误事件消费,完成调试 `onXXX`、用户 callback 分发和 `entityProps` 完整已提交变换持久化,保持原生层已确认状态的单向流动
- [x] 4.3 先编写红灯测试,覆盖公开播放接口、每个绑定对象独立的 FIFO 命令链与完整 transform 写入保护:原生动画对象创建期间没有待执行播放命令时保持 `idle`;播放命令等待创建时公开 `queued`,`autoStart` 生成的隐式 `play` 也属于待执行命令;创建前的播放命令按顺序执行,`autoStart` 产生的 `play` 排在已有待执行命令之前;命令排队期间 `isAnimating`、`isPaused`、`finished` 保持 `false`;创建成功回执在执行待处理命令前确认 `idle`;待处理的 `pause` 或 `stop` 保持 `idle`;创建失败回执使状态收敛为 `idle`、终止当前绑定生命周期、清空对象状态、待处理命令和 `entityProps`,由其余 React 属性继续控制并分发一次分类错误;创建前的 `set` 和绑定终止后的所有 API 保持控制台警告与空操作;创建后的 `set → play`、`stop → play`、`play → pause` 等待前一条内部 JSB 回执后再执行;活跃期 `set` 按 FIFO 抵达 Native,并把 `INVALID_CONTROL_STATE` 映射为 warning + no-op;普通命令失败继续执行后续队列;解绑、替换和销毁使尚未发送的命令失效;动画活跃期间的写入保持动画和最新 `entityProps`;fresh play 启用保护、暂停保持保护、停止/重置/结束/自然完成解除保护,播放空闲期间普通 React transform 更新抵达 Native;终态填充通过完整 `entityProps` 保持已提交姿态
- [x] 4.4 复用 Element 动画在对象创建前暂存播放命令、创建后逐条执行的机制,为每个 Entity motion 绑定对象实现带队列批次失效保护的 FIFO 命令链;使用 `CreateEntityAnimation` 回执在执行待处理命令前确认 `idle`,或在创建失败时终止当前绑定生命周期;创建前的 `set` 和终止后的所有命令输出控制台警告、执行空操作并保持在队列之外,创建后所有命令串行执行;同时实现 React/Core 播放接口、JSB 命令发起和完整 transform `entityProps` 更新,使组合后的 React 属性控制播放空闲状态;原生层的 `set` 合并、状态机、终态提交和 transform 写入保护由第 5 节实现
- [x] 4.4b 先编写 Core/React 红灯测试,覆盖同一种状态消息、`playState` 权威更新、`callbackAction` 与完整 `values` 成对消费、暂停和恢复只更新状态、`finish()` 与自然完成统一触发 `onComplete`、控制成功回执只允许发送下一条等待命令,以及状态消息与回执竞态保持最新状态
- [x] 4.4c 实现 Core/React 状态消息消费:`playState` 更新公开状态,可选 `callbackAction` 分发 callback 和确认姿态,控制成功回执确认当前命令处理完成并允许发送下一条等待命令
- [x] 4.4d 先编写 Core/React target 销毁红灯测试,覆盖 animation id 对应的 `objectdestroy`、已销毁状态、该 id 的事件接收器注销、后续 playback 本地空操作、后续 `set` 本地 warning + 空操作、JSB 命令数稳定和 `onError` 次数稳定
- [x] 4.4e 实现 Core 对 animation id `objectdestroy` 的消费、销毁状态同步、该 id 的事件接收器注销及销毁后本地 API 行为
- [x] 4.5 先编写失败测试,覆盖 `normalizeEntityMotionConfig` 对顶层 `from` / `to`、`timeline.from` / `timeline.to` 和百分比关键帧的等价折叠、`timeline` 优先告警、公开默认值、timeline config 要求 `duration` 且纯顶层 `from` / `to` 默认 0.3 秒、finite 与范围校验、起止边界必填、空 timeline 与 frame 拒绝、归一化后重复百分比拒绝、属性白名单与字段级稀疏保留
- [x] 4.6 在 Core 实现归一化与同步 programmer-error 校验,将 `EntityMotionTimelinePayload` 通过 Entity 专属创建命令传输;命令回执错误和异步错误事件分别通过一次 `onError` 抵达用户;Native 对该 payload 的编译与执行由第 5 节实现

## 5. Native 与 Bridge 实现

Bridge 契约验证：
  - [x] 5.1a Core Bridge contract 红灯测试覆盖 Entity 专属创建、控制、设置命令、空控制成功回执、单一状态消息、`callbackAction`、独立错误事件和错误码
  - [x] 5.1b visionOS Bridge contract 红灯测试覆盖 Entity 专属命令、空控制成功回执、单一状态消息、`callbackAction`、独立错误事件、错误码和 loop wire shape

Bridge 实现：
  - [x] 5.2a Core Entity 专属 Bridge 类型、JSB 命令、空控制成功回执、`callbackAction` 状态消息消费和独立错误事件
  - [x] 5.2b visionOS `EntityMotionBridgeTypes` 编解码、空控制成功回执、`callbackAction` 状态消息和四个 `SpatialScene` handler 注册
- [x] 5.3a 核实 visionOS 目标分发与生命周期实现及现有对象级测试
- [x] 5.3b 补充 `SpatialScene` handler 直接测试，覆盖目标查询与拒绝、稳定错误映射、动画对象注册与查询、显式销毁、目标先销毁、清理和 `ANIMATION_NOT_FOUND` 竞态结果

Native 生命周期实现：
  - [x] 5.4a visionOS `SpatialScene` Entity handler、全局 spatial objects 注册/查找、target 销毁级联和动画对象清理已实现
- [x] 5.5 添加 visionOS 时间轴编译器单元测试，覆盖属性、时间、缩放校验、时间并集、稀疏基准补全、延迟通道插值、完整姿态、缓动优先级、确定性欧拉角转换、确认变换和不可表达区间

Native 编译器实现：
  - [x] 5.6a visionOS `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues` 已实现并覆盖完整姿态段、规范化欧拉角拆解和稀疏 update 合并
- [x] 5.7 先编写失败的 visionOS 集成测试,覆盖 RealityKit 整 `.transform` 绑定、多段完整姿态资源、`AnimationResource.sequence`、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
  - [x] 5.7a 已添加 visionOS Bridge、timeline compiler 和动画对象状态机测试,并已纳入 `build-for-testing`
  - [x] 5.7b 补齐并运行 visionOS simulator 支持的 RealityKit `.transform`、`AnimationResource.sequence`、平台 easing、delay、playback rate、loop 和编译失败集成验收
- [x] 5.8 实现 visionOS RealityKit 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [x] 5.11 先编写失败的 fresh-play 状态测试,覆盖首次 `play` / `autoStart`、complete/finish/stop/reset 后 replay 读取最新基准姿态并重新编译,pause 后 play 恢复当前控制器,单次播放内 loop 复用当前资源,编译失败保持非活跃、React 专用 `queued` 与原生层四种状态的映射、创建失败后公开状态收敛为 `idle`,以及 `finished` 根据 `playState` 精确派生
  - [x] 5.11a 已添加 visionOS fresh play 基线读取、写入保护、非活跃 `set`、终态释放和首次 play 前 `reset` 状态测试,并已纳入 `build-for-testing`
  - [x] 5.11b 补齐 `autoStart`、replay、pause 后 play 对应的原生层 `running` 状态消息与 Core 状态更新、loop 资源复用、编译失败、创建失败和 `finished` 派生的完整状态测试
Native 播放实现：
  - [x] 5.12a visionOS `SpatialEntity.createAnimation(config)` 与 `EntityMotionAnimationObject` 实现创建、fresh play、基准姿态读取、delay/running/paused 状态转换、pause 后 play 发送 `running` 状态消息、loop 和命令失败回执路径

Native 状态与事件验证：
  - [x] 5.13a 已添加 visionOS 非活跃 `set` 稀疏合并、活跃 `set` 状态拒绝、终态释放写入保护、reset 起始姿态和控制器清理测试,并已纳入 `build-for-testing`
  - [x] 5.13b 补齐 visionOS 单一状态消息、`callbackAction`、暂停与恢复、空控制成功回执、消息提交顺序、控制器身份隔离、全部 loop 终态提交、旧完成事件过滤和 simulator 运行验收
  - [x] 5.13c 补齐 visionOS 提交后回读测试,区分计算目标姿态与 RealityKit 实际确认姿态,覆盖 start/reset/finish/complete/set、等价 quaternion、超过 180° 输入、gimbal lock、零缩放和完整三分量

Native 状态实现：
  - [x] 5.14a visionOS 状态矩阵、控制器级清理、提交后完整 transform 回读、规范化欧拉角拆解、稀疏 rotation 合并、单一状态消息、`callbackAction`、空控制成功回执、专用错误事件、控制器身份过滤、串行处理和 `SetEntityAnimationResult.values` 回执路径

## 6. Capability 与校验

- [x] 6.1 先编写失败测试，覆盖使用 `supports('useEntityAnimation')` 检测 Entity motion 的目标态契约
- [x] 6.2 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败
- [x] 6.3 更新 runtime capability 与校验实现行为，使之匹配新的目标态契约

## 7. 文档与 Demo

- [x] 7.1 更新 Entity motion 文档，覆盖当前配置、绑定、三元组、播放接口、`entityProps`、`api.set`、transform 所有权、能力检测和原地更新行为
- [x] 7.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API

## 8. 验证与跨端验收

- [x] 8.1 严格按 TDD 顺序执行实现：每组行为先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [x] 8.2 运行 React/Core 定向单测,覆盖 tuple、binding、归一化、能力检测、`callbackAction`、状态消息与控制回执竞态、target `objectdestroy`、销毁后 FIFO 失效、`entityProps`、transform 写入保护、播放空闲期间 React transform 更新和 `api.set` 命令发起
Bridge 与集成验收：
  - [x] 8.3a 运行新 Bridge 契约下的 Core Entity motion 定向测试
  - [x] 8.3b 运行新 Bridge 契约下的完整 visionOS `xcodebuild test`
- [x] 8.4 在 visionOS 上验收百分比多关键帧、稀疏字段、完整姿态 sequence、fresh play、delay、loop、pause 与 pause 后 play、stop/reset/finish/set、控制器级清理、其它 Entity 与子节点动画保持运行、终态提交和销毁,记录平台版本、SDK 版本、fixtures、执行命令和结果
  - [x] 8.4a 记录当前 Xcode、visionOS SDK、Apple Vision Pro Simulator 版本、设备名称和 UDID,以及全部 fixtures
  - [x] 8.4b 执行完整 `xcodebuild test` 与 `tools/scripts/iwdp-sim.py` 的 list、eval、click、dom/probe、screenshot,记录新 `.xcresult`、逐项观测和已检查截图路径
- [x] 8.7 执行端到端回归,覆盖动画终态、active set 以及 Entity motion Spec 定义的 target 销毁生命周期和错误行为
  - [x] 8.7a 使用 iwdp 回归确认完整终态 transform、active set 警告与空操作、pause 与 pause 后 play 状态同步、finish 完成 callback 幂等、其它 Entity 保持运行和 target `objectdestroy` 后的 Core 本地行为
- [x] 8.8 记录 visionOS 与 picoOS 并发性能测量的延期跟进范围;这些测量不作为本次变更的发布 gate

## 9. 原地配置更新与重新定向

- [x] 9.1 先编写 Core 红灯测试,覆盖 `update(config)` 内化校验、等价配置、成功提交、失败回滚、销毁后调用,以及具体 `set(update)` Promise 返回确认姿态
- [x] 9.2 添加 React 测试，覆盖对象与 id 稳定、统一 FIFO、安全合并、回调更新、`autoStart` 和失败恢复；版本过滤由 Core 测试验证
- [x] 9.3 先编写 Core 与 visionOS 桥接红灯测试,覆盖 `UpdateEntityAnimation` 编解码、结果、错误和消息顺序
- [x] 9.4 只读验证 RealityKit 读取当前姿态、准备资源、切换控制器、过滤旧完成事件和保持暂停的能力;无法满足原子回滚时返回设计评审
- [x] 9.5 添加 visionOS 重新定向测试，覆盖当前姿态临时起点、基准姿态、缓动与播放参数、配置边界、中间关键帧、旧完成事件和写入保护
- [x] 9.6 添加 visionOS 状态与失败测试，覆盖暂停、空闲和完成状态更新、回调、确认值、非活跃基准延迟读取和原子回滚
- [x] 9.7 最小实现 Core `update(config)`、`UpdateEntityAnimationJSBCommand`、快照提交和执行版本;把配置校验与执行定义比较内化到创建和更新入口;让具体 `set(update)` 返回确认姿态 Promise
- [x] 9.8 最小实现 React 原地更新、FIFO 和安全合并,删除同目标销毁重建、姿态交接和替换代次
- [x] 9.9 最小实现 visionOS 更新入口、事务更新、重新定向、暂停定义、旧事件过滤和确认姿态回传
- [x] 9.10 在测试持续通过时重构,删除已取代的替换代码和测试夹具,以及 Entity motion internal 子路径的导出、映射、引用和测试;保留目标替换、解绑和销毁流程
- [x] 9.13 删除已被取代的 visionOS `AnimateTransform` 命令、会话管理器、Bridge 监听器和生命周期清理