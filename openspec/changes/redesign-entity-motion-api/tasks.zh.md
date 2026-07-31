## 1. 提案对齐

- [x] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [x] 1.3 从本提案的文档契约和保留 sub-token 中移除 `supports('useEntityAnimation', ['entity'])`；`spatialized-element-motion-api` 的相关措辞另行协调，不在本提案修改批次中直接改动
- [x] 1.4 对齐 Entity motion OpenSpec 状态消息、`callbackAction`、控制完成回执、提交后原生回读和 target 销毁同步契约

## 2. 类型与契约重设计

- [x] 2.1 先编写失败测试,覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`、公开 playback surface(`play`、`pause`、`stop`、`reset`、`finish`)以及只接受 `EntityTransformUpdate` object 的 `api.set`
- [x] 2.2 先编写失败测试,覆盖完整公开 config 契约、`position` / `rotation` / `scale` authoring、顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧、公开默认值、finite 与范围校验、起止边界必填、空 timeline、frame 与 `api.set` update 拒绝、边界帧内部字段稀疏、旧 config 拒绝和 `opacity` 等不支持目标
- [x] 2.2a 先编写失败测试,覆盖 Core 可检测的公开 config 与方法参数错误同步抛出内置 `Error` 且保持 `onError` 次数、命令回执错误与独立 `entityanimationerror` 事件分别通过一次 `onError(SpatializedPlaybackError)` 返回、状态事件不携带错误,以及 `api.set` 状态拒绝保持 warning + no-op
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

- [x] 4.1 先编写红灯测试,覆盖 `entityProps` 在 `start`、`complete`、`stop`、`reset`、`finish` 和原生层接受 `api.set(update)` 后包含完整的 `position`、`rotation`、`scale`,`set` 确认值来自 `SetEntityAnimationResult.values` 且不产生状态事件,React 更新时机限定为生命周期节点或成功设置回执,`onStart` / `onComplete` / `onStop` / `onReset` 接收精确的 `EntityMotionProps` 参数、`onError` 接收精确的 `SpatializedPlaybackError` 参数、callback 返回值被忽略,`idle → finish → finished` 触发一次 `onComplete` 并保持现有 `onStart` 次数,以及终态由配置或 `api.set` 决定
- [x] 4.2 实现 React/Core 状态消息、设置回执和独立错误事件消费,完成调试 `onXXX`、用户 callback 分发和 `entityProps` 完整已提交变换持久化,保持原生层已确认状态的单向流动
- [x] 4.3 先编写红灯测试,覆盖公开播放接口、每个绑定对象独立的 FIFO 命令链与完整 transform 写入保护:原生动画对象创建期间没有待执行播放命令时保持 `idle`;播放命令等待创建时公开 `queued`,`autoStart` 生成的隐式 `play` 也属于待执行命令;创建前的播放命令按顺序执行,`autoStart` 产生的 `play` 排在已有待执行命令之前;命令排队期间 `isAnimating`、`isPaused`、`finished` 保持 `false`;创建成功回执在执行待处理命令前确认 `idle`;待处理的 `pause` 或 `stop` 保持 `idle`;创建失败回执使状态收敛为 `idle`、终止当前绑定生命周期、清空对象状态、待处理命令和 `entityProps`,由其余 React 属性继续控制并分发一次分类错误;创建前的 `set` 和绑定终止后的所有 API 保持控制台警告与空操作;创建后的 `set → play`、`stop → play`、`play → pause` 等待前一条内部 JSB 回执后再执行;活跃期 `set` 按 FIFO 抵达 Native,并把 `INVALID_CONTROL_STATE` 映射为 warning + no-op;普通命令失败继续执行后续队列;解绑、替换和销毁使尚未发送的命令失效;动画活跃期间的写入保持动画和最新 `entityProps`;fresh play 启用保护、暂停保持保护、停止/重置/结束/自然完成解除保护,播放空闲期间普通 React transform 更新抵达 Native;终态填充通过完整 `entityProps` 保持已提交姿态
- [x] 4.3a 先编写绑定生命周期红灯测试,覆盖解绑和目标替换清空 `entityProps`、同一目标的执行签名变化依次等待旧对象 `destroy()` 成功、完整确认姿态存在时提交该姿态、`entityProps` 为空时保持当前原生 transform,并创建新对象、`autoStart: false` 保持交接姿态、首次 fresh play 读取当前原生姿态、姿态交接保持现有镜像和 callback 次数、姿态交接或创建失败终止当前生命周期并触发一次 `onError`、终止后的 API 保持 warning + no-op、config 与 callback 更新只刷新保存值、显式重新绑定开启新代次、destroy 失败时保持旧对象与旧代次并清理本次替换命令和触发一次 `onError`、正常生命周期中仅更新回调时保持当前对象与状态、替换代次的命令排队、每个新对象执行一次隐式 `autoStart`,以及按当前绑定代次和动画对象身份接受回执与事件
- [x] 4.4 复用 Element 动画在对象创建前暂存播放命令、创建后逐条执行的机制,为每个 Entity motion 绑定对象实现带队列批次失效保护的 FIFO 命令链;使用 `CreateEntityAnimation` 回执在执行待处理命令前确认 `idle`,或在创建失败时终止当前绑定生命周期;创建前的 `set` 和终止后的所有命令输出控制台警告、执行空操作并保持在队列之外,创建后所有命令串行执行;同时实现 React/Core 播放接口、JSB 命令发起和完整 transform `entityProps` 更新,使组合后的 React 属性控制播放空闲状态;原生层的 `set` 合并、状态机、终态提交和 transform 写入保护由第 5 节实现
- [x] 4.4a 实现归一化执行签名、回调引用刷新、解绑与目标替换时清空镜像、同一目标销毁成功后的确认姿态或当前原生 transform 交接、姿态交接与创建失败的绑定终止流程、终止后的空操作门闩和显式重新绑定恢复、destroy 失败时的旧对象与旧代次保留和替换命令清理、替换代次命令队列、每个对象的 `autoStart` 和当前代次结果过滤
- [x] 4.4b 先编写 Core/React 红灯测试,覆盖同一种状态消息、`playState` 权威更新、`callbackAction` 与完整 `values` 成对消费、暂停和恢复只更新状态、`finish()` 与自然完成统一触发 `onComplete`、控制成功回执只允许发送下一条等待命令,以及状态消息与回执竞态保持最新状态
- [x] 4.4c 实现 Core/React 状态消息消费:`playState` 更新公开状态,可选 `callbackAction` 分发 callback 和确认姿态,控制成功回执确认当前命令处理完成并允许发送下一条等待命令
- [x] 4.4d 先编写 Core/React target 销毁红灯测试,覆盖 animation id 对应的 `objectdestroy`、已销毁状态、该 id 的事件接收器注销、后续 playback 本地空操作、后续 `set` 本地 warning + 空操作、JSB 命令数稳定和 `onError` 次数稳定
- [x] 4.4e 实现 Core 对 animation id `objectdestroy` 的消费、销毁状态同步、该 id 的事件接收器注销及销毁后本地 API 行为
- [x] 4.5 先编写失败测试,覆盖 `normalizeEntityMotionConfig` 对顶层 `from` / `to`、`timeline.from` / `timeline.to` 和百分比关键帧的等价折叠、`timeline` 优先告警、公开默认值、timeline config 要求 `duration` 且纯顶层 `from` / `to` 默认 0.3 秒、finite 与范围校验、起止边界必填、空 timeline 与 frame 拒绝、归一化后重复百分比拒绝、属性白名单与字段级稀疏保留
- [x] 4.6 在 Core 实现归一化与同步 programmer-error 校验,将 `EntityMotionTimelinePayload` 通过 Entity 专属创建命令传输;命令回执错误和异步错误事件分别通过一次 `onError` 抵达用户;Native 对该 payload 的编译与执行由第 5 节实现

## 5. Native 与 Bridge 实现

- [ ] 5.1 先编写 Bridge contract 红灯测试,分别覆盖 `CreateEntityAnimation`、空 payload 的 `ControlEntityAnimation` 成功回执、`SetEntityAnimation` payload 与回执、请求和回执中的 `id` 语义、`SetEntityAnimationResult.values` 完整确认姿态、状态消息先提交再完成控制回执、同一种 `EntityMotionStateChangedMsg`、可选 `callbackAction`、独立 `entityanimationerror`、封闭错误码集合以及 Core 与两端 Native 编解码一致性
  - [x] 5.1a Core Bridge contract 红灯测试覆盖 Entity 专属创建、控制、设置命令、空控制成功回执、单一状态消息、`callbackAction`、独立错误事件和错误码
  - [x] 5.1b visionOS Bridge contract 红灯测试覆盖 Entity 专属命令、空控制成功回执、单一状态消息、`callbackAction`、独立错误事件、错误码和 loop wire shape
  - [ ] 5.1c picoOS Bridge contract 红灯测试覆盖与 visionOS 相同的 Entity 专属命令、回执、事件和错误码集合
  - [ ] 5.1d 执行 Core、visionOS、picoOS 三端编解码一致性验证
- [ ] 5.2 实现 Core/Native Entity 专属 Bridge 类型、`EntityMotionBridgeTypes` 编解码和三个 handler 注册,使用 `CreateEntityAnimationJSBCommand`、`ControlEntityAnimationJSBCommand`、`SetEntityAnimationJSBCommand`、`spatialanimationstatechanged` 与 `entityanimationerror`
  - [x] 5.2a Core Entity 专属 Bridge 类型、JSB 命令、空控制成功回执、`callbackAction` 状态消息消费和独立错误事件
  - [x] 5.2b visionOS `EntityMotionBridgeTypes` 编解码、空控制成功回执、`callbackAction` 状态消息和三个 `SpatialScene` handler 注册
  - [ ] 5.2c picoOS `EntityMotionBridgeTypes` 编解码和三个 handler 注册
- [ ] 5.3 先编写失败的目标分发与生命周期测试,覆盖创建请求 `id` 查询 Entity、非 Entity 目标拒绝、`TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET`、动画对象 `id` 注册/查找/显式 destroy、Entity target 先销毁、清理、销毁后 no-op 以及竞态返回 `ANIMATION_NOT_FOUND`
- [ ] 5.4 在两端 Native 实现 `SpatialScene` 的三个 Entity handler 及通过全局 spatial objects 完成生命周期级联,由目标 `SpatialEntity.createAnimation(config)` 创建 `EntityMotionAnimationObject`,并由动画对象持有状态、资源并完成清理
  - [x] 5.4a visionOS `SpatialScene` Entity handler、全局 spatial objects 注册/查找、target 销毁级联和动画对象清理已实现
  - [ ] 5.4b picoOS `SpatialScene` Entity handler、全局 spatial objects 生命周期级联和动画对象清理
- [ ] 5.5 先编写时间轴编译器红灯单元测试,覆盖属性、时间、缩放校验,关键帧时间并集,稀疏通道按本轮基准姿态补全,从零时刻 baseline 到通道首个较晚关键帧的平滑线性插值,通道插值,每个切点的完整姿态,逐段缓动优先级,包含等价 quaternion 和 gimbal lock 的确定性欧拉角组合/拆解,完整已确认变换输出和区间表达能力校验
- [ ] 5.6 在两端 Native 实现 `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues`,产出按时间排序的完整姿态段及规范化欧拉角 confirmed transform 拆解/稀疏 update 合并能力
  - [x] 5.6a visionOS `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues` 已实现并覆盖完整姿态段、规范化欧拉角拆解和稀疏 update 合并
  - [ ] 5.6b picoOS `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues`
- [x] 5.7 先编写失败的 visionOS 集成测试,覆盖 RealityKit 整 `.transform` 绑定、多段完整姿态资源、`AnimationResource.sequence`、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
  - [x] 5.7a 已添加 visionOS Bridge、timeline compiler、动画对象状态机和 `SpatialScene` 生命周期测试,并已纳入 `build-for-testing`
  - [x] 5.7b 补齐并运行 visionOS simulator 支持的 RealityKit `.transform`、`AnimationResource.sequence`、平台 easing、delay、playback rate、loop 和编译失败集成验收
- [x] 5.8 实现 visionOS RealityKit 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [ ] 5.9 先编写失败的 picoOS 集成测试,使用与 visionOS 相同的规范时间轴 fixtures 覆盖整 transform 绑定、多段完整姿态 sequence、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
- [ ] 5.10 实现 picoOS 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [x] 5.11 先编写失败的 fresh-play 状态测试,覆盖首次 `play` / `autoStart`、complete/finish/stop/reset 后 replay 读取最新基准姿态并重新编译,pause 后 play 恢复当前控制器,单次播放内 loop 复用当前资源,编译失败保持非活跃、React 专用 `queued` 与原生层四种状态的映射、创建失败后公开状态收敛为 `idle`,以及 `finished` 根据 `playState` 精确派生
  - [x] 5.11a 已添加 visionOS fresh play 基线读取、写入保护、非活跃 `set`、终态释放和首次 play 前 `reset` 状态测试,并已纳入 `build-for-testing`
  - [x] 5.11b 补齐 `autoStart`、replay、pause 后 play 对应的原生层 `running` 状态消息与 Core 状态更新、loop 资源复用、编译失败、创建失败和 `finished` 派生的完整状态测试
- [ ] 5.12 在 `SpatialEntity.createAnimation(config)` 与 `EntityMotionAnimationObject` 中实现创建、fresh play、首次运行前按需读取基准姿态、delay/running/paused 状态转换、pause 后 play、loop 资源复用和命令失败回执
  - [x] 5.12a visionOS `SpatialEntity.createAnimation(config)` 与 `EntityMotionAnimationObject` 实现创建、fresh play、基准姿态读取、delay/running/paused 状态转换、pause 后 play 发送 `running` 状态消息、loop 和命令失败回执路径
  - [ ] 5.12b picoOS 对等创建、fresh play、状态转换、pause 后 play、loop 和命令失败回执路径
- [ ] 5.13 先编写控制、设置与事件红灯测试,覆盖完整状态命令矩阵、`start` / `complete` / `stop` / `reset` 四种 `callbackAction`、暂停与恢复状态消息、首次 play 前的 `reset` / `finish`、终态命令重复执行、`stop` 提交当前姿态、`reset` 提交起始姿态、`finish` 在全部 loop 模式提交终点并使用 `callbackAction: complete`、fresh play 写入保护、播放空闲期间普通 React transform 更新、非活跃 `set` 稀疏合并、独立错误事件、命令与完成事件串行处理、业务控制器身份隔离、其它动画保持运行、状态消息先提交再完成控制回执,以及从提交后 RealityKit 实际 transform 取得完整确认姿态
  - [x] 5.13a 已添加 visionOS 非活跃 `set` 稀疏合并、活跃 `set` 状态拒绝、终态释放写入保护、reset 起始姿态、场景生命周期和 target 销毁后的 Native registry 清理测试,并已纳入 `build-for-testing`
  - [ ] 5.13b 补齐 visionOS 单一状态消息、`callbackAction`、暂停与恢复、空控制成功回执、消息提交顺序、控制器身份隔离、loop 终态提交和 simulator 运行验收
  - [x] 5.13c 补齐 visionOS 提交后回读测试,区分计算目标姿态与 RealityKit 实际确认姿态,覆盖 start/reset/finish/complete/set、等价 quaternion、超过 180° 输入、gimbal lock、零缩放和完整三分量
- [ ] 5.14 实现完整状态命令矩阵、控制器级清理、零时长终态提交、fresh play transform 写入保护、暂停期间保持保护、终态与清理路径解除保护、提交后 Entity 当前完整 transform 回读与拆解、稀疏 rotation 合并、私有单一状态消息发送、可选 `callbackAction`、专用错误事件发送、业务控制器身份过滤、命令与完成事件串行处理和生命周期 callback 单次触发门控;让成功 `set` 通过 `SetEntityAnimationResult.values` 返回回读的完整 transform,让 `INVALID_CONTROL_STATE` 转换为一次控制台警告和正常返回,同时保持当前姿态、状态与 `entityProps`
  - [ ] 5.14a visionOS 状态矩阵、控制器级清理、提交后完整 transform 回读、规范化欧拉角拆解、稀疏 rotation 合并、单一状态消息、`callbackAction`、空控制成功回执、专用错误事件、控制器身份过滤、串行处理和 `SetEntityAnimationResult.values` 回执路径
  - [ ] 5.14b picoOS 对等状态矩阵、清理、终态提交、写入保护、transform 拆解、稀疏合并、事件和回执实现

## 6. Capability 与校验

- [x] 6.1 先编写失败测试，覆盖使用 `supports('useEntityAnimation')` 检测 Entity motion 的目标态契约
- [x] 6.2 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败
- [x] 6.3 更新 runtime capability 与校验实现行为，使之匹配新的目标态契约

## 7. 文档、Demo 与迁移

- [ ] 7.1 更新物体运动文档与示例,统一使用 `position`、`rotation`、`scale` 配置、`animation`、完整变换 `entityProps` 和 `EntityTransformUpdate` 写入;说明通过 `entityProps` 读取、通过 `api.set(update)` 写入、组合后的 React 属性控制播放空闲状态、Native 在 delay/running/paused 期间提供完整 transform 写入保护、停止/重置/结束/自然完成后解除保护、创建或交接失败后的终止行为和显式重新绑定方式;补充顶层 `from`、`to` 简写及其规则(`timeline.from`、`timeline.to` 等价,`timeline` 优先,纯顶层配置默认 0.3 秒);说明每个动画显式声明起点 `from`/`0%` 和终点 `to`/`100%`,缺少边界时产生校验错误
- [x] 7.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 7.3 补充迁移说明，覆盖旧顶层 transform config 的移除，Entity motion 绑定统一使用 `animation`

## 8. 验证与跨端验收

- [x] 8.1 严格按 TDD 顺序执行实现：每组行为先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [x] 8.2 运行 React/Core 定向单测,覆盖 tuple、binding、归一化、能力检测、`callbackAction`、状态消息与控制回执竞态、target `objectdestroy`、`entityProps`、transform 写入保护、播放空闲期间 React transform 更新和 `api.set` 命令发起
- [ ] 8.3 运行 Bridge contract 与集成测试,确认 Core、visionOS、picoOS 对创建/控制/设置 payload 与回执、播放状态事件、独立错误事件和错误码的编解码一致
  - [x] 8.3a 运行新 Bridge 契约下的 Core Entity motion 定向测试
  - [x] 8.3b 运行新 Bridge 契约下的完整 visionOS `xcodebuild test`
  - [x] 8.3c 使用当前 Apple Vision Pro Simulator 执行完整 `xcodebuild test`,记录 Xcode、SDK、Simulator、命令、测试统计和新 `.xcresult`
  - [ ] 8.3d picoOS Bridge contract 与集成测试未运行
- [x] 8.4 在 visionOS 上验收百分比多关键帧、稀疏字段、完整姿态 sequence、fresh play、delay、loop、pause 与 pause 后 play、stop/reset/finish/set、控制器级清理、其它 Entity 与子节点动画保持运行、终态提交和销毁,记录平台版本、SDK 版本、fixtures、执行命令和结果
  - [x] 8.4a 记录当前 Xcode、visionOS SDK、Apple Vision Pro Simulator 版本、设备名称和 UDID,以及全部 fixtures
  - [x] 8.4b 执行完整 `xcodebuild test` 与 `tools/scripts/iwdp-sim.py` 的 list、eval、click、dom/probe、screenshot,记录新 `.xcresult`、逐项观测和已检查截图路径
- [ ] 8.5 在 picoOS 运行与 8.4 相同的 fixtures 和验收矩阵,并记录平台版本、SDK 版本、fixtures、执行命令和结果
- [ ] 8.6 对照两端的状态消息与 `callbackAction` 顺序、confirmed values、终态 transform、错误结果和 replay 行为,记录并解决跨端差异
- [x] 8.7 执行端到端回归,覆盖动画终态、active set 以及 Entity motion Spec 定义的 target 销毁生命周期和错误行为
  - [x] 8.7a 使用 iwdp 回归确认完整终态 transform、active set 警告与空操作、pause 与 pause 后 play 状态同步、finish 完成 callback 幂等、其它 Entity 保持运行和 target `objectdestroy` 后的 Core 本地行为
- [x] 8.8 记录 visionOS 与 picoOS 并发性能测量的延期跟进范围;这些测量不作为本次变更的发布 gate
- [ ] 8.9 建立 Design-to-Tasks 对照表,确认每个 Native 类、JSB 协议、编译规则、控制时序和错误路径都有实现与验证任务
- [x] 8.10 在提案与实现对照复核中确认 `add-entity-transform-animation` 已记录为正式 superseded
