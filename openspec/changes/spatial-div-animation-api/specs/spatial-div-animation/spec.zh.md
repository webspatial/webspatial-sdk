## 新增需求

### Requirement: 提供 SpatialDiv 动画 API

SDK MUST 提供 `SpatialDiv` 动画 API，由 React `useAnimation(config)` Hook、可传给空间化 HTML 节点的 `animation` prop，以及用于控制动画会话的命令式播放对象组成。

#### Scenario: Hook 返回结构

- **WHEN** 应用代码调用用于 `SpatialDiv` 的 `useAnimation(config)`
- **THEN** Hook MUST 返回二元组 `[animation, api]`
- **AND** `api` MUST 暴露 `play`、`pause`、`resume`、`stop`、`isAnimating`、`isPaused`

#### Scenario: animation prop 绑定 SpatialDiv

- **WHEN** 应用将返回的 `animation` 对象传给带有 `enable-xr` 的空间化 HTML 节点
- **THEN** SDK MUST 将该对象作为 `SpatialDiv` 动画输入
- **AND** 应用代码 MUST NOT 需要把动画字段直接并入普通 `style` 或 DOM props

#### Scenario: animation 仅对空间化 HTML 节点生效

- **WHEN** 应用将 `animation` 对象传给未开启 `enable-xr` 的普通 DOM 节点
- **THEN** SDK MUST 给出 warning
- **AND** SDK MUST NOT 启动 native 播放

#### Scenario: animation 对象禁止多元素复用

- **GIVEN** 同一个 `animation` 对象已经绑定到某个 `SpatialDiv`
- **WHEN** 应用尝试将该对象绑定到第二个 `SpatialDiv`
- **THEN** SDK MUST 立即抛错
- **AND** 抛错时机 MUST 在第二个元素尝试绑定 `animation` prop 时，而不是延迟到 `autoStart` 或 `api.play()`

#### Scenario: 替换或移除 animation prop

- **GIVEN** 某个 `SpatialDiv` 已绑定 `animationA`，且可能存在 alive 会话
- **WHEN** 后续 render 将该元素的 `animation` prop 替换为 `animationB`，或移除 `animation` prop
- **THEN** SDK MUST 先停止 `animationA` 的会话（如有），并调用 `animationA` 的 `onStop`
- **AND** 若 `animationB` 存在且其 `autoStart` 为 `true`（或未设置），SDK MUST 在停止旧会话后为 `animationB` 启动新会话，并调用 `animationB` 的 `onStart`
- **AND** 旧会话的 `onStop` MUST 在新会话的 `onStart` 之前触发
- **AND** 旧会话的 stop 命令 MUST 在新会话的 play 命令之前发送至 native bridge

#### Scenario: Entity 与 SpatialDiv 的 animation 对象不可互换

- **GIVEN** `useAnimation` 根据 `config.to` 的 key 集合返回了一个带有内部类型标记的 `animation` 对象
- **WHEN** 应用将 entity 类型的 animation 对象绑定到 `SpatialDiv`，或将 SpatialDiv 类型的 animation 对象绑定到 entity 组件
- **THEN** SDK MUST 立即抛错

---

### Requirement: 仅支持白名单属性动画

`SpatialDiv` 动画 MUST 仅支持以下白名单字段：`back`、`transform.translate.x`、`transform.translate.y`、`transform.translate.z`、`opacity`、`depth`、`width`、`height`。

#### Scenario: 支持白名单字段子集

- **GIVEN** 动画配置只包含一个或多个白名单字段
- **WHEN** SDK 校验并播放该配置
- **THEN** SDK MUST 仅控制这些被声明的字段
- **AND** 未声明的字段 MUST 继续走现有普通同步路径

#### Scenario: transform 仅表示平移分量

- **WHEN** 动画配置包含 `transform`
- **THEN** SDK MUST 仅接受 `translate: { x, y, z }` 结构中的三个平移分量
- **AND** SDK MUST NOT 将其解释为任意 CSS transform 字符串、旋转、缩放或矩阵插值

#### Scenario: width 和 height 的语义

- **WHEN** 动画配置包含 `width` 或 `height`
- **THEN** SDK MUST 将其解释为对 native `SpatialDiv` 尺寸的直接覆盖
- **AND** SDK MUST NOT 自动改写 DOM 元素的 CSS 布局尺寸

#### Scenario: 不支持的动画字段

- **GIVEN** 应用代码传入白名单之外的字段，例如 `backgroundMaterial`、`cornerRadius`、`color` 或任意未知字段
- **WHEN** SDK 在播放前校验配置
- **THEN** SDK MUST 直接抛错
- **AND** SDK MUST NOT 静默忽略这些字段

#### Scenario: Entity key 与 SpatialDiv key 不可混用

- **GIVEN** 应用代码在 `to` 中同时传入了 entity key（`position`、`rotation`、`scale`）和 SpatialDiv key（`back`、`transform`、`opacity`、`depth`、`width`、`height`）
- **WHEN** SDK 校验配置
- **THEN** SDK MUST 直接抛错

---

### Requirement: 校验 SpatialDiv 动画配置

SDK MUST 在播放前校验 `SpatialDiv` 动画配置中的数值和结构，非法输入 MUST 直接抛错。

#### Scenario: 时序参数校验

SDK MUST 在校验时对以下范围抛错：

| 字段 | 合法范围 | 说明 |
|---|---|---|
| `duration` | `> 0`，有限值 | `0`、负数、`NaN`、`Infinity` MUST 被拒绝。默认值：`0.3` |
| `delay` | `>= 0`，有限值 | 负数、`NaN`、`Infinity` MUST 被拒绝 |
| `timingFunction` | `'linear'`、`'easeIn'`、`'easeOut'`、`'easeInOut'` 之一 | 其他字符串 MUST 被拒绝 |
| `loop` | `true`、`false`、`undefined`、`{ reverse?: boolean }` | 其他结构 MUST 被拒绝 |

#### Scenario: 白名单数值校验

SDK MUST 在校验时对以下范围抛错：

| 字段 | 合法范围 | 说明 |
|---|---|---|
| `back` | 有限值 | `NaN`、`Infinity` MUST 被拒绝 |
| `depth` | 有限值 | `NaN`、`Infinity` MUST 被拒绝 |
| `transform.translate.x/y/z` | 有限值 | `NaN`、`Infinity` MUST 被拒绝 |
| `width` | `>= 0`，有限值 | 负数、`NaN`、`Infinity` MUST 被拒绝 |
| `height` | `>= 0`，有限值 | 负数、`NaN`、`Infinity` MUST 被拒绝 |
| `opacity` | `[0, 1]` 闭区间，有限值 | 超出 `[0, 1]`、`NaN`、`Infinity` MUST 被拒绝 |

#### Scenario: 缺少动画目标

- **WHEN** `to` 中未声明任何白名单字段
- **THEN** SDK MUST 直接抛错

---

### Requirement: 定义 isAnimating / isPaused 状态语义

会话处于以下任一状态时为 **alive**：queued、delaying、running、paused。会话为 idle（无会话或会话已结束）时为 **not alive**。`isAnimating` 反映会话是否正在积极推进，`isPaused` 反映会话是否被冻结但仍然 alive。

`api.isAnimating` 和 `api.isPaused` MUST 按以下模型反映动画会话状态：

| 状态 | `isAnimating` | `isPaused` | 描述 |
|---|---|---|---|
| idle | `false` | `false` | 无会话，或会话已结束 |
| queued | `true` | `false` | `play()` 在元素绑定前调用，等待绑定 |
| delaying | `true` | `false` | `play()` 已调用，delay 期间，视觉动效尚未开始 |
| running | `true` | `false` | 视觉动效进行中 |
| paused | `false` | `true` | 会话已通过 `api.pause()` 暂停 |

会话存在（alive）当且仅当 `isAnimating || isPaused` 为 `true`。`pause()`、`resume()`、`stop()` 在 `!isAnimating && !isPaused`（即无 alive 会话）时为 no-op。

#### Scenario: delay 期间 isAnimating 为 true

- **GIVEN** 动画配置设置了正数 `delay`
- **WHEN** `api.play()` 被调用且 delay 期间活跃
- **THEN** `api.isAnimating` MUST 为 `true`

#### Scenario: pause 后 isAnimating 为 false

- **GIVEN** 动画会话处于 running 或 delaying
- **WHEN** `api.pause()` 被调用
- **THEN** `api.isAnimating` MUST 为 `false`
- **AND** `api.isPaused` MUST 为 `true`

#### Scenario: stop 或自然完成后 isAnimating 为 false

- **WHEN** 动画会话通过 `api.stop()` 或自然完成结束
- **THEN** `api.isAnimating` MUST 在任何生命周期回调触发之前变为 `false`
- **AND** `api.isPaused` MUST 为 `false`

---

### Requirement: 提供播放控制和生命周期

播放 API MUST 允许应用启动、暂停、恢复、停止 `SpatialDiv` 动画会话，并 MUST 提供 `onStart`、`onComplete`、`onStop`、`onError` 生命周期。

#### Scenario: 默认自动播放

- **GIVEN** 动画配置未设置 `autoStart`
- **WHEN** 目标 `SpatialDiv` 完成绑定
- **THEN** 播放 MUST 自动开始

#### Scenario: 手动开始

- **GIVEN** 动画配置将 `autoStart` 设置为 `false`
- **WHEN** 目标 `SpatialDiv` 完成绑定
- **THEN** 播放 MUST 保持空闲，直到 `api.play()` 被调用

#### Scenario: 元素未绑定时调用 play

- **GIVEN** `SpatialDiv` 尚未完成 native 绑定
- **WHEN** 应用调用 `api.play()`
- **THEN** SDK MUST 将该请求置于 queued 状态
- **AND** 在绑定完成后按调用顺序执行
- **AND** 若 `from` 被省略，起始快照 MUST 以实际执行播放时刻的当前值为准
- **AND** `delay` MUST 仅影响视觉动效何时开始，MUST NOT 改变起始快照的采集时机
- **AND** 快照 MUST 仅覆盖 `to` 中声明的字段；`to` 中未出现的字段 MUST NOT 被快照或被动画会话影响
- **AND** `api.isAnimating` MUST 在请求排队期间为 `true`
- **AND** 排队 play 使用的 config MUST 为 `play()` 调用时的 config，而非元素绑定时的 config
- **AND** 若排队期间调用 `api.stop()`，SDK MUST 取消排队的 play 并触发 `onStop`
- **AND** 若排队期间调用 `api.pause()`，元素绑定后会话 MUST 以 paused 状态建立

#### Scenario: 排队期间 pause 后元素绑定

- **GIVEN** `api.play()` 在元素绑定前已进入 queued 状态
- **AND** 应用在排队期间调用了 `api.pause()`
- **WHEN** 元素后续完成绑定，会话成功建立
- **THEN** 会话的首态 MUST 为 paused
- **AND** `onStart` MUST 为该会话调用一次
- **AND** `api.isPaused` MUST 为 `true`

#### Scenario: Start 回调

- **WHEN** `api.play()` 请求的动画会话成功建立，其首态为 delaying、running 或因 queued pause 导致的 paused
- **THEN** `onStart` MUST 为该会话调用一次
- **AND** 若请求仍处于 queued 状态（元素尚未绑定），`onStart` MUST NOT 提前触发
- **AND** 若请求在会话建立前失败，`onStart` MUST NOT 触发

#### Scenario: delay 期间暂停与恢复

- **GIVEN** 动画配置设置了正数 `delay`，且播放已请求
- **WHEN** 应用先调用 `api.pause()` 再调用 `api.resume()`
- **THEN** 剩余 delay 时间 MUST 被保留
- **AND** 恢复后 MUST 从暂停点继续，而不是重新开始完整 delay

#### Scenario: delay 期间暂停后 stop

- **GIVEN** 动画会话处于 delay 阶段
- **AND** 应用调用了 `api.pause()`
- **WHEN** 应用随后调用 `api.stop()`
- **THEN** `onStop` MUST 触发一次
- **AND** `onStop` MUST 收到元素在 stop 时刻的当前状态值

#### Scenario: delay 期间直接 stop

- **GIVEN** 动画会话处于 delay 阶段
- **WHEN** 应用调用 `api.stop()`
- **THEN** `onStop` MUST 触发一次
- **AND** `onStop` MUST 收到元素在 stop 时刻的当前状态值

#### Scenario: reset 方式循环

- **GIVEN** 动画配置将 `loop` 设置为 `true`，或设置为 `{}` / `{ reverse: false }`
- **WHEN** 动画到达目标状态
- **THEN** 动画 MUST 瞬时重置到 `from` 状态并重新播放
- **AND** 当 `from` 省略时，"初始状态"MUST 为会话首次 `play` 时刻的起始快照，MUST NOT 在每轮循环时重新快照
- **AND** 从 `to` 回到 `from` 的重置 MUST 是瞬时的，不带缓动或过渡

#### Scenario: reverse 方式循环

- **GIVEN** 动画配置将 `loop` 设置为 `{ reverse: true }`
- **WHEN** 动画到达任一端点
- **THEN** 下一轮 MUST 在 `from` 与 `to` 之间反向播放

#### Scenario: 自然完成回调

- **WHEN** 非循环动画自然结束
- **THEN** `onComplete` MUST 收到 native 侧最终值
- **AND** 返回的 `SpatialDivAnimatedValues` MUST 仅包含 `to` 中声明的字段对应的终态值；`to` 中未声明的字段 MUST NOT 出现在返回值中

#### Scenario: 停止回调

- **WHEN** 应用调用 `api.stop()`
- **THEN** `onStop` MUST 收到 native 侧 stop 点值
- **AND** 返回的 `SpatialDivAnimatedValues` MUST 仅包含 `to` 中声明的字段对应的 stop 点值；`to` 中未声明的字段 MUST NOT 出现在返回值中

#### Scenario: 回调互斥与计数

- **WHEN** `api.play()` 启动一个动画会话
- **THEN** `onStart` MUST 对该会话至多调用一次
- **AND** 会话结束时，`onComplete` 与 `onStop` MUST 互斥，各自对该会话至多调用一次

#### Scenario: 异步失败回调

- **WHEN** bridge 或 native 的 `play`、`pause`、`resume`、`stop` 命令异步失败
- **THEN** SDK MUST 调用 `onError`，传入包含 `animationId`、`command`、`reason` 的 `AnimationError`
- **AND** 若未配置 `onError`，SDK MUST 通过 `console.error` 输出错误

#### Scenario: onError 计数与与其他回调的关系

- **WHEN** 异步 bridge 或 native 命令失败
- **THEN** `onError` MUST 对该失败命令至多调用一次
- **AND** 若失败命令是 `play`，`onStart`、`onComplete`、`onStop` MUST NOT 被调用
- **AND** 若失败命令是 `pause`、`resume`、`stop`，该失败本身 MUST NOT 触发 `onComplete` 或 `onStop`

#### Scenario: Config 更新不影响 alive 会话

- **GIVEN** 应用在 React re-render 中更新了传给 `useAnimation(config)` 的 config
- **WHEN** 当前会话处于 delaying、running 或 paused
- **THEN** 当前会话 MUST NOT 受 config 更新影响
- **AND** 下一次 `api.play()` MUST 使用最新的 config

#### Scenario: alive 会话存在时再次调用 play

- **GIVEN** 动画会话已处于 alive（queued、delaying、running 或 paused）
- **WHEN** 应用再次调用 `api.play()`
- **THEN** SDK MUST 先停止现有会话，再用当前 config 启动新会话
- **AND** 前一个会话的 `onStop` MUST 在新会话的 `onStart` 之前触发
- **AND** 前一个会话的 `onStop` 触发时 `api.isAnimating` MUST 为 `false`，新会话的 `onStart` 触发时 `api.isAnimating` MUST 为 `true`

#### Scenario: 每次 play 生成新的会话 id

- **WHEN** `api.play()` 启动新的动画会话
- **THEN** SDK MUST 为该会话生成新的全局唯一 `animationId`
- **AND** 后续的 `pause`、`resume`、`stop` 调用 MUST 使用该 `animationId`

#### Scenario: stop-old 失败 MUST 阻止 start-new

- **GIVEN** SDK 正在执行 stop-old → start-new 流程
- **WHEN** 旧会话的 stop 命令异步失败
- **THEN** SDK MUST 调用 `onError`
- **AND** 旧会话 MUST 保持失败前状态
- **AND** SDK MUST NOT 启动新会话
- **AND** 新会话的 `onStart` MUST NOT 触发

#### Scenario: 串行化控制命令

- **GIVEN** hook 实例快速连续调用 `play`、`pause`、`resume`、`stop` 等控制方法
- **WHEN** SDK 向 native 层发送控制命令
- **THEN** SDK MUST 按调用顺序将这些命令发送至 native bridge，bridge MUST 按该顺序传递至 native

#### Scenario: 无 alive 会话时控制方法为 no-op

- **GIVEN** 不存在 alive 会话（`isAnimating` 为 `false` 且 `isPaused` 为 `false`）
- **WHEN** 应用调用 `api.pause()`、`api.resume()` 或 `api.stop()`
- **THEN** 该调用 MUST 为 no-op（不抛错，不触发生命周期回调，不发送 native 命令）

---

### Requirement: 播放期间避免与普通同步竞争

当动画会话控制某个 `SpatialDiv` 字段时，SDK MUST 避免对应字段的普通 DOM / computed-style 同步覆盖动画中间态。

#### Scenario: 属性级抑制

- **GIVEN** 一个动画会话控制 `back`、`opacity`、`depth`、`width` 或 `height` 中的任意字段
- **WHEN** `PortalInstanceObject` 在会话 alive 期间执行常规属性同步
- **THEN** SDK MUST 抑制这些字段的普通同步
- **AND** 其他未被动画控制的字段 MUST 继续按现有路径更新
- **AND** 被抑制字段收到的最新 prop 值 MUST 被缓存，用于抑制释放后恢复常规同步
- **AND** 缓存 MUST 按字段维护，在会话结束后的首次 React 渲染周期恢复常规同步时使用该渲染周期的最新 prop 值，缓存随后丢弃

#### Scenario: transform 整体抑制

- **GIVEN** 一个动画会话控制 `transform`
- **WHEN** 会话 alive 期间 React 继续产生普通 DOM transform 更新
- **THEN** SDK MUST 整体抑制常规 `updateTransform(matrix)` 同步
- **AND** 这些 transform 更新 MUST 在会话结束后的下一次 React 渲染周期恢复生效

#### Scenario: 抑制释放时机

- **GIVEN** 动画会话控制了某些字段
- **WHEN** 动画会话通过自然完成或 `api.stop()` 结束
- **THEN** SDK MUST 在生命周期回调触发之前释放这些字段的抑制标记
- **AND** 回调之后的下一次 React 渲染周期 MUST 恢复常规同步

#### Scenario: stop 保持 stop 点

- **GIVEN** 一个动画会话处于中间态
- **WHEN** 应用调用 `api.stop()`
- **THEN** `SpatialDiv` MUST 保持在 stop 点
- **AND** SDK MUST NOT 将其跳回 `from` 或直接跳到 `to`

#### Scenario: width 和 height 不自动回写 DOM

- **GIVEN** 一个动画会话控制 `width` 或 `height`
- **WHEN** 动画自然完成或被停止
- **THEN** native 终态尺寸 MUST 通过 `onComplete` 或 `onStop` 回传
- **AND** SDK MUST NOT 自动修改 DOM 元素的 CSS 布局尺寸

---

### Requirement: 不支持 runtime 下的行为

当 `supports('spatialDivAnimation')` 为 `false` 时，`SpatialDiv` 动画 API MUST 提供稳定且保守的 fallback 行为。

#### Scenario: 使用 hook 时给出 warning

- **GIVEN** `supports('spatialDivAnimation')` 为 `false`
- **WHEN** 应用仍尝试将 `useAnimation(config)` 用于 `SpatialDiv`
- **THEN** SDK MUST 给出 warning
- **AND** warning MUST 对每个 hook 实例至多触发一次

#### Scenario: 不支持 runtime 下 play 为 no-op

- **GIVEN** `supports('spatialDivAnimation')` 为 `false`
- **WHEN** 应用调用 `api.play()`
- **THEN** 该调用 MUST 为 no-op
- **AND** SDK MUST NOT 发送 native 命令
- **AND** `onStart`、`onComplete`、`onStop`、`onError` MUST 不被触发
- **AND** `api.isAnimating` MUST 保持 `false`

#### Scenario: 异步 bridge 或 native 在 play 时失败

- **GIVEN** `supports('spatialDivAnimation')` 为 `true`
- **WHEN** SDK 在执行 play 请求期间收到 native 或 JSBridge 的失败结果
- **THEN** SDK MUST 调用 `onError`，传入包含 `animationId`、命令类型和人类可读失败原因的 `AnimationError`
- **AND** 若未配置 `onError`，SDK MUST 通过 `console.error` 输出错误
- **AND** SDK MUST NOT 将会话转入 alive 状态
- **AND** 该 `animationId` 后续 MUST NOT 再收到 `_completed` 或 `_stopped`

#### Scenario: 异步 bridge 或 native 在 pause / resume / stop 时失败

- **GIVEN** `supports('spatialDivAnimation')` 为 `true`，且存在 alive 会话
- **WHEN** SDK 在执行 `pause`、`resume` 或 `stop` 期间收到 native 或 JSBridge 的失败结果
- **THEN** SDK MUST 调用 `onError`
- **AND** 若未配置 `onError`，SDK MUST 通过 `console.error` 输出错误
- **AND** 会话 MUST 保持失败前状态，允许应用重试或采取其他措施
- **AND** 该失败 MUST NOT 终止 alive 会话；`_completed` 或 `_stopped` 后续仍 MAY 到达

---

### Requirement: 卸载时清理动画会话

SDK MUST 在 `SpatialDiv` 卸载时停止或取消 alive 动画会话，并释放相关监听与资源。

#### Scenario: alive 会话期间元素卸载

- **GIVEN** 动画会话处于 queued、delaying、running 或 paused 状态
- **WHEN** 目标 `SpatialDiv` 卸载
- **THEN** SDK MUST 停止或取消对应会话
- **AND** 卸载后 MUST NOT 再触发 `onStart`、`onComplete`、`onStop`、`onError`

#### Scenario: delay 期间元素卸载

- **GIVEN** 动画会话处于 delay 阶段
- **WHEN** 目标 `SpatialDiv` 卸载
- **THEN** SDK MUST 取消待处理的动画，不启动视觉动效
- **AND** MUST NOT 触发任何生命周期回调
