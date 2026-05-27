# SpatialDiv motion 时间线 API

## 范围

**本 spec 仅适用于 `Spatialized2DElement`，即 HTML SpatialDiv / `enable-xr`。** 不涵盖 `SpatializedStatic3DElement` 或 Reality entity。若需查看覆盖全平台的上层路线图，请参考 `openspec/changes/spatialized-element-motion-api/`。

## 术语

**WebSpatial runtime** 指 `runtime-capabilities` 快照中的 `type !== null`。**Plain Web** 指 `type === null` 或 `supports('useAnimation', ['element']) === false`。

## 新增 Requirements

### Requirement: Provide SpatialDiv motion API with a single style outlet

SDK 必须提供 `useSpatializedMotion(config)`，其返回值至少包含 `{ style, api }`。`style` 对象只能携带白名单中的动画字段，即 `opacity` 与按 translate → rotate → scale 组合出的 `transform` CSS 字符串。应用必须通过把 `style` 合并到空间化 HTML 节点上来接入 motion，例如 `<div enable-xr style={{ ...layout, ...motionStyle }} />`。motion API 不得要求使用 Plan A 的 `animation` prop。

#### Scenario: Hook return shape

- **WHEN** 应用代码调用 `useSpatializedMotion(config)`
- **THEN** hook 返回值必须包含 `style` 和 `api`
- **AND** `api` 必须暴露 `play`、`pause`、`cancel`、`isAnimating`、`isPaused`、`finished` 与 `playState`
- **AND** 当原生 session 因 `play` 发生在 `motion` bind 之前而处于 `queued` 时，公开的 `playState` 可以对外表现为 `running`，直到完成 bind 或进入终态；公开类型中不要求单独暴露 `queued`
- **AND** 当 `supports('useAnimation', ['element'])` 为 `true` 时，hook 可以额外返回可选的原生绑定句柄，例如 `motion`，供 Portal 接线使用；若 SDK wrapper 已经隐藏该过程，则该句柄不得成为公开作者契约的必需项

#### Scenario: simple sugar desugars to a timeline

- **WHEN** 应用代码调用 `useSpatializedMotion.simple({ kind: 'spatialized2d', { from, to, duration, ... })`
- **THEN** SDK 的行为必须等价于一次 `useSpatializedMotion` 调用，其中 `tracks` 为 `from` / `to` 中每个动画标量字段各生成一条轨道，并分别包含 `at: 0` 与 `at: duration` 两个关键帧

---

### Requirement: Timeline supports multi-track overlapping keyframes

配置必须包含全局 `duration`，单位为秒，且要求 `> 0`、有限值；同时必须包含非空 `tracks` 数组。每条 track 必须指定来自视觉白名单的 `property`，至少两个关键帧，关键帧 `at` 单位为秒，且落在 `[0, duration]` 范围内；每条 track 可以带独立的 `easing`。

#### Scenario: Overlapping tracks with different time ranges

- **GIVEN** `duration: 5`，并包含 `transform.translate.x` 轨道 `0→100`，时间范围 `0s→5s`，以及 `opacity` 轨道 `0→1`，时间范围 `3s→5s`
- **WHEN** 在 Web 后端或原生后端上执行 `api.play()` 并播放至结束
- **THEN** 在 `t=1.5` 采样时，`translate.x` 必须位于 `0` 与 `100` 之间，且 `opacity` 必须等于 `0`
- **AND** 在 `t=5` 时，`translate.x` 必须等于 `100`，且 `opacity` 必须等于 `1`

#### Scenario: Hold outside keyframe range within a track

- **GIVEN** 某条轨道的第一个关键帧位于 `at: 3`
- **WHEN** 在 `t=1` 进行求值
- **THEN** 该轨道的值必须等于第一个关键帧的 `value`

---

### Requirement: Whitelisted properties only

Track 的 `property` 值必须限制为：`opacity`、`transform.translate.x`、`transform.translate.y`、`transform.translate.z`、`transform.rotate.x`、`transform.rotate.y`、`transform.rotate.z`、`transform.scale.x`、`transform.scale.y`、`transform.scale.z`。布局或空间尺寸相关字段必须在校验阶段被拒绝。

#### Scenario: Reject layout property track

- **WHEN** 某条轨道引用了 `width`、`height`、`back`、`backOffset` 或 `depth`
- **THEN** 校验必须在播放前抛出异常

---

### Requirement: Dual backend Web MUST animate

当原生 motion 后端不可用时，SDK 必须使用 **Web 后端**，通过关键帧求值例如 `requestAnimationFrame` 驱动相同的 `style` 出口。Web 后端不得把 `play()` 当成静默 no-op。

#### Scenario: Plain browser play animates style

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 应用使用有效 tracks 配置调用 `useSpatializedMotion` 并执行 `api.play()`
- **THEN** `style` 必须随时间更新直到 timeline 完成
- **AND** 在 timeline 运行期间，`api.isAnimating` 必须为 `true`
- **AND** 非循环 timeline 结束时必须触发 `onComplete`

#### Scenario: WebSpatial runtime uses native backend only

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`，即 WebSpatial 或 visionOS 运行时
- **WHEN** 针对一个有效 timeline 调用 `api.play()`
- **THEN** SDK 必须使用原生 motion 后端，即通过 `animateSpatialDiv` 发起 segment 或 timeline 播放
- **AND** 同一个 hook 实例上，Web RAF 后端不得同时参与播放
- **AND** 当 `Spatialized2DElement` 已通过 `motion` 绑定后，SDK 必须在原生播放期间按照 Plan A 规则对动画字段应用 suppression

#### Scenario: play before bind does not fall back to Web RAF

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`
- **AND** `api.play()` 发生在 `motion` 绑定元素之前
- **THEN** SDK 不得回退到 Web RAF 后端进行播放
- **AND** 原生播放必须在元素完成绑定后以 queued session 的形式启动

#### Scenario: Native running does not require per-frame style

- **GIVEN** 原生 motion 后端正在驱动 timeline，处于 `running` 或 `paused`，且动画字段的 suppression 已生效
- **WHEN** 应用在 `running` 期间读取 `style`
- **THEN** SDK 不得要求 `style` 必须反映原生实体当前的中间帧
- **AND** 应用不得将逐帧读取 `style` 作为原生播放成功与否的验收依据

#### Scenario: Native pause syncs style to timeline sample

- **GIVEN** 一个原生 timeline 已在播放，且 `api.pause()` 调用成功
- **WHEN** session 进入 `paused`
- **THEN** 若 pause 响应中带有当前动画值，hook 必须用这些值更新公开的 `style`
- **AND** 否则可以回退为使用 JS 端 timeline evaluator 按暂停时的进度求值，Web 后端本身只依赖 evaluator
- **AND** 在后续 `play()` 恢复或 `cancel()` / 完成之前，`style` 必须作为该暂停进度下的 React 权威状态

#### Scenario: Native onComplete uses bridge final values for style

- **GIVEN** 一个原生 timeline 已经完成
- **WHEN** `onComplete(values)` 被触发
- **THEN** hook 必须使用 `values` 即 bridge 返回的终值来更新 `style`
- **AND** 不得使用一个可能与原生结果偏离的独立 JS 快照来更新 `style`

#### Scenario: Web pause syncs style to timeline sample

- **GIVEN** Web 后端处于 `running`
- **WHEN** 调用 `api.pause()`
- **THEN** `style` 必须反映暂停时刻的 timeline 采样值，而不是陈旧的 pre-play 快照

---

### Requirement: Imperative playback and lifecycle

`play`、`pause`、`cancel` 以及生命周期回调，在适用场景下必须与 `spatial-div-animation` 会话 API 保持一致：paused 状态下调用 `play` 表示 resume，running 状态下再次调用 `play` 为 no-op，`cancel` 恢复到会话起始值，`onComplete` 与 `onCancel` 互斥，原生异步失败通过 `onError` 暴露。

#### Scenario: play is no-op while running

- **GIVEN** 一个非循环 timeline 正在播放
- **WHEN** 未经过 `cancel()` 就再次调用 `api.play()`
- **THEN** 该调用必须是 no-op

---

### Requirement: Native runtime binding via optional motion prop

当原生 motion 后端启用时，SDK 必须从 `useSpatializedMotion` 暴露一个内部绑定句柄，该句柄必须传递给与 `style` 相同的 `enable-xr` SpatialDiv。目前这一机制表现为 hook 中可选的 `motion` 字段，以及由 `PortalSpatializedContainer` 消费的同名 DOM prop。应用不得把该句柄当成动画配置对象。

#### Scenario: Plain Web omits motion

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 应用仅将 `style` 合并到 `<div enable-xr />` 上使用 `useSpatializedMotion`
- **THEN** 绑定句柄必须是 `undefined`
- **AND** 播放必须通过 Web 后端进行，且不得要求传入绑定 prop

#### Scenario: Spatial runtime passes motion binding

- **GIVEN** `supports('useAnimation', ['element'])` 为 `true`，且 hook 返回了已定义的绑定句柄
- **WHEN** 应用希望在 SpatialDiv 上走原生播放
- **THEN** 该绑定句柄必须传递给对应 SpatialDiv，例如 `motion={motion}`，以便 `__setElement` 在 `api.play()` 前或执行时完成附着
- **AND** 原生播放期间的 suppression 必须通过 `__getSuppressedFields()` 协调

#### Scenario: Unbind does not invoke onCancel

- **GIVEN** 原生 motion session 已绑定到某个元素且处于活动状态
- **WHEN** `motion` 绑定被拆除，即 `__onUnbind` 被触发，但没有显式调用 `api.cancel()`
- **THEN** SDK 必须向原生发送 `cancel` 并释放 session
- **AND** `onCancel` 不得被触发，以保持与 Plan A `useSpatialDivAnimation` unbind 语义一致

#### Scenario: Optional wrapper hides motion from app code

- **GIVEN** SDK 提供 `MotionSpatialDiv` 或等价的公开 wrapper
- **WHEN** 应用只使用 wrapper 暴露的公开 props，例如 `config` 或 layout 与 children
- **THEN** wrapper 必须在内部传递绑定句柄
- **AND** 面向应用的文档可以只描述 `{ style, api }` 集成方式

---

### Requirement: Motion does not use animation prop binding

motion 路径不得要求在元素上使用 Plan A 的不透明 `animation` 对象。suppression 与原生绑定必须由 motion controller 自己持有。绑定可以通过独立的 `motion` 句柄或 SDK wrapper 实现，但不得把动画值重新塞进 `animation`。

#### Scenario: No animation prop on motion path

- **WHEN** 应用使用 `useSpatializedMotion` 来实现 motion
- **THEN** 元素不得需要 `animation` prop 才能正常工作
- **AND** 动画字段必须通过 `style` 被驱动，无论是 Web 后端还是按文档约定在原生运行中的样式合并规则