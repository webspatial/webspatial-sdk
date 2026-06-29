# 空间化 AnimationObject 实现不变量

## 新增需求

### Requirement: AnimationObject identity 由 native 持有

`SpatializedElement.createAnimation(config)` MUST 先创建 native `AnimationObject`，再返回一个指向同一 native object identity 的 Core SDK `AnimationObject` handle。

Core SDK MAY 使用临时 request id 匹配异步 create response，但 MUST NOT 将 JavaScript 生成的 id 作为最终 object identity。

`CreateSpatializedElementAnimation` response MUST 以 `id` 字段返回 native object identity。Core SDK MUST 用该返回值建立对应的 `AnimationObject`。

#### Scenario: Native 返回 animation identity

- **WHEN** Core SDK 调用 `SpatializedElement.createAnimation(config)`
- **THEN** native MUST 创建 `AnimationObject : SpatialObject`
- **AND** native MUST 生成 object identity
- **AND** native create response MUST 返回 `{ id }`
- **AND** Core SDK MUST 返回指向同一对象的 `AnimationObject` handle

### Requirement: AnimationObject 销毁走通用 SpatialObject 生命周期

`AnimationObject.destroy()` MUST 使用继承自 `SpatialObject` 的通用 destroy 生命周期。Runtime 清理 MUST 停止帧驱动、清除目标元素 animating mask、注销 listener，并从 `SpatialScene.spatialObjects` 等现有 native spatial object store 中移除该对象。

`ControlSpatializedElementAnimation` MUST NOT 成为唯一规范销毁路径。如果为了兼容保留 control-level `destroy` action，它 MUST 委托到通用 `SpatialObject.destroy()` 行为。

#### Scenario: 通过通用 object 生命周期销毁动画

- **WHEN** Core SDK 调用 `animationObject.destroy()`
- **THEN** SDK MUST 对该 animation object 分发通用 spatial object destroy 路径
- **AND** native MUST 使用与其他 `SpatialObject` 实例一致的生命周期清理 `AnimationObject`

### Requirement: Core SDK 暴露一等 AnimationObject

Core SDK MUST 暴露由 `SpatializedElement.createAnimation(config)` 返回的 imperative `AnimationObject` handle。该 handle MUST 直接提供 `play`、`pause`、`resume`、`stop`、`reset`、`finish`；`destroy` MUST 继承自 `SpatialObject`。

目标态 MUST NOT 要求公开的 `AnimationObjectChannel`、`AnimationObjectBridge` 或 `SpatialObjectBridge` 架构对象。底层 JSB/WebMsg 能力 MAY 作为 `SpatialObject` / `AnimationObject` 的实现细节存在。

React SDK MAY 继续暴露 `[animation, api, style]`；React-facing `api` 在 binding 后 MUST 代理到底层 Core SDK `AnimationObject`。

#### Scenario: Core imperative animation object

- **WHEN** Core SDK 用户调用 `element.createAnimation(config)`
- **THEN** 返回对象 MUST 是一等 `AnimationObject`
- **AND** MUST 暴露与 React-facing playback API 等价的播放控制方法
- **AND** MUST 通过继承的 `SpatialObject.destroy()` 参与销毁生命周期

### Requirement: 播放控制复用同一个 AnimationObject

`play`、`pause`、`resume`、`stop`、`reset` 和 `finish` MUST 作用于既有 native `AnimationObject`。这些播放控制 MUST NOT 重建 native `AnimationObject`，也 MUST NOT 改变该对象的 identity。

native object 重建 MUST 仅用于 config signature 变化、target 重新绑定、显式 destroy 后重新 create，或其他销毁/重建生命周期。`reset()` 和 `finish()` 是同一个 `AnimationObject` 上的 playback control，不是 destroy + recreate。

#### Scenario: reset 复用同一个 AnimationObject

- **GIVEN** Core SDK 已持有一个 `AnimationObject` handle
- **WHEN** 用户调用 `animation.reset()`
- **THEN** Core SDK MUST 发送 `ControlSpatializedElementAnimation(id, reset)`
- **AND** native MUST 在同一个 native `AnimationObject` 上写入 from value
- **AND** 同一 `AnimationObject` identity MUST 保持不变

#### Scenario: finish 复用同一个 AnimationObject

- **GIVEN** Core SDK 已持有一个 `AnimationObject` handle
- **WHEN** 用户调用 `animation.finish()`
- **THEN** Core SDK MUST 发送 `ControlSpatializedElementAnimation(id, finish)`
- **AND** native MUST 在同一个 native `AnimationObject` 上写入 to value
- **AND** 同一 `AnimationObject` identity MUST 保持不变

### Requirement: NativeWebMsg 直接驱动 Core AnimationObject 状态

`SpatialAnimationStateChanged` MUST 被建模为 NativeWebMsg event payload，而不是独立的 Core SDK 架构对象。Core SDK `AnimationObject` MUST 直接订阅 NativeWebMsg，按自身 object identity 过滤 `SpatialAnimationStateChanged`，并更新自身 `playState`、`isAnimating`、`isPaused`、`finished`。

Native `AnimationObject` MUST 持有 playback state。Core SDK MAY 在 native ack 前保留 pending command state，但收到 `SpatialAnimationStateChanged` 后 MUST 与 native 状态对齐。Core SDK MUST NOT 在没有 native 状态确认的情况下，自行完成、暂停、finish 或 reset 一个 native-backed animation。

#### Scenario: Core AnimationObject 直接接收 NativeWebMsg

- **WHEN** native 发送 `SpatialAnimationStateChanged(animationId, action, playState, values?)`
- **THEN** Core SDK `AnimationObject` MUST 按自身 object identity 过滤事件
- **AND** 匹配时 MUST 更新该 `AnimationObject` 自身状态
- **AND** React-facing `api` 状态 MUST 通过订阅该 `AnimationObject` 状态变化而更新

### Requirement: Element animating mask 由 SpatializedElement runtime 持有

animation-owned 字段 mask MUST 由 native `SpatializedElement` runtime 或目标特定 write adapter 维护。它 MUST NOT 依赖 `PortalInstanceObject` 作为状态源。

当某个字段被标记为 animation-owned 时，常规 JSB 更新，例如 `UpdateSpatializedElementTransform`，MUST NOT 覆盖该字段。终态控制权切换时，mask MUST 按 terminal value 规则清除或更新。

#### Scenario: active animation 期间忽略普通 transform update

- **GIVEN** 一个 `AnimationObject` 正在动画化目标 transform
- **WHEN** Core SDK 对同一个 `SpatializedElement` 发送普通 transform update
- **THEN** native MUST 根据 animating mask 忽略或延迟冲突的 transform 字段
- **AND** 该判断 MUST NOT 需要查询 `PortalInstanceObject`

### Requirement: target kind 决定 writable fields 和 mask fields

native runtime MUST 按 target kind 限制 animation 可写字段和 mask 字段：

| target kind | writable fields | mask fields |
|-------------|-----------------|-------------|
| `spatialized2d` | `transform`, `opacity` | `transform`, `opacity` |
| `dynamic3d` | `transform`, `opacity` | `transform`, `opacity` |
| `static3d` | `modelTransform` | `modelTransform` |

Static3D `opacity` tracks MUST 在 native create 前被拒绝。Static3D animation MUST NOT 写 host element `transform` 作为 `modelTransform` 的替代路径。

#### Scenario: Static3D 只写 modelTransform

- **GIVEN** target kind 是 `static3d`
- **WHEN** native `AnimationObject.tick(timestamp)` 产生 sample
- **THEN** native MUST 只写入 model root `modelTransform`
- **AND** MUST NOT 写入 host element transform 或 opacity

### Requirement: terminal mask handoff 规则明确

native runtime MUST 按 playback action 明确处理 animation-owned mask：

| action | value write | mask handoff |
|--------|-------------|--------------|
| `pause` | 保留当前 sampled value | 保留 mask，因为 animation 仍拥有该视觉字段 |
| `stop` | 写入当前 sampled value | 释放本 animation 拥有的 mask fields |
| `reset` | 写入 from value | 释放本 animation 拥有的 mask fields |
| `finish` | 写入 to value | 释放本 animation 拥有的 mask fields |
| natural completion | 写入 to value | 释放本 animation 拥有的 mask fields |
| `destroy` | 不额外强制写入终态；清理 animation | 释放本 animation 拥有的 mask fields |

如果多个 animation 同时竞争同一字段，runtime MAY 进一步维护 owner token 或最后写入策略，但普通 element sync MUST NOT 覆盖仍被 active animation 拥有的字段。

#### Scenario: pause 保留 mask

- **GIVEN** 一个 animation 正在拥有 target transform mask
- **WHEN** 用户调用 `pause()`
- **THEN** native MUST 保留该 animation 对 transform 的 ownership
- **AND** 普通 transform update MUST NOT 覆盖 paused animation 的当前视觉值

#### Scenario: reset 释放 mask

- **GIVEN** 一个 animation 正在拥有 target transform mask
- **WHEN** 用户调用 `reset()`
- **THEN** native MUST 写入 from value
- **AND** native MUST 释放该 animation 拥有的 transform mask

### Requirement: React AnimationBinding 创建 native-backed AnimationObject

React SDK MUST 在 `useAnimation(config)` 调用时创建 `AnimationBinding`，但 MUST NOT 在该时刻创建 native-backed `AnimationObject`。Native object creation MUST happen only after the `xr-animation` binding resolves a concrete `SpatializedElement` target.

如果用户在 bind 前调用 `api.play()`、`api.pause()`、`api.resume()`、`api.stop()`、`api.reset()` 或 `api.finish()`，React SDK MUST 通过 `AnimationBinding` 记录这些显式命令，并在 native-backed `AnimationObject` 创建完成后按语义 flush。`autoStart: false` MUST 只禁止 implicit play-on-bind，不得丢弃显式排队命令。

#### Scenario: bind 后创建并 flush 显式命令

- **GIVEN** `useAnimation(config)` 已返回 `[animation, api, style]`
- **AND** 应用在目标 bind 前调用了 `api.play()`
- **WHEN** `animation` 通过 `xr-animation` 绑定到具体 `SpatializedElement`
- **THEN** React SDK MUST 调用 `SpatializedElement.createAnimation(config)`
- **AND** native 返回创建出的 animation identity 后 MUST flush 已排队的显式 `play` 命令

### Requirement: visionOS runtime 管理 native AnimationObject 生命周期

visionOS runtime MUST 通过 `SpatializedElementAnimationManager` 管理 native `AnimationObject` 实例。该 manager MUST 负责 create/control lookup、animation registry、target element destroy 级联清理、animating mask 协调，以及 `SpatialAnimationStateChanged` 发送。

Native `AnimationObject` MUST 继承 `SpatialObject`，MUST 持有 locked timeline sampler 和 playback state，并 MUST 负责单个 animation 的 play/pause/resume/stop/reset/finish/tick 行为。

当 target `SpatializedElement` 被销毁时，native runtime MUST 在 element cleanup 前或过程中销毁所有指向该 element 的 native `AnimationObject`。`destroyAnimationsForElement(elementId)` MUST 进入每个 animation object 的 destroy lifecycle，MUST NOT 只从 manager lookup 中删除对象。

#### Scenario: Element destroy 级联销毁关联动画

- **WHEN** 一个 `SpatializedElement` 被 destroy
- **THEN** visionOS runtime MUST 通过 `SpatializedElementAnimationManager.destroyAnimationsForElement(elementId)` 销毁关联的 native `AnimationObject`
- **AND** 每个被销毁 animation MUST 清理 frame driver、animating mask、listener 和 registry entry
- **AND** 每个被销毁 animation MUST 从 `SpatialScene.spatialObjects` 等 native spatial object store 中移除

### Requirement: Native frame loop 生命周期由 manager 持有

native runtime MUST 将 frame loop 视为 `SpatializedElementAnimationManager` 的内部调度能力，可由 `CADisplayLink` 等平台 frame callback 实现。Frame driver MUST NOT 持有 animation 语义、target element 语义或 WebMsg 发送职责。

`SpatializedElementAnimationManager` MUST 在至少一个 native `AnimationObject` 进入 `running` 时启动 frame loop，包括 `play` 和 `resume`。`CreateSpatializedElementAnimation` 只创建 native `AnimationObject` 并锁定 timeline；除非随后发生 implicit play-on-bind 或 flush bind 前显式 `play`，create 本身 MUST NOT 启动 frame sampling。

`SpatializedElementAnimationManager` MUST 在 `pause`、`stop`、`reset`、`finish`、`destroy`、自然完成、`destroyAnimationsForElement`、scene/page cleanup 后检查是否可以停止 frame loop。当不存在 running native `AnimationObject` 时，frame loop MUST 停止。

#### Scenario: play 启动 frame loop

- **WHEN** `SpatializedElementAnimationManager` 处理 `ControlSpatializedElementAnimation(play)`
- **AND** 对应 native `AnimationObject` 进入 `running`
- **THEN** manager MUST 启动 frame loop
- **AND** 每帧 MUST 由 frame callback 回调 `manager.tickAll(timestamp)`

#### Scenario: 无 running animation 时停止 frame loop

- **WHEN** `pause`、`stop`、`reset`、`finish`、`destroy` 或自然完成后没有 native `AnimationObject` 仍处于 `running`
- **THEN** manager MUST 停止 frame loop

### Requirement: 纯 Web runtime 不提供 Core RAF fallback

Core SDK target-state spatialized element animation MUST NOT include Web RAF playback fallback. If the runtime lacks native `AnimationObject` support for a target token, `supports('useAnimation', [targetToken])` MUST return `false` and SDK MUST NOT run a JS RAF sampler for that target.

#### Scenario: native animation object 不可用

- **WHEN** runtime 没有 native `AnimationObject` 支持
- **THEN** spatialized element animation target capability MUST 为 `false`
- **AND** Core SDK MUST NOT start Web RAF playback as fallback