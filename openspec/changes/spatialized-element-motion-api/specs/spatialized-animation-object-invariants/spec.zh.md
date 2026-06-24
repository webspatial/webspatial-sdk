# 空间化 AnimationObject 实现不变量

## 新增需求

### Requirement: AnimationObject identity 由 native 持有

`SpatializedElement.createAnimation(config)` MUST 先创建 native `AnimationObject`，再返回 Core SDK 的 `AnimationObject` handle；该 handle 的 `uuid` MUST 来自 native 生成的 object identity。

Core SDK MAY 使用临时 request id 匹配异步 create response，但 MUST NOT 将 JavaScript 生成的 id 作为最终 `AnimationObject.uuid`。

#### Scenario: Native 返回 animation uuid

- **WHEN** Core SDK 调用 `SpatializedElement.createAnimation(config)`
- **THEN** native MUST 创建 `AnimationObject : SpatialObject`
- **AND** native MUST 生成 object uuid
- **AND** Core SDK MUST 在返回的 `AnimationObject` handle 上暴露该 uuid

### Requirement: AnimationObject 销毁走通用 SpatialObject 生命周期

`AnimationObject.destroy()` MUST 进入通用 `SpatialObject` destroy 生命周期。Runtime 清理 MUST 停止帧驱动、清除目标元素 animating mask、注销 listener，并从 native spatial object registry 中移除该对象。

`ControlSpatializedElementAnimation` MUST NOT 成为唯一规范销毁路径。如果为了兼容保留 control-level `destroy` action，它 MUST 委托到通用 `SpatialObject.destroy()` 行为。

#### Scenario: 通过通用 object 生命周期销毁动画

- **WHEN** Core SDK 调用 `animationObject.destroy()`
- **THEN** SDK MUST 对 animation uuid 分发通用 spatial object destroy 路径
- **AND** native MUST 使用与其他 `SpatialObject` 实例一致的生命周期清理 `AnimationObject`

### Requirement: Core SDK 暴露 AnimationObject handle

Core SDK MUST 暴露由 `SpatializedElement.createAnimation(config)` 返回的 imperative `AnimationObject` handle。该 handle MUST 包含 native uuid，并且 MUST 提供 `play`、`pause`、`resume`、`stop`、`reset`、`finish`、`destroy`。

React SDK MAY 继续暴露 `[animation, api, style]`；React-facing `api` 在 binding 后 MUST 代理到底层 Core SDK `AnimationObject`。

#### Scenario: Core imperative animation object

- **WHEN** Core SDK 用户调用 `element.createAnimation(config)`
- **THEN** 返回对象 MUST 暴露 `uuid`
- **AND** MUST 暴露与 React-facing playback API 等价的播放控制方法

### Requirement: Native playback state 是权威状态

Native `AnimationObject` MUST 持有 playback state。Core SDK 的 `playState`、`isAnimating`、`isPaused`、`finished` MUST 从 `SpatialAnimationStateChanged` 事件投影得到。

Core SDK MAY 在 native ack 前保留 pending command state，但收到 `SpatialAnimationStateChanged` 后 MUST 与 native 状态对齐。Core SDK MUST NOT 在没有 native 状态确认的情况下，自行完成、暂停、finish 或 reset 一个 native-backed animation。

#### Scenario: 从 WebMsg 投影状态

- **WHEN** native 广播 `SpatialAnimationStateChanged(animationId, action, playState, values?)`
- **THEN** Core SDK MUST 根据该消息更新匹配的 `AnimationObject` 状态
- **AND** React-facing `api` 状态 MUST 反映 Core SDK 的投影状态

### Requirement: Element animating mask 由 SpatializedElement runtime 持有

animation-owned 字段 mask MUST 由 native `SpatializedElement` runtime 或目标特定 write adapter 维护。它 MUST NOT 依赖 `PortalInstanceObject` 作为状态源。

当某个字段被标记为 animation-owned 时，常规 JSB 更新，例如 `UpdateSpatializedElementTransform`，MUST NOT 覆盖该字段。终态控制权切换时，mask MUST 按 terminal value 规则清除或更新。

#### Scenario: active animation 期间忽略普通 transform update

- **GIVEN** 一个 `AnimationObject` 正在动画化目标 transform
- **WHEN** Core SDK 对同一个 `SpatializedElement` 发送普通 transform update
- **THEN** native MUST 根据 animating mask 忽略或延迟冲突的 transform 字段
- **AND** 该判断 MUST NOT 需要查询 `PortalInstanceObject`

### Requirement: React binding 创建 native AnimationObject

React SDK MUST NOT 在 `useAnimation(config)` 调用时创建 native `AnimationObject`。Native object creation MUST happen only after the `xr-animation` binding resolves a concrete `SpatializedElement` target.

如果用户在 bind 前调用 `api.play()`、`api.pause()`、`api.resume()`、`api.stop()`、`api.reset()` 或 `api.finish()`，React SDK MUST 通过 proxy 记录这些显式命令，并在 native `AnimationObject` 创建完成后按语义 flush。`autoStart: false` MUST 只禁止 implicit play-on-bind，不得丢弃显式排队命令。

#### Scenario: bind 后创建并 flush 显式命令

- **GIVEN** `useAnimation(config)` 已返回 `[animation, api, style]`
- **AND** 应用在目标 bind 前调用了 `api.play()`
- **WHEN** `animation` 通过 `xr-animation` 绑定到具体 `SpatializedElement`
- **THEN** React SDK MUST 调用 `SpatializedElement.createAnimation(config)`
- **AND** native 返回 `AnimationObject.uuid` 后 MUST flush 已排队的显式 `play` 命令

### Requirement: 纯 Web runtime 不提供 Core RAF fallback

Core SDK target-state spatialized element animation MUST NOT include Web RAF playback fallback. If the runtime lacks native `AnimationObject` bridge support for a target token, `supports('useAnimation', [targetToken])` MUST return `false` and SDK MUST NOT run a JS RAF sampler for that target.

#### Scenario: native bridge 不可用

- **WHEN** runtime 没有 native `AnimationObject` bridge
- **THEN** spatialized element animation target capability MUST 为 `false`
- **AND** Core SDK MUST NOT start Web RAF playback as fallback
