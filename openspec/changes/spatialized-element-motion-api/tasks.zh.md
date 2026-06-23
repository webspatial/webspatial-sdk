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

- [x] 描述 React `AnimationProxy`
- [x] 描述 Core normalization、queued commands、playback state projection 和 object-channel lifecycle
- [x] 描述 create、control、state-changed events 之间的 JSB/WebMsg 拆分
- [x] 描述 native `AnimationObject` 对 locked timeline、playback state、terminal values、target-specific writes 的所有权
- [x] 描述 element animating mask，以及 `opacity` 和 host `transform` 的 terminal ownership handoff
- [x] 保持 terminal callback 语义不变：`onComplete`、`onStop`、`onReset` 互斥；`onError` 独立
- [x] 保持双语 `design.md` / `design.zh.md` 对齐

## Phase 5 — Compatibility preservation tests

- [x] 测试：保留 React-facing `api` 上的 `play` / `pause` / `resume` / `stop` / `reset` / `finish` API shape
- [x] 测试：验证 `pause()` 与 `resume()` 不接受 keys 或 partial selectors
- [x] 测试：验证 `stop()` 冻结当前值、设置 `playState=idle`、设置 `finished=false`，并触发 `onStop(values)`
- [x] 测试：验证 `reset()` emit `from` 值、设置 `playState=idle`、设置 `finished=false`，并触发 `onReset(values)`
- [x] 测试：验证 `finish()` emit `to` 值、设置 `playState=finished`、设置 `finished=true`，并触发 `onComplete(values)`
- [x] 测试：验证自然结束触发 `onComplete(values)`
- [x] 测试：验证 `idle.reset()` 不是 no-op，仍 emit `from` 值
- [x] 测试：验证 `idle.finish()` 不是 no-op，仍 emit `to` 值并进入 `finished`
- [x] 测试：验证每次终止中 `onComplete`、`onStop`、`onReset` 互斥，同时 `onError` 保持独立
- [x] 测试：验证 `autoStart: false` 时，绑定前显式 `api.play()` 仍会在绑定后执行
- [x] 测试：验证一个 `animation` binding 同一时刻只能绑定一个组件
- [x] 校验测试：create 前拒绝 Static3D `opacity` tracks；不得静默忽略
- [x] Capability 测试：验证 `supports('useAnimation', ['element' | 'static3d' | 'dynamic3d'])` target tokens 和纯 Web `false` 行为

## Phase 6 — Implementation follow-up

- [ ] 实现支持目标上的 `SpatializedElement.createAnimation(config)`
- [ ] 实现 native `AnimationObject : SpatialObject`
- [ ] 实现 `CreateSpatializedElementAnimation`、`ControlSpatializedElementAnimation`、`SpatialAnimationStateChanged`
- [ ] 在常规 element sync 中实现 element animating mask ownership
- [ ] 实现 normalized config 变化时 destroy + recreate
- [ ] 移除目标态运行时对旧 controller / backend / Web RAF / old motion command 执行路径的依赖
- [ ] 实现落地后更新 demos 和公开文档
