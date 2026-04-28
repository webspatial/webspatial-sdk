## 新增需求

### Requirement: 提供实体 Transform 动画 API

SDK MUST 提供实体 Transform 动画 API，由 React `useAnimation(config)` Hook、实体 `animation` prop，以及用于控制动画会话的命令式播放对象组成。

#### Scenario: Hook 返回结构

- **WHEN** 应用代码调用 `useAnimation(config)`
- **THEN** Hook MUST 返回二元组 `[animation, api]`
- **AND** `api` MUST 暴露 `play`、`pause`、`resume`、`stop`、`isAnimating`

#### Scenario: 实体 animation prop

- **WHEN** 应用将返回的 `animation` 对象传给实体组件
- **THEN** 组件 MUST 将该对象作为 transform 播放的动画输入
- **AND** 动画契约 MUST 可用，且不需要把隐藏动画字段 spread 到实体普通 props 中

---

### Requirement: 支持 transform 字段子集动画

SDK MUST 支持对 `position`、`rotation`、`scale` 的动画控制，可单独或组合使用。

#### Scenario: 对 transform 字段子集做动画

- **GIVEN** 动画配置只包含一到两个 transform 字段
- **WHEN** 播放开始
- **THEN** 仅这些目标字段 MUST 由该动画会话控制
- **AND** 未被目标覆盖的字段 MUST 继续由实体普通 props 控制

#### Scenario: 省略 from

- **GIVEN** 动画配置省略 `from`
- **WHEN** 播放开始
- **THEN** 动画 MUST 从实体当前 transform 状态开始（针对每个被动画控制的字段）

---

### Requirement: 支持时序参数

动画配置 MUST 支持 `duration`、`timingFunction`、`delay`、`autoStart`、`loop`，其中 `loop` 接受 `true` 或 `{ reverse?: boolean }`。

#### Scenario: 默认自动播放

- **GIVEN** 动画配置未设置 `autoStart`
- **WHEN** 目标实体完成挂载并绑定
- **THEN** 播放 MUST 自动开始

#### Scenario: 手动开始

- **GIVEN** 动画配置将 `autoStart` 设置为 `false`
- **WHEN** 实体挂载完成
- **THEN** 播放 MUST 保持空闲，直到 `api.play()` 被调用

#### Scenario: 延迟播放

- **GIVEN** 动画配置设置了正数 `delay`
- **WHEN** 请求播放
- **THEN** 动画 MUST 等待该 delay 后才开始产生可见运动
- **AND** 播放会话 MUST 在 delay 期间仍可被控制

#### Scenario: reset 方式的无限循环

- **GIVEN** 动画配置将 `loop` 设置为 `true`
- **WHEN** 播放到达目标状态
- **THEN** 动画 MUST 继续重复，不应在单次循环后结束

#### Scenario: reverse 方式的无限循环

- **GIVEN** 动画配置将 `loop` 设置为 `{ reverse: true }`
- **WHEN** 播放到达任一端点
- **THEN** 下一轮 MUST 在 `from` 与 `to` 之间反向播放

#### Scenario: 非法动画配置

- **GIVEN** 应用代码传入非法动画配置，例如缺少 transform 目标、不支持的 loop 结构、或无效的时序参数
- **WHEN** SDK 在播放前校验配置
- **THEN** SDK MUST 直接抛错，而不是静默忽略该非法配置

---

### Requirement: 提供命令式播放生命周期

播放 API MUST 允许应用启动、暂停、恢复、停止动画会话，并 MUST 提供 start、自然完成、stop 的生命周期回调。

#### Scenario: onStart 回调

- **WHEN** `api.play()` 启动一个新的动画会话
- **THEN** 配置的 `onStart` MUST 对该会话触发一次

#### Scenario: pause 与 resume

- **GIVEN** 一个动画会话处于 active 状态
- **WHEN** 应用先调用 `api.pause()`，再调用 `api.resume()`
- **THEN** MUST 从暂停进度继续同一会话，而不是启动一个新会话

#### Scenario: 自然完成回调

- **WHEN** 一个非循环动画自然播放结束
- **THEN** 配置的 `onComplete` MUST 收到来自播放结果的实体最终 transform 状态

#### Scenario: stop 回调

- **WHEN** 应用调用 `api.stop()`
- **THEN** 配置的 `onStop` MUST 收到 stop 时刻实体当前 transform 状态

#### Scenario: 不支持的 runtime warning

- **GIVEN** `supports('useAnimation')` 为 `false`
- **WHEN** 应用代码仍尝试使用 `useAnimation`
- **THEN** SDK MUST 给出 warning，说明当前 runtime 不支持实体 Transform 动画
- **AND** SDK MUST 不得为这次请求启动 Native 播放

---

### Requirement: 播放期间避免 transform 更新竞争

当动画会话控制某个 transform 字段时，SDK MUST 避免对该字段发送会与动画竞争的常规 transform 更新。

#### Scenario: 动画字段与非动画字段共存

- **GIVEN** 一个动画会话控制 `position`
- **WHEN** 在会话 active 期间 React 触发实体 re-render
- **THEN** SDK MUST 抑制该会话对应的常规 `position` transform 同步
- **AND** 未被动画控制的字段如 `rotation` 或 `scale` MUST 继续按现有路径正常更新