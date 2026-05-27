# SpatialDiv motion 原生 timeline 后端 Phase 2b

## 术语

- **WebSpatial runtime**：`supports('useAnimation', ['element']) === true`，即 visionOS 或 WebSpatial shell。该运行时上的播放必须只走**原生**后端；同一个 hook 实例上的 timeline 播放不得同时运行 Web RAF 后端。
- **Bound element**：通过 hook 返回的 `motion` 绑定，即 `__setElement`，附着到与 `style` 相同的 `enable-xr` 节点上的 `Spatialized2DElement`。
- **Queued session**：`api.play()` 发生在 bind 之前；元素可用后才开始原生播放。它**不是** Web motion 后端。
- **Web motion backend**：通过 RAF 关键帧求值驱动 `style` 出口的后端，仅适用于**普通浏览器**，即 `supports('useAnimation', ['element']) === false`。
- **Native segment play**：现有 `animateSpatialDiv` 的 `play`，使用 `from` / `to`，对应 Phase 2a，必须继续保留支持。
- **Native timeline play**：`animateSpatialDiv` 的 `play`，携带 `timeline` payload，即本 spec 覆盖的能力。
- **Segment-equivalent timeline**：每条轨道都恰好只有两个关键帧，位于 `at === 0` 与 `at === duration`，且所有轨道共享一个 easing。在这种情况下，可以使用原生 segment play，而不是 timeline play。

## 新增 Requirements

### Requirement: Extend bridge play command with optional timeline

跨层 `AnimateSpatialDivCommand` 在 `type: 'play'` 时必须接受一个可选的 `timeline` 字段。若存在 `timeline`，原生必须求值该时间线文档；若不存在 `timeline`，原生必须沿用现有的 `from` / `to` 单段插值，即不改变 Plan A 的行为。

#### Scenario: Wire shape matches motion config

- **WHEN** JS 发送一个带 `timeline` 的 `play`
- **THEN** `timeline` 必须包含 `duration`，单位秒，要求 `> 0` 且为有限值，以及可选的 `delay`、可选的 `playbackRate`、可选的 `loop` 与非空的 `tracks`
- **AND** 每条 track 必须包含 `property` 即 motion 白名单路径、`keyframes` 其 `at` 单位为秒且位于 `[0, duration]`，以及 `easing`，其取值仅可为 `linear`、`easeIn`、`easeOut`、`easeInOut`
- **AND** 关键帧 `at` 必须使用**秒**，而不是归一化的 `0..1`

#### Scenario: Segment and timeline are mutually exclusive on play

- **WHEN** `play` 包含 `timeline`
- **THEN** 原生在插值时必须忽略 `from` 与 `to`，它们在 wire 层可以省略
- **WHEN** `play` 不包含 `timeline`
- **THEN** 原生必须沿用现有 `from` / `to` 单段插值逻辑

#### Scenario: Non-play commands unchanged

- **WHEN** `type` 为 `pause`、`resume` 或 `cancel`
- **THEN** 命令中不得携带 `timeline`
- **AND** 行为必须与 `spatial-div-animation` 中同一 `animationId` 的会话语义一致

---

### Requirement: Native timeline evaluation matches Web evaluator

原生必须在 timeline 时间 `t` 秒处，独立采样每一条轨道，时间应先考虑 `delay` 与 `playbackRate`，然后按照与 Web `evaluateMotionTimeline` 实现相同的规则装配出 `SpatialDivAnimationTarget`，即 `opacity` 与结构化 transform。

#### Scenario: Per-track segment interpolation

- **GIVEN** 某条轨道具有关键帧 `[{ at: a, value: va }, { at: b, value: vb }]`，并指定 easing `e`
- **WHEN** 在 `a <= t <= b` 的条件下以时间 `t` 采样
- **THEN** 原生必须先计算线性进度 `(t - a) / (b - a)`，再对该进度应用 easing `e`，最后对 `va` → `vb` 做线性插值

#### Scenario: Hold before first and after last keyframe

- **GIVEN** 某条轨道的第一个关键帧位于 `at: 3`
- **WHEN** 在 `t: 1` 进行采样
- **THEN** 该轨道值必须等于第一个关键帧的 `value`
- **WHEN** 在 `t` 大于最后一个关键帧 `at` 时进行采样
- **THEN** 该轨道值必须等于最后一个关键帧的 `value`

#### Scenario: Canonical multi-track overlap acceptance

- **GIVEN** `duration: 5`，`transform.translate.x` 轨道在 `0s` 取 `0`，在 `5s` 取 `100`，easing 为 `linear`；`opacity` 轨道在 `3s` 取 `0`，在 `5s` 取 `1`，easing 为 `easeOut`
- **WHEN** 原生 timeline play 在 WebSpatial runtime 中播放完成
- **THEN** 在 `t = 1.5s`，若不计 delay，`translate.x` 必须为 `30`，容差 `±0.5`，且 `opacity` 必须为 `0`
- **AND** 在 `t = 5s` 时，`translate.x` 必须为 `100`，且 `opacity` 必须为 `1`
- **AND** 同一配置在 Web 后端上于相同 `t` 的结果必须保持一致，`translate` 容差 `±0.5`，`opacity` 容差 `±0.01`

#### Scenario: Compose transform order

- **WHEN** 多个 transform 标量轨道在时间 `t` 同时生效
- **THEN** 原生应用到空间实体时，必须按固定顺序 translate → rotate → scale 进行组合
- **AND** 单位必须与 Plan A 保持一致，即 translate 使用 CSS 像素，rotate 使用角度，scale 使用无单位倍率

---

### Requirement: WebSpatial runtime uses native playback only

当 `supports('useAnimation', ['element'])` 为 `true` 时，`useSpatializedMotion` 在 `play` / `pause` / `cancel` 上必须使用**原生** motion 后端。同一个 hook 实例不得同时由 Web RAF 参与 timeline 播放，也不得把 Web RAF 作为 fallback。

WebSpatial runtime 上的原生 `play` payload 选择规则：

1. 若 timeline 与单段等价，则使用原生 **segment** `play`，即 `from` / `to`，对应 Phase 2a。
2. 否则使用原生 **timeline** `play`，即 `timeline` payload，属于 Phase 2b。

当 `supports('useAnimation', ['element'])` 为 `false` 时，即普通浏览器，只允许 **Web RAF** 后端运行。

在 WebSpatial runtime 上，应用必须把 `motion` 绑定句柄传给与 `style` 相同的 `enable-xr` 节点，以便原生 session 能在 `api.play()` 之前或执行时完成附着。

#### Scenario: multi-track uses timeline on AVP

- **GIVEN** canonical 多轨配置，即 translate 在 `0–5s`，opacity 在 `3–5s`
- **AND** `supports('useAnimation', ['element'])` 为 `true`
- **WHEN** 元素已完成绑定并执行 `api.play()`
- **THEN** SDK 必须发送一个携带 `timeline` 的 `play`，而不是 segment `from` / `to`
- **AND** Web RAF 后端不得运行

#### Scenario: simple entrance may use segment native path

- **GIVEN** `useSpatializedMotion.simple` 中每个属性都只有 `at: 0` 与 `at: duration` 两个关键帧，且所有轨道共享同一个 easing
- **WHEN** 在 AVP 上执行原生播放
- **THEN** SDK 可以发送 segment `from` / `to`，而不是 `timeline`
- **AND** 视觉结果必须在上述容差范围内与 timeline 播放保持一致

#### Scenario: Plain Web uses RAF only

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 对任意合法 timeline 配置执行 `api.play()`
- **THEN** 只能运行 Web RAF 后端
- **AND** 对于该 hook 实例，不得调用原生 `animateSpatialDiv`

#### Scenario: pause returns current sampled values

- **GIVEN** 一个原生 timeline session 当前为 `running`
- **WHEN** bridge 上的 `api.pause()` 成功
- **THEN** JSB 的 pause 响应必须包含暂停位置的当前动画值
- **AND** hook 必须把这些值应用到公开的 `style` 出口，而不应只依赖 JS 端墙钟估算

#### Scenario: play before bind queues native session not Web RAF

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`
- **AND** `api.play()` 发生在 `motion` 尚未绑定 `Spatialized2DElement` 之前
- **WHEN** session 进入 `queued`
- **THEN** SDK 不得启动 Web RAF 后端播放
- **AND** 原生播放必须在 `__setElement` 完成附着时启动，或在之后再次 `play()` 时启动
- **AND** 应用必须把空间节点上缺失 `motion` 当成接入错误，因为 bind 完成前动画不会启动

---

### Requirement: Portal suppression during native timeline

当原生 timeline session 处于 delaying、running 或 paused 时，SDK 必须对动画字段的 Portal DOM 同步执行 suppression，避免布局同步覆盖原生采样结果。

#### Scenario: Suppression field set from tracks

- **GIVEN** 某个 timeline 至少包含一条 `transform.*` 轨道
- **WHEN** 原生 timeline 处于活动状态
- **THEN** `transform` 必须出现在 suppression 字段集中
- **GIVEN** 某个 timeline 包含 `opacity` 轨道
- **WHEN** 原生 timeline 处于活动状态
- **THEN** `opacity` 必须出现在 suppression 字段集中

#### Scenario: Suppression cleared on terminal state

- **WHEN** session 进入 `finished`，或在 `cancel` 后回到 `idle`
- **THEN** suppression 必须被清理
- **AND** 这些字段的常规 Portal 同步可以恢复

---

### Requirement: Motion binding for native sessions

原生 timeline 必须沿用 Phase 2a 的元素绑定机制，即 `motion` prop / `SpatialDivMotionBinding`，而不是 Plan A 的 `animation` prop。

#### Scenario: Bind before play

- **GIVEN** `api.play()` 发生在空间元素绑定之前
- **WHEN** 绑定稍后完成
- **THEN** queued 的原生 timeline 播放必须使用 `play()` 调用当时冻结的配置启动

#### Scenario: Unbind cancels session

- **GIVEN** 一个原生 timeline session 正在活动中
- **WHEN** motion 绑定被解除，例如组件卸载或移除 `motion` prop
- **THEN** SDK 必须取消该 session，并按会话规则触发 `onCancel`

---

### Requirement: Imperative API and lifecycle parity with session API

原生 timeline session 的 `play`、`pause`、`cancel`、`delay`、`loop`、`playbackRate` 以及回调语义，必须与 `spatial-div-animation` / Plan A 在 `spatial-div-animation` spec 中记录的会话语义保持一致，包括 queued play、pause-resume 不生成新的 `animationId`、running 状态下 `play` 为 no-op、回调互斥以及异步失败通过 `onError` 暴露。

#### Scenario: pause and resume timeline session

- **GIVEN** 一个原生 timeline session 处于 `running`
- **WHEN** 依次调用 `api.pause()` 与 `api.play()`
- **THEN** 原生必须在同一个 `animationId` 上完成暂停与恢复
- **AND** 不得把 timeline 从 `t = 0` 重新开始

#### Scenario: cancel restores start of session values

- **WHEN** 对一个活动中的 timeline session 调用 `api.cancel()`
- **THEN** 原生必须恢复到该 session 起始快照中的值，仅覆盖 tracks 中出现的字段
- **AND** `onCancel` 必须接收到这些恢复后的值

#### Scenario: Config updates do not affect alive session

- **GIVEN** React 重新渲染时传入了新的 `useSpatializedMotion` config 对象
- **WHEN** 某个 timeline session 正处于 delaying、running 或 paused
- **THEN** 当前活动中的 session 必须继续使用 `play()` 调用时冻结下来的配置

---

### Requirement: Style outlet during native timeline

当原生 timeline 正在控制实体时，hook 不得再通过 Web RAF 后端驱动动画字段。公开的 `style` 出口在播放期间可以保持起始值，也可以省略动画键，但不得与原生采样相互竞争。

#### Scenario: No concurrent Web and native animation

- **GIVEN** 原生 timeline 当前处于 `running`
- **WHEN** JS 中每一帧动画循环触发
- **THEN** Web RAF 循环不得对动画属性调用 `setStyle`

#### Scenario: After complete style reflects terminal values

- **WHEN** 一个非循环原生 timeline 正常结束
- **THEN** `style` 可以反映最终求值结果，以便应用继续做样式合并
- **AND** `api.playState` 必须为 `finished`

---

### Requirement: Validation before native send

在任何原生 `play` 发出之前，timeline 配置都必须先通过与 Web 一致的校验，例如 `validateSpatialDivMotionConfig`。非法配置必须在 JS 中抛错，原生不得接收到格式错误的 timeline。

#### Scenario: Reject duplicate property tracks

- **WHEN** 两条轨道使用了相同的 `property`
- **THEN** 必须在发送 bridge 命令前抛出校验异常

#### Scenario: Reject unsorted keyframes

- **WHEN** 某条轨道的关键帧未按非递减 `at` 排序
- **THEN** 必须在发送 bridge 命令前抛出校验异常

---

### Requirement: Native implementation structure

visionOS 必须在现有 `SpatialDivAnimationSession` / `AnimateSpatialized2DElement` pipeline 内部，通过 `CADisplayLink` 或等价机制实现 timeline 求值；当存在 `timeline` 时，用它替换原先的单段 lerp。

#### Scenario: TimelineEvaluator ownership

- **WHEN** `play` 携带 `timeline`
- **THEN** 原生必须构造一个 `TimelineEvaluator` 或等价对象，用于持有每条轨道的状态
- **AND** 每个 DisplayLink tick 都必须在当前 `t` 处采样所有轨道，组装目标值，并应用到空间实体上

#### Scenario: DisplayLink tick applies entity properties

- **WHEN** 某次 tick 得到了 opacity 与 transform 的采样结果
- **THEN** 原生必须更新 `Spatialized2DElement` 的表示，使用户能在空间中看到运动结果
- **AND** 不得只更新 probe DOM 而不更新真实空间实体

---

### Requirement: Capability and version gate

原生 timeline 播放必须沿用与 Plan A 相同的能力 gate，即 `supports('useAnimation', ['element'])`。Phase 2b 不引入新的 capability token。

#### Scenario: Capability false falls back to Web

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 应用使用多轨 timeline 配置
- **THEN** 必须由 Web 后端执行动画
- **AND** 不得调用原生 timeline

---

## Cross references

- Phase 2a，即 segment native 且不含 Swift timeline，见 [PHASE2-MINIMAL-NATIVE.md](../../PHASE2-MINIMAL-NATIVE.md)
- Web evaluator 对齐实现：`packages/react/src/spatialized-container/motion/evaluate.ts`
- 标准 demo：`/spatial-div-motion/multi-track`
- Plan A 会话语义：`openspec/changes/spatial-div-animation-api/specs/spatial-div-animation/spec.md`