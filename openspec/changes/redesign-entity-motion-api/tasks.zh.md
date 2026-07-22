## 1. 提案对齐

- [ ] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [ ] 1.3 从本提案的文档契约和保留 sub-token 中移除 `supports('useEntityAnimation', ['entity'])`；`spatialized-element-motion-api` 的相关措辞另行协调，不在本提案修改批次中直接改动

## 2. 类型与契约重设计

- [ ] 2.1 先编写失败测试,覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`、公开 playback surface(`play`、`pause`、`stop`、`reset`、`finish`)以及只接受 `EntityMotionPatch` object 的 `api.set`
- [ ] 2.2 先编写失败测试,覆盖完整公开 config 契约、`position` / `rotation` / `scale` authoring、顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧、公开默认值、finite 与范围校验、起止边界必填、空 timeline、frame 与 `api.set` patch 拒绝、边界帧内部字段稀疏、旧 config 拒绝和 `opacity` 等不支持目标
- [ ] 2.2a 先编写失败测试,覆盖 Core 可检测的公开 config 与方法参数错误同步抛出内置 `Error` 且保持 `onError` 次数、Native 兜底校验与 Bridge/Native 执行失败通过 `onError(SpatializedPlaybackError)` 返回,以及 `api.set` 状态拒绝保持 warning + no-op
- [ ] 2.3 重设计 Core 和 React 类型面,实现上述 Entity motion config、transform-only callback values、playback API 与写入侧 `EntityMotionPatch`

## 3. Entity 绑定迁移

- [ ] 3.1 先编写失败测试，证明 Entity motion 通过 `animation` 属性绑定
- [ ] 3.1a 先编写失败测试，证明绑定完成后 React Binding 调用 `SpatialEntity.createAnimation(config)`，且不直接调用 `AnimationObject.create(...)` 或构造内部规范时间轴 payload
- [ ] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [ ] 3.2a 在 Core 为 `SpatialEntity` 实现 `createAnimation(config)`，由它封装自身空间对象 id、Entity 专属归一化与校验，并把规范时间轴委托给通用 `AnimationObject` 创建流程
- [ ] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [ ] 3.4 在文档中把 `animation` 作为 Entity motion 的绑定方式
- [ ] 3.5 删除 JS 侧旧 entity-transform-animation 遗留,包括 suppression 机制 `animation.__getSuppressedFields` 与 suppression 释放后 base props 重同步路径;复用 Element 动画的 Native animating mask,由目标 Entity 保存完整 transform owner,由 `SpatialScene` 在普通 Entity transform 更新入口执行仲裁,并在解绑或销毁动画对象时释放 owner

## 4. Playback、Outlet 与 Core 归一化

- [ ] 4.1 先编写红灯测试,覆盖 `entityProps` 在 `start`、`complete`、`stop`、`reset`、`finish` 和原生层接受 `api.set(values)` 后包含完整的 `position`、`rotation`、`scale`,React 更新时机限定为生命周期节点,`onStart` / `onComplete` / `onStop` / `onReset` 接收精确的 `EntityMotionProps` 参数、`onError` 接收精确的 `SpatializedPlaybackError` 参数、callback 返回值被忽略,`idle → finish → finished` 触发一次 `onComplete` 并保持现有 `onStart` 次数,以及终态由配置或 `api.set` 决定
- [ ] 4.2 实现 React/Core 状态事件消费、回调分发和 `entityProps` 完整已提交变换持久化,保持原生层已确认状态的单向流动
- [ ] 4.3 先编写红灯测试,覆盖公开播放接口、每个绑定对象独立的 FIFO 命令链与完整变换控制权:原生动画对象创建前的播放命令按顺序执行,`autoStart` 产生的 `play` 排在已有待执行命令之前;创建前的 `set` 保持控制台警告与空操作且不进入队列;创建后的 `set → play`、`stop → play`、`play → pause` 等待前一条内部 JSB 回执后再执行;命令失败不阻塞后续队列;解绑、替换和销毁使尚未发送的命令失效;动画活跃期间的写入保持动画和最新 `entityProps`;确认后完整 `entityProps` 镜像在绑定存续期间保持控制权;解绑后 React 属性恢复控制;终态填充保持已提交终点姿态
- [ ] 4.3a 先编写绑定生命周期红灯测试,覆盖解绑和目标替换清空 `entityProps`、同一目标的执行签名变化停止旧控制器并在替换动画对象期间保持镜像、仅更新回调时保持当前对象与状态、替换代次的命令排队、每个新对象执行一次隐式 `autoStart`,以及按当前绑定代次和动画对象身份接受回执与事件
- [ ] 4.4 复用 Element 动画在对象创建前暂存命令、创建后逐条执行的机制,为每个 Entity motion 绑定对象实现带队列批次失效保护的 FIFO 命令链;创建前的 `set` 不进入队列,创建后所有命令串行执行;同时实现 React/Core 播放接口、JSB 命令发起、完整变换出口控制权和解绑后的控制权交还;原生层的 `set` 合并、状态机与终态提交由第 5 节实现
- [ ] 4.4a 实现归一化执行签名、回调引用刷新、解绑与目标替换时清空镜像、同一目标销毁并重建时保持镜像、替换代次命令队列、每个对象的 `autoStart` 和当前代次结果过滤
- [ ] 4.5 先编写失败测试,覆盖 `normalizeEntityMotionConfig` 对顶层 `from` / `to`、`timeline.from` / `timeline.to` 和百分比关键帧的等价折叠、`timeline` 优先告警、公开默认值、timeline config 要求 `duration` 且纯顶层 `from` / `to` 默认 0.3 秒、finite 与范围校验、起止边界必填、空 timeline 与 frame 拒绝、归一化后重复百分比拒绝、属性白名单与字段级稀疏保留
- [ ] 4.6 在 Core 实现归一化与同步 programmer-error 校验,保持现有 `EntityMotionTimelinePayload` 和创建命令传输结构兼容;异步 Bridge 与 Native 失败继续通过 `onError` 抵达用户;Native 对该 payload 的编译与执行由第 5 节实现

## 5. Native 与 Bridge 实现

- [ ] 5.1 先编写失败的 Bridge contract 测试,覆盖创建/控制命令 payload、`set` values、成功回执只在原生层完成同步状态转换和姿态提交并发出对应状态事件后返回、活跃期 `set` 在不新增回执结构的前提下返回现有 `INVALID_CONTROL_STATE` 失败、`EntityMotionStateChangedMsg` detail/action/playState/values/error、Design 定义的封闭错误码集合以及 Core 与两端 Native 编解码一致性
- [ ] 5.2 实现 Core/Native Bridge 类型、`EntityMotionBridgeTypes` 编解码和 handler 注册,复用 `CreateSpatializedElementAnimationJSBCommand`、`ControlSpatializedElementAnimationJSBCommand` 与 `spatialanimationstatechanged`
- [ ] 5.3 先编写失败的目标分发与生命周期测试,覆盖 `elementId` 查询、element/entity/unsupported 分发、`TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET`、动画注册/查找/显式 destroy、Entity target 先销毁、清理、销毁后 no-op 以及竞态返回 `ANIMATION_NOT_FOUND`
- [ ] 5.4 在两端 Native 实现 `SpatialScene` Entity 分发及通过全局 spatial objects 完成生命周期级联,保持 `EntityMotionManager` 只负责创建,由 `EntityMotionAnimationObject` 持有状态、资源并完成清理
- [ ] 5.5 先编写时间轴编译器红灯单元测试,覆盖属性、时间、缩放校验,关键帧时间并集,稀疏通道按本轮基准姿态补全,通道插值,每个切点的完整姿态,逐段缓动优先级,包含等价 quaternion 和 gimbal lock 的确定性欧拉角组合/拆解,完整已确认变换输出和区间表达能力校验
- [ ] 5.6 在两端 Native 实现 `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues`,产出按时间排序的完整姿态段及规范化欧拉角 confirmed transform 拆解/稀疏补丁合并能力
- [ ] 5.7 先编写失败的 visionOS 集成测试,覆盖 RealityKit 整 `.transform` 绑定、多段完整姿态资源、`AnimationResource.sequence`、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
- [ ] 5.8 实现 visionOS RealityKit 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [ ] 5.9 先编写失败的 picoOS 集成测试,使用与 visionOS 相同的规范时间轴 fixtures 覆盖整 transform 绑定、多段完整姿态 sequence、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
- [ ] 5.10 实现 picoOS 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [ ] 5.11 先编写失败的 fresh-play 状态测试,覆盖首次 `play` / `autoStart`、complete/finish/stop/reset 后 replay 读取最新基准姿态并重新编译,pause 后 play 恢复当前控制器,单次播放内 loop 复用当前资源,编译失败保持非活跃、React 专用 `queued` 与原生层四种状态的映射,以及 `finished` 根据 `playState` 精确派生
- [ ] 5.12 在 `EntityMotionManager` 与 `EntityMotionAnimationObject` 中实现 fresh play、首次运行前按需读取基准姿态、delay/running/paused 状态转换、resume、loop 资源复用和命令失败回执
- [ ] 5.13 先编写控制与事件红灯测试,覆盖完整状态命令矩阵和 `play`、`start`、`complete`、`pause`、`stop`、`reset`、`finish`、`destroy`、`set`、`error` 动作,首次 play 前的 `reset` / `finish`,终态命令重复执行,`stop` 提交当前姿态,`reset` 提交起始姿态,`finish` 在普通播放、reset loop 和 reverse loop 中提交 `to` / `100%`,`complete` 提交本次运行结果,非活跃状态下的 `set` 稀疏合并及基于规范化欧拉角基准的单轴 rotation patch,活跃状态下的 `set` 保持状态并输出警告,命令与完成事件串行处理,业务控制器身份隔离、零时长提交动作分类、保持其它动画运行、生命周期回调单次触发、确认姿态事件先于回执、独立于配置字段的完整已确认 `position`、`rotation`、`scale`,以及包含 loop reset 提交的 `entityProps` 与回调映射
- [ ] 5.14 实现完整状态命令矩阵、控制器级清理、零时长终态提交、规范化欧拉角确认姿态读取/拆解及稀疏 rotation 合并、状态事件编码与发送、业务控制器身份过滤、零时长提交动作分类、命令与完成事件串行处理和生命周期回调单次触发门控;将 `set` 命令的 `INVALID_CONTROL_STATE` 转换为一次控制台警告和正常返回,同时保持当前姿态、状态与 `entityProps`

## 6. Capability 与校验

- [ ] 6.1 先编写失败测试，覆盖使用 `supports('useEntityAnimation')` 检测 Entity motion 的目标态契约
- [ ] 6.2 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败
- [ ] 6.3 更新 runtime capability 与校验实现行为，使之匹配新的目标态契约

## 7. 文档、Demo 与迁移

- [ ] 7.1 更新物体运动文档与示例,统一使用 `position`、`rotation`、`scale` 配置、`animation`、完整变换 `entityProps` 和补丁对象 `api.set`;说明通过 `entityProps` 读取、通过 `api.set(values)` 写入、绑定生命周期内的完整变换控制权和解绑后的控制权交还;补充顶层 `from`、`to` 简写及其规则(`timeline.from`、`timeline.to` 等价,`timeline` 优先,纯顶层配置默认 0.3 秒);说明每个动画显式声明起点 `from`/`0%` 和终点 `to`/`100%`,缺少边界时产生校验错误
- [ ] 7.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 7.3 补充迁移说明，覆盖旧顶层 transform config 的移除，Entity motion 绑定统一使用 `animation`

## 8. 验证与跨端验收

- [ ] 8.1 严格按 TDD 顺序执行实现：每组行为先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [ ] 8.2 运行 React/Core 定向单测,覆盖 tuple、binding、归一化、能力检测、callback、`entityProps`、ownership 和 `api.set` 命令发起
- [ ] 8.3 运行 Bridge contract 与集成测试,确认 Core、visionOS、picoOS 对创建/控制 payload、状态事件和错误码的编解码一致
- [ ] 8.4 在 visionOS 运行百分比多关键帧、稀疏字段、完整姿态 sequence、fresh play、delay、loop、pause/resume、stop/reset/finish/set、控制器级清理、保持其它 Entity 和子节点动画运行、终态提交和销毁清理验收
- [ ] 8.5 在 picoOS 运行与 8.4 相同的 fixtures 和验收矩阵
- [ ] 8.6 对照两端的 action 顺序、confirmed values、终态 transform、错误结果和 replay 行为,记录并解决跨端差异
- [ ] 8.7 执行端到端回归,覆盖动画终态、active set 以及 Entity motion Spec 定义的 target 销毁生命周期和错误行为
- [ ] 8.8 在 visionOS/picoOS 分别测量递增 Entity 并发下的 fresh-play 编译耗时、播放帧稳定性、内存占用和销毁回收,记录代表性规模结果与发布验收结论
- [ ] 8.9 建立 Design-to-Tasks 对照表,确认每个 Native 类、JSB 协议、编译规则、控制时序、错误路径和性能折中都有实现与验证任务
- [ ] 8.10 完成提案与实现对照复核后,归档或正式替代 `add-entity-transform-animation`
