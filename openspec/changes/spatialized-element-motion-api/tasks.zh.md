# 任务 — spatialized-element-motion-api 目标态

本任务列表描述 native-first spatialized element animation 的目标态 OpenSpec 工作。它有意省略早期 motion/controller 设计中的历史实现 phase。

## Phase 1 — OpenSpec 目标态对齐

- [x] Core spec：定义 spatialized element animation 的 native-first `AnimationObject : SpatialObject` 架构
- [x] Core spec：定义 `SpatializedElement.createAnimation(config)` 和 `CreateSpatializedElementAnimation`
- [x] Core spec：定义 `ControlSpatializedElementAnimation`，覆盖 `play`、`pause`、`resume`、`stop`、`reset`、`finish`、`destroy`
- [x] Core spec：定义 `SpatialAnimationStateChanged` 作为 native state / error / terminal-value 事件
- [x] Core spec：定义 create 时锁定 timeline 的语义
- [x] Core spec：定义 config 变化必须 destroy + recreate，而不是原地修改 timeline
- [x] Core spec：移除目标态对旧 controller / backend / Web RAF / old motion command 执行路径的依赖
- [x] Core spec：定义 element animating mask 作为目标态字段所有权机制
- [x] Core spec：保留 `from`/`to`、`timeline`、`tracks` 的 authoring 兼容性
- [x] Core spec：保留既有 playback API 和 terminal callback 语义

## Phase 2 — Runtime capability delta

- [x] 新增 `runtime-capabilities` delta：`supports('useAnimation', ['element'])`
- [x] 新增 `runtime-capabilities` delta：`supports('useAnimation', ['static3d'])`
- [x] 新增 `runtime-capabilities` delta：`supports('useAnimation', ['dynamic3d'])`
- [x] 文档化纯 Web runtime 对所有 spatialized element animation target token 返回 `false`
- [x] 文档化具体目标检查 MUST 使用 target sub-token；`supports('useAnimation')` 仅保留 family 级语义

## Phase 3 — 目标特定 spec 对齐

- [x] 2D spec：要求 native-first `AnimationObject` target path，且无 Web RAF fallback
- [x] 2D spec：要求 native create 携带 canonical tracks
- [x] 2D spec：用 element animating mask wording 替换旧字段所有权表述
- [x] Static3D spec：要求 model-root transform timeline 通过 `AnimationObject` 执行
- [x] Static3D spec：在 `validateSpatializedMotionConfig` 阶段拒绝 `opacity` tracks，不得静默忽略
- [x] Dynamic3D spec：要求 container transform / opacity timeline 通过 `AnimationObject` 执行
- [x] Entity spec 边界：entity animation 继续独立于 container `AnimationObject`

## Phase 4 — Design 对齐

- [x] 描述 React `AnimationBinding`：`useAnimation(config)` 时创建，负责 bind 前命令排队和 bind 后创建 Core `AnimationObject`
- [x] 描述 Core `AnimationObject extends SpatialObject`：直接暴露播放方法、继承 `destroy()`、直接订阅 NativeWebMsg
- [x] 描述 `SpatialAnimationStateChanged` 是 NativeWebMsg payload，而不是独立 Core 架构对象
- [x] 描述 visionOS `SpatializedElementAnimationManager`：负责 native animation lifecycle、create/control lookup、element destroy 级联清理、mask 协调和 WebMsg 广播
- [x] 描述 `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` 是 visionOS JSB command 入口
- [x] 描述 `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` 是 native object store，不新增独立 `SpatialObjectRegistry`
- [x] 描述 `SpatialScene` / `spatialWebViewModel` 现有 WebMsg 发送路径承载 `SpatialAnimationStateChanged`，不新增独立 emitter
- [x] 描述 `ElementAnimationWriteAdapter` 由 Native `AnimationObject.tick()` 调用，不由 manager 逐属性写入
- [x] 描述 target kind 到 writable fields / mask fields 的映射
- [x] 描述 playback controls 复用同一个 `AnimationObject`，`reset/finish` 不重建对象
- [x] 描述 element destroy 会级联销毁关联 `AnimationObject`
- [x] 描述 element animating mask，以及 `pause/stop/reset/finish/natural completion/destroy` 的 terminal ownership handoff
- [x] 保持 terminal callback 语义不变：`onComplete`、`onStop`、`onReset` 互斥；`onError` 独立
- [x] 保持双语 `design.md` / `design.zh.md` 对齐

## Phase 5 — Compatibility preservation tests

- [x] 测试：保留 React-facing `api` 上的 `play` / `pause` / `resume` / `stop` / `reset` / `finish` API shape
- [x] 测试：验证 `pause()` 与 `resume()` 不接受 keys 或 partial selectors
- [x] 测试：验证 `stop()` 冻结当前值、设置 `playState=idle`、设置 `finished=false`，并触发 `onStop(values)`
- [x] 测试：验证 `reset()` emit `from` 值、设置 `playState=idle`、设置 `finished=false`，并触发 `onReset(values)`
- [x] 测试：验证 `finish()` 在 native 终态确认后 emit `to` 值、设置 `playState=finished`、设置 `finished=true`，并触发 `onComplete(values)`
- [x] 测试：验证自然结束触发 `onComplete(values)`
- [x] 测试：验证 `idle.reset()` 不是 no-op，仍 emit `from` 值
- [x] 测试：验证绑定前显式 `finish()` 会保持排队，直到 native-backed `AnimationObject` 存在后 flush 并进入 `finished`
- [x] 测试：验证每次终止中 `onComplete`、`onStop`、`onReset` 互斥，同时 `onError` 保持独立
- [x] 测试：验证 `autoStart: false` 时，绑定前显式 `api.play()` 仍会在绑定后执行
- [x] 测试：验证一个 `animation` binding 同一时刻只能绑定一个组件
- [x] 校验测试：create 前拒绝 Static3D `opacity` tracks；不得静默忽略
- [x] Capability 测试：验证 `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])` target tokens 和纯 Web `false` 行为

## Phase 6 — Implementation invariants spec

- [x] 新增 `spatialized-animation-object-invariants` spec，明确 native uuid 是 `AnimationObject` identity 的唯一权威来源
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 `CreateSpatializedElementAnimation` response 以 `{ id }` 返回 native `AnimationObject` uuid
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 playback controls 复用同一个 native `AnimationObject`
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 `AnimationObject.destroy()` MUST 使用继承自 `SpatialObject` 的 destroy 生命周期
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 Core SDK MUST 暴露 `SpatializedElement.createAnimation(config)` 返回的一等 `AnimationObject`
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 Core `AnimationObject` MUST 直接订阅 NativeWebMsg 并按 uuid 过滤 `SpatialAnimationStateChanged`
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 element animating mask 由 native `SpatializedElement` runtime 或 write adapter 持有，MUST NOT 依赖 `PortalInstanceObject`
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 target kind 到 writable fields / mask fields 的映射
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 terminal mask handoff 规则
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 React SDK 只在 `xr-animation` binding 解析到具体 target 后创建 native-backed `AnimationObject`
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 visionOS runtime 通过 `SpatializedElementAnimationManager` 管理 native `AnimationObject` 生命周期
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 element destroy 必须级联销毁关联 animations
- [x] 新增 `spatialized-animation-object-invariants` spec，明确 native frame loop 生命周期由 manager 持有
- [x] 新增 `spatialized-animation-object-invariants` spec，明确纯 Web runtime 不提供 Core RAF fallback

## Phase 7 — Design architecture details

- [x] Design：记录 React / Core / visionOS 三包职责
- [x] Design：记录三包合并类图
- [x] Design：记录 create、bind 前显式 play、frame sampling、mask conflict、config change / destroy 时序
- [x] Design：记录 visionOS 复用现有 `SpatialScene.setupJSBListeners()` 作为 JSB 入口
- [x] Design：记录 visionOS 复用现有 `SpatialScene.spatialObjects` 作为 native object store
- [x] Design：记录 `{ id }` create response、playback object reuse、target fields、mask handoff 和 element destroy cascading
- [x] Design：记录现有 visionOS motion 实现的直接复用、改造复用和废弃项

## Phase 8 — Core SDK AnimationObject

- [x] Core：新增 `SpatializedElement.createAnimation(config)`
- [x] Core：发送 `CreateSpatializedElementAnimation`，并把 native 返回的 `{ id }` 包装成 `AnimationObject`
- [x] Core：实现 `AnimationObject extends SpatialObject`
- [x] Core：暴露 `AnimationObject.uuid`
- [x] Core：直接在同一个 `AnimationObject` 上实现 `play/pause/resume/stop/reset/finish`
- [x] Core：确保 `reset/finish` 不重建 native `AnimationObject`
- [x] Core：确保 `AnimationObject.destroy()` 使用继承自 `SpatialObject` 的 destroy 生命周期
- [x] Core：让 `AnimationObject` 直接订阅 NativeWebMsg
- [x] Core：让 `AnimationObject` 按 uuid 过滤 `SpatialAnimationStateChanged`
- [x] Core：让 `AnimationObject` 从 native event 更新 `playState/isAnimating/isPaused/finished`
- [x] Core：让 `AnimationObject` 状态变化通知 React subscribers
- [x] Core：避免新增公开 `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` 架构对象
- [x] Core：从 spatialized element animation 路径移除 `WebPlaybackBackend` 和 RAF sampling
- [x] Core：移除目标态对 `SpatializedMotionController`、`NativePlaybackBackend`、`AnimateSpatializedElementMotion` 的运行时依赖

## Phase 9 — React SDK AnimationBinding

- [x] React：在 `useAnimation(config)` 时创建 `AnimationBinding`
- [x] React：保留 `[animation, api, style]` 公开 API
- [x] React：在 `AnimationBinding` 中保存 config 和 normalized config signature
- [x] React：在 `AnimationBinding` 中排队 bind 前 `api.play/pause/resume/stop/reset/finish` 显式命令
- [x] React：仅在 `xr-animation` binding 解析 target 后创建 Core `AnimationObject`
- [x] React：Core `AnimationObject` 创建后 flush 已排队显式命令
- [x] React：`PlaybackApi` 订阅 Core `AnimationObject` 状态并同步 `playState/isAnimating/isPaused/finished`
- [x] React：确保 `autoStart: false` 只禁止 implicit play-on-bind，不丢弃显式排队命令
- [x] React：在 unmount / unbind 时 destroy 当前 `AnimationObject`
- [x] React：normalized config signature 变化时 destroy 并 recreate `AnimationObject`
- [x] React：保持 Static3D / Dynamic3D 的 `style` 为 `{}`
- [x] React：确保 `style` outlet 不作为 native-backed animation 的 playback source
- [x] React：纯 Web runtime 不实现 Web RAF fallback

## Phase 10 — visionOS AnimationObject manager and mask

- [x] visionOS：新增 `SpatializedElementAnimationManager`
- [x] visionOS：manager 持有 `animationId -> NativeAnimationObject` lookup
- [x] visionOS：manager 处理 `CreateSpatializedElementAnimation` 并返回 `{ id }`
- [x] visionOS：manager 处理 `ControlSpatializedElementAnimation`
- [x] visionOS：manager 处理 `destroyAnimation(animationId)`
- [x] visionOS：manager 处理 `destroyAnimationsForElement(elementId)`，并进入每个 animation object 的 destroy lifecycle
- [x] visionOS：在 `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` 中注册 create/control animation command
- [x] visionOS：通过现有 `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` 注册和查找 native `AnimationObject`
- [x] visionOS：Native `AnimationObject` 继承 `SpatialObject`
- [x] visionOS：Native `AnimationObject` 持有 locked `TimelineSampler`
- [x] visionOS：Native `AnimationObject` 持有 playback state 和 per-frame `tick`
- [x] visionOS：Native `AnimationObject` 的 `reset/finish` 复用同一个对象，不重建
- [x] visionOS：Native `AnimationObject.tick()` 调用 target write adapter 写入 sample
- [x] visionOS：target write adapter 按 target kind 限制 writable fields 和 mask fields
- [x] visionOS：Static3D 只写 `modelTransform`，不写 host transform / opacity
- [x] visionOS：实现 terminal mask handoff：pause 保留 mask；stop/reset/finish/natural complete/destroy 释放 mask
- [x] visionOS：通过现有 `SpatialScene` / `spatialWebViewModel` WebMsg 路径发送 `SpatialAnimationStateChanged`
- [x] visionOS：复用 `SpatializedElementMotionTimelineSampler` / `SpatializedMotionTimingFunction` / `SpatializedMotionTransformComponents`
- [x] visionOS：将 `SpatializedElementMotionTransformAdapter` 重构为 target write adapter
- [x] visionOS：将 timing 字段和状态算法迁移到 Native `AnimationObject`
- [x] visionOS：将 `SpatializedElementMotionManager` 重构为 object manager，复用 shared frame driver 和 terminal value 构造逻辑
- [x] visionOS：用 `CreateSpatializedElementAnimation` / `ControlSpatializedElementAnimation` 替换 `AnimateSpatializedElementMotion`
- [x] visionOS：用统一 `SpatialAnimationStateChanged` 替换旧 `${animationId}_completed/canceled/failed` WebMsg
- [x] visionOS：animating mask 位于 `SpatializedElement` runtime 或 target write adapter
- [x] visionOS：mask 判断不依赖 `PortalInstanceObject`
- [x] Tests：验证普通 transform update 不会覆盖 active animation transform
- [x] Tests：验证普通 opacity update 不会覆盖 active animation opacity

## Phase 11 — Protocol and compatibility tests

- [x] JSB test：`CreateSpatializedElementAnimation` 返回 native 生成的 uuid，字段名为 `id`
- [x] JSB test：`ControlSpatializedElementAnimation` 支持 play/pause/resume/stop/reset/finish
- [x] JSB test：`reset/finish` 不重建 native `AnimationObject`，object id 保持不变
- [x] WebMsg test：`SpatialAnimationStateChanged` 能被匹配的 Core `AnimationObject` 直接接收并按 uuid 过滤
- [x] Test：React `PlaybackApi` 在 Core `AnimationObject` 状态变化后更新
- [x] Test：Core `AnimationObject.destroy()` 使用通用 spatial object destroy path
- [x] Test：不需要公开 `AnimationObjectChannel` / `AnimationObjectBridge` / `SpatialObjectBridge` 架构对象
- [x] Test：不新增独立 `SpatialObjectRegistry`，native object lookup 复用 `SpatialScene.spatialObjects`
- [x] Test：不新增独立 `JSBCommandHandler`，command listener 复用 `SpatialScene.setupJSBListeners()`
- [x] Test：不新增独立 `NativeWebMsgEmitter`，WebMsg 发送复用现有 SpatialScene 路径
- [x] Test：visionOS manager 在 target element destroy 时销毁关联 animations
- [x] Test：stop 冻结当前值并触发 `onStop(values)`，随后释放 mask
- [x] Test：reset 发出 from 值并触发 `onReset(values)`，随后释放 mask
- [x] Test：finish 发出 to 值并触发 `onComplete(values)`，随后释放 mask
- [x] Test：pause 保留当前值并保留 mask
- [x] Test：native state 对 Core SDK state 具有权威性
- [x] Test：Static3D opacity tracks 在 native create 前被拒绝
- [x] Test：Static3D animation 只写 `modelTransform`
- [x] Test：纯 Web runtime 对 `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])` 返回 false
- [x] Test：目标态 runtime 不再使用旧 `AnimateSpatializedElementMotion` 路径

## Phase 12 — Docs and demos follow-up

- [x] 更新仓库内 proposal / API 文档，确保目标态文案不再描述已移除的 Controller / Web RAF / `AnimateSpatializedElementMotion` 路径
- [ ] 实现落地后更新 demos 和公开文档
- [ ] 实现落地后更新 PR 描述，避免继续宣称旧 Controller/Web RAF 路径是目标态实现