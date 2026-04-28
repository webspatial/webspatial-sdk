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

#### Scenario: animation 对象禁止多实体复用

- **GIVEN** 同一个 `animation` 对象已经绑定到某个实体
- **WHEN** 应用尝试将该 `animation` 对象绑定到第二个实体
- **THEN** SDK MUST 立即抛错
- **AND** 抛错时机 MUST 在第二个实体尝试绑定 `animation` prop 时，而不是延迟到 `autoStart` 或 `api.play()`

#### Scenario: 同一实体替换或移除 animation prop

- **GIVEN** 某个实体已经绑定 `animationA`，且可能存在 active session
- **WHEN** 该实体在后续渲染中将 `animation` prop 替换为 `animationB`，或将 `animation` prop 移除
- **THEN** SDK MUST 先停止 `animationA` 对应的会话（若存在），并触发 `animationA` 的 `onStop`
- **AND** 若 `animationB` 存在且其 `autoStart` 为 `true`（或省略），SDK MUST 在停止旧会话后启动 `animationB` 对应的新会话，并触发 `animationB` 的 `onStart`
- **AND** 旧会话的 `onStop` MUST 在新会话的 `onStart` 之前触发

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
- **WHEN** 调用 `api.play()`（或 autoStart 触发时）
- **THEN** native 层 MUST 在此刻快照实体当前 transform，作为每个被动画控制字段的起始状态
- **AND** 快照 MUST 不得早于该播放请求时刻（包括 hook 创建时或实体挂载时提前获取）
- **AND** `delay` MUST 只影响视觉运动开始时机，不得改变起始快照时机

---

### Requirement: 定义旋转单位与插值方式

#### Scenario: rotation 值使用角度

- **WHEN** 动画配置指定 `rotation` 值
- **THEN** SDK MUST 将其解释为**角度制**（degrees）的欧拉角，而非弧度

#### Scenario: rotation 插值使用最短路径四元数 SLERP

- **WHEN** native 层对 rotation 进行插值
- **THEN** MUST 使用四元数 SLERP 的最短路径
- **AND** 单轴超过 180° 的旋转在一次动画段中 MAY 产生非预期结果（最短路径行为）— 这是第一版的已知限制

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

#### Scenario: delay 期间暂停

- **GIVEN** 动画配置设置了正数 `delay`，且播放已请求
- **WHEN** 应用代码在 delay 期间调用 `api.pause()`
- **THEN** 剩余 delay 时间 MUST 被保留
- **AND** 当 `api.resume()` 被调用时，delay MUST 从暂停处继续，而不是从完整 delay 时长重新开始

#### Scenario: delay 期间 stop

- **GIVEN** 动画会话处于 delay 阶段
- **WHEN** 应用调用 `api.stop()`
- **THEN** `onStop` MUST 触发一次
- **AND** `onStop` MUST 收到 stop 时刻实体当前 transform 状态

---

#### Scenario: reset 方式的无限循环

- **GIVEN** 动画配置将 `loop` 设置为 `true`
- **WHEN** 播放到达目标状态
- **THEN** 动画 MUST 重置到 `from` 状态（若省略 `from` 则为初始状态），重新向 `to` 播放，无限重复，不应在单次循环后结束
- **AND** 当省略 `from` 时，“初始状态”MUST 指该会话第一次 `play` 时刻的起始快照，不得在每轮循环重新快照

#### Scenario: reverse 方式的无限循环

- **GIVEN** 动画配置将 `loop` 设置为 `{ reverse: true }`
- **WHEN** 播放到达任一端点
- **THEN** 下一轮 MUST 在 `from` 与 `to` 之间反向播放

#### Scenario: 非法动画配置

- **GIVEN** 应用代码传入非法动画配置，例如缺少 transform 目标或不支持的 loop 结构
- **WHEN** SDK 在播放前校验配置
- **THEN** SDK MUST 直接抛错，而不是静默忽略该非法配置

#### Scenario: 时序参数校验

SDK MUST 在校验时强制以下范围，违反时抛错：

| 字段 | 合法范围 | 说明 |
|---|---|---|
| `duration` | `> 0`，有限值 | `0`、负数、`NaN`、`Infinity` MUST 被拒绝 |
| `delay` | `>= 0`，有限值 | 负数、`NaN`、`Infinity` MUST 被拒绝 |
| `timingFunction` | `'linear'`、`'easeIn'`、`'easeOut'`、`'easeInOut'` 之一 | 其他字符串 MUST 被拒绝 |
| `loop` | `true`、`false`、`undefined` 或 `{ reverse?: boolean }` | 其他结构 MUST 被拒绝 |

---

### Requirement: 定义 isAnimating 状态语义

`api.isAnimating` MUST 按以下模型反映动画会话状态：

| 状态 | `isAnimating` | 说明 |
|---|---|---|
| idle | `false` | 无会话，或会话已结束 |
| delaying | `true` | 已调用 `play()`，delay 期间，视觉运动尚未开始 |
| running | `true` | 视觉运动进行中 |
| paused | `false` | 通过 `api.pause()` 暂停 |

本规范中的 active session MUST 包含 `delaying`、`running` 与 `paused`。

#### Scenario: delay 期间 isAnimating

- **GIVEN** 动画配置设置了正数 `delay`
- **WHEN** 调用 `api.play()` 且 delay 期间
- **THEN** `api.isAnimating` MUST 为 `true`

#### Scenario: pause 后 isAnimating

- **GIVEN** 动画会话处于 running 或 delaying 状态
- **WHEN** 调用 `api.pause()`
- **THEN** `api.isAnimating` MUST 为 `false`

#### Scenario: stop 或自然完成后 isAnimating

- **WHEN** 动画会话通过 `api.stop()` 或自然完成结束
- **THEN** `api.isAnimating` MUST 在任何生命周期回调触发前为 `false`

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

#### Scenario: config 变更仅影响下次 play

- **GIVEN** 应用在 React re-render 中更新了传入 `useAnimation(config)` 的 `config`
- **WHEN** 当前会话处于 `delaying`、`running` 或 `paused`
- **THEN** 当前会话 MUST 不受该变更影响
- **AND** 下一次 `api.play()` MUST 使用最新的 `config`

#### Scenario: 自然完成回调

- **WHEN** 一个非循环动画自然播放结束
- **THEN** 配置的 `onComplete` MUST 收到来自播放结果的实体最终 transform 状态

#### Scenario: stop 回调

- **WHEN** 应用调用 `api.stop()`
- **THEN** 配置的 `onStop` MUST 收到 stop 时刻实体当前 transform 状态

#### Scenario: 生命周期回调次数与互斥

- **WHEN** `api.play()` 启动一个动画会话
- **THEN** `onStart` MUST 对该会话至多触发一次
- **AND** 该会话结束时，`onComplete` 与 `onStop` MUST 互斥，且各自 MUST 对该会话至多触发一次

#### Scenario: 非法状态下的控制方法为 no-op

- **GIVEN** 当前不存在 active session
- **WHEN** 应用调用 `api.pause()`、`api.resume()` 或 `api.stop()`
- **THEN** 这些调用 MUST 为 no-op（不抛错、不触发生命周期回调、不发送 native 命令）

#### Scenario: 已有 active session 时调用 play

- **GIVEN** 一个动画会话已经处于 active 状态（`delaying`、`running` 或 `paused`）
- **WHEN** 应用代码再次调用 `api.play()`
- **THEN** SDK MUST 先停止已有会话，再用当前配置启动新会话
- **AND** 前一个会话的 `onStop` 回调 MUST 在新会话的 `onStart` 之前触发

#### Scenario: 每次 play 生成新的会话 id

- **WHEN** `api.play()` 启动一个新的动画会话
- **THEN** SDK MUST 为该会话生成一个新的全局唯一 `animationId`
- **AND** 后续对该会话的 `pause`、`resume`、`stop` MUST 作用于该 `animationId` 对应的会话

---

#### Scenario: 不支持的 runtime warning

- **GIVEN** `supports('useAnimation')` 为 `false`
- **WHEN** 应用代码仍尝试使用 `useAnimation`
- **THEN** SDK MUST 给出 warning，说明当前 runtime 不支持实体 Transform 动画
- **AND** warning MUST 对每个 hook 实例至多触发一次
- **AND** SDK MUST 不得为这次请求启动 Native 播放

#### Scenario: 不支持 runtime 下的 API 行为

- **GIVEN** `supports('useAnimation')` 为 `false`
- **WHEN** 应用代码调用 `api.play()`
- **THEN** 该调用 MUST 为 no-op（不抛错、不发送 native 命令）
- **AND** `onStart`、`onComplete`、`onStop` MUST 不被触发
- **AND** `api.isAnimating` MUST 保持 `false`

#### Scenario: Native 或 bridge 失败时抛错

- **GIVEN** `supports('useAnimation')` 为 `true`
- **WHEN** SDK 在执行播放命令时收到来自 Native 或 JSBridge 的失败结果
- **THEN** SDK MUST 抛错以暴露该失败
- **AND** SDK MUST 不得将会话推进到 active 状态

---

### Requirement: 播放期间避免 transform 更新竞争

当动画会话控制某个 transform 字段时，SDK MUST 避免对该字段发送会与动画竞争的常规 transform 更新。

#### Scenario: 动画字段与非动画字段共存

- **GIVEN** 一个动画会话控制 `position`
- **WHEN** 在会话 active 期间 React 触发实体 re-render
- **THEN** SDK MUST 抑制该会话对应的常规 `position` transform 同步
- **AND** 未被动画控制的字段如 `rotation` 或 `scale` MUST 继续按现有路径正常更新
- **AND** 对被抑制字段在会话期间接收到的最新 props 值 MAY 被缓存，用于抑制解除后的恢复同步

#### Scenario: 动画结束后释放抑制

- **GIVEN** 一个动画会话正在控制 `position`
- **WHEN** 动画会话通过自然完成或 `api.stop()` 结束
- **THEN** SDK MUST 在触发生命周期回调之前释放对 `position` 的抑制
- **AND** 对 `position` 的常规 transform 同步 MUST 在回调之后的下一个 React 渲染周期恢复，并以该渲染周期中的最新 props 值为准

#### Scenario: stop 保持 stop 点的 transform

- **GIVEN** 一个动画会话处于 active 状态且实体正在播放中间态
- **WHEN** 应用调用 `api.stop()`
- **THEN** 实体 MUST 保持在当前播放中间态（stop 点）
- **AND** 实体 MUST 不得跳转到 `from` 或 `to`

---

### Requirement: 卸载时清理动画

#### Scenario: 动画 active 期间实体卸载

- **GIVEN** 动画会话处于任意活跃状态（delaying、running 或 paused）
- **WHEN** 实体组件卸载
- **THEN** SDK MUST 停止 native 动画会话并释放相关资源
- **AND** 生命周期回调（`onStop`、`onComplete`）MUST 不得在卸载后触发

#### Scenario: delay 期间实体卸载

- **GIVEN** 动画会话处于 delay 阶段
- **WHEN** 实体组件卸载
- **THEN** SDK MUST 取消待执行的动画，不得启动视觉运动
- **AND** 不得触发任何生命周期回调