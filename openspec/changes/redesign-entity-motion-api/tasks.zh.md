## 1. 提案对齐

- [ ] 1.1 复核旧的 `add-entity-transform-animation` 文档，明确哪些行为会被新的目标态替代
- [ ] 1.2 复核 `spatialized-element-motion-api` 中对 Entity motion 的引用，统一措辞到“新 Entity 提案是权威目标态”
- [ ] 1.3 从本提案的文档契约和保留 sub-token 中移除 `supports('useEntityAnimation', ['entity'])`；`spatialized-element-motion-api` 的相关措辞另行协调，不在本提案修改批次中直接改动

## 2. 类型与契约重设计

- [ ] 2.1 先编写失败测试,覆盖新的 `useEntityAnimation` 返回三元组 `[animation, api, entityProps]`、公开 playback surface(`play`、`pause`、`stop`、`reset`、`finish`)以及只接受 `EntityMotionPatch` object 的 `api.set`
- [ ] 2.2 先编写失败测试,覆盖 `position` / `rotation` / `scale` authoring、顶层 `from` / `to`、`timeline.from` / `timeline.to`、百分比关键帧、起止边界必填、边界帧内部字段稀疏、旧 config 拒绝和 `opacity` 等不支持目标
- [ ] 2.3 重设计 Core 和 React 类型面,实现上述 Entity motion config、transform-only callback values、playback API 与写入侧 `EntityMotionPatch`

## 3. Entity 绑定迁移

- [ ] 3.1 先编写失败测试，证明 Entity motion 通过 `animation` 属性绑定
- [ ] 3.1a 先编写失败测试，证明绑定完成后 React Binding 调用 `SpatialEntity.createAnimation(config)`，且不直接调用 `AnimationObject.create(...)` 或构造内部规范时间轴 payload
- [ ] 3.2 更新 Entity props 契约与 binding 生命周期，切换到新的 Entity motion 绑定路径
- [ ] 3.2a 在 Core 为 `SpatialEntity` 实现 `createAnimation(config)`，由它封装自身空间对象 id、Entity 专属归一化与校验，并把规范时间轴委托给通用 `AnimationObject` 创建流程
- [ ] 3.3 保留单绑定不变量，保证同一个 animation object 不能驱动多个 Entity 实例
- [ ] 3.4 在文档中把 `animation` 作为 Entity motion 的绑定方式
- [ ] 3.5 删除 JS 侧旧 entity-transform-animation 遗留，包括 suppression 机制 `animation.__getSuppressedFields` 与 suppression 释放后 base props 重同步路径，确保不存在能与 native 竞争的第二个 transform 源

## 4. Playback、Outlet 与 Core 归一化

- [ ] 4.1 先编写失败测试,覆盖 `entityProps` 在 start、complete、stop、reset、finish 和 Native 接受 `api.set(values)` 后的更新,无逐帧 React 更新,callback values 只含 Entity transform 字段,且 callback 返回值不驱动终态
- [ ] 4.2 实现 React/Core 状态事件消费、callback 分发和 `entityProps` 已提交 transform 持久化,保持 Native confirmed state 单向流动
- [ ] 4.3 先编写失败测试,覆盖公开 playback API 与整 transform ownership:`api.set` 只接受 sparse patch object,未绑定或原生动画对象创建前的 set 为 no-op,动画活跃期间的 React transform 写入 / set 不暂存、不覆盖动画且不更新 `entityProps`,终态填充不 snap 回退
- [ ] 4.4 实现 React/Core playback API、JSB 命令发起和 outlet ownership 路由;Native 的 set 合并、状态机与终态提交由第 5 节实现
- [ ] 4.5 先编写失败测试,覆盖 `normalizeEntityMotionConfig` 对顶层 `from` / `to`、`timeline.from` / `timeline.to` 和百分比关键帧的等价折叠、`timeline` 优先告警、默认 0.3 秒 duration、起止边界必填、同帧重复拒绝、属性白名单与字段级稀疏保留
- [ ] 4.6 在 Core 实现归一化与校验,保持现有 `EntityMotionTimelinePayload` 和创建命令 wire shape 兼容;Native 对该 payload 的编译与执行由第 5 节实现

## 5. Native 与 Bridge 实现

- [ ] 5.1 先编写失败的 Bridge contract 测试,覆盖创建/控制命令 payload、`set` values、`EntityMotionStateChangedMsg` detail/action/playState/values/error、Design 定义的封闭错误码集合以及 Core 与两端 Native 编解码一致性
- [ ] 5.2 实现 Core/Native Bridge 类型、`EntityMotionBridgeTypes` 编解码和 handler 注册,复用 `CreateSpatializedElementAnimationJSBCommand`、`ControlSpatializedElementAnimationJSBCommand` 与 `spatialanimationstatechanged`
- [ ] 5.3 先编写失败的目标分发与生命周期测试,覆盖 `elementId` 查询、element/entity/unsupported 分发、`TARGET_NOT_FOUND`、`UNSUPPORTED_TARGET`、动画注册/查找/显式 destroy、Entity target 先销毁、清理、销毁后 no-op 以及竞态返回 `ANIMATION_NOT_FOUND`
- [ ] 5.4 在两端 Native 实现 `SpatialScene` Entity 分发及通过全局 spatial objects 完成生命周期级联,保持 `EntityMotionManager` 只负责创建,由 `EntityMotionAnimationObject` 持有状态、资源并完成清理
- [ ] 5.5 先编写失败的 timeline compiler 单元测试,覆盖属性/时间/缩放校验、关键帧时间并集、稀疏通道按本轮 baseline 补全、通道插值、每个切点完整姿态、逐段缓动优先级、旋转输入转换、被接管分量计算和无法表达段的显式失败
- [ ] 5.6 在两端 Native 实现 `EntityMotionTimelineCompiler`、`EntityMotionTiming` 与 `EntityMotionTransformValues`,产出按时间排序的完整姿态段及 confirmed transform 拆解/稀疏补丁合并能力
- [ ] 5.7 先编写失败的 visionOS 集成测试,覆盖 RealityKit 整 `.transform` 绑定、多段完整姿态资源、`AnimationResource.sequence`、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
- [ ] 5.8 实现 visionOS RealityKit 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [ ] 5.9 先编写失败的 picoOS 集成测试,使用与 visionOS 相同的规范时间轴 fixtures 覆盖整 transform 绑定、多段完整姿态 sequence、旋转转换、四种缓动、delay、playback rate、loop 和编译失败
- [ ] 5.10 实现 picoOS 完整姿态分段 sequence 编译、播放控制器接入和平台参数映射
- [ ] 5.11 先编写失败的 fresh-play 状态测试,覆盖首次 `play` / `autoStart`、complete/finish/stop/reset 后 replay 读取最新 baseline 并重新编译,pause 后 play 恢复当前控制器,单次播放内 loop 复用当前资源,编译失败保持非活跃
- [ ] 5.12 在 `EntityMotionManager` 与 `EntityMotionAnimationObject` 中实现 fresh play、delay/running/paused 状态转换、resume、loop 资源复用和命令失败回执
- [ ] 5.13 先编写失败的控制与事件测试,覆盖 play/start/complete/pause/stop/reset/finish/destroy/set/error action、stop 当前姿态、reset 起始姿态、finish/complete 终态、非活跃 set 稀疏合并、活跃 set no-op + warning、confirmed values 裁剪以及 `entityProps`/callback 映射
- [ ] 5.14 实现完整控制状态机、终态零时长提交、confirmed transform 读取/拆解、状态事件编码与发送,确保 active set 不触发 `onError` 且失败命令不改变姿态

## 6. Capability 与校验

- [ ] 6.1 先编写失败测试，覆盖使用 `supports('useEntityAnimation')` 检测 Entity motion 的目标态契约
- [ ] 6.2 先编写失败测试，覆盖不支持的 Entity motion target 和非法 transform authoring 的显式校验失败
- [ ] 6.3 更新 runtime capability 与校验实现行为，使之匹配新的目标态契约

## 7. 文档、Demo 与迁移

- [ ] 7.1 更新 Entity motion 文档与示例，统一使用 `position` / `rotation` / `scale` config、`animation`、`entityProps` 和只接受 patch object 的 `api.set`,并说明不提供裸 `api.get`:读取通过 `entityProps`,写入通过 `api.set(values)`;补充顶层 `from` / `to` 最简写法及其规则(与 `timeline.from` / `timeline.to` 等价、`timeline` 优先、纯顶层默认 0.3 秒);并说明每个动画都必须写起止两端(起点 `from`/`0%`、终点 `to`/`100%`,缺端报错,不再从当前姿态隐式起播)
- [ ] 7.2 更新 `apps/test-server` 中的 Entity animation demo 与 capability 页面到新的目标态 API
- [ ] 7.3 补充迁移说明，覆盖旧顶层 transform config 的移除，Entity motion 绑定统一使用 `animation`

## 8. 验证与跨端验收

- [ ] 8.1 严格按 TDD 顺序执行实现：每组行为先写失败测试，再做最小实现使其通过，最后在测试持续通过前提下重构
- [ ] 8.2 运行 React/Core 定向单测,覆盖 tuple、binding、归一化、能力检测、callback、`entityProps`、ownership 和 `api.set` 命令发起
- [ ] 8.3 运行 Bridge contract 与集成测试,确认 Core、visionOS、picoOS 对创建/控制 payload、状态事件和错误码的编解码一致
- [ ] 8.4 在 visionOS 运行百分比多关键帧、稀疏字段、完整姿态 sequence、fresh play、delay、loop、pause/resume、stop/reset/finish/set、终态提交和销毁清理验收
- [ ] 8.5 在 picoOS 运行与 8.4 相同的 fixtures 和验收矩阵
- [ ] 8.6 对照两端的 action 顺序、confirmed values、终态 transform、错误结果和 replay 行为,记录并解决跨端差异
- [ ] 8.7 执行端到端回归,覆盖动画终态、active set 以及 Entity motion Spec 定义的 target 销毁生命周期和错误行为
- [ ] 8.8 在 visionOS/picoOS 分别测量递增 Entity 并发下的 fresh-play 编译耗时、播放帧稳定性、内存占用和销毁回收,记录代表性规模结果与发布验收结论
- [ ] 8.9 建立 Design-to-Tasks 对照表,确认每个 Native 类、JSB 协议、编译规则、控制时序、错误路径和性能折中都有实现与验证任务
- [ ] 8.10 完成提案与实现对照复核后,归档或正式替代 `add-entity-transform-animation`
