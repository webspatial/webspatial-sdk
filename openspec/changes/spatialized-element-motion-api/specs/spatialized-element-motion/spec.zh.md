# 空间化元素动画（伞式）

## 新增需求

### Requirement: 伞式定义绑定时目标解析的声明式动画

平台 MUST 为 `spatialized2d`、`static3d`、`dynamic3d` 提供声明式 timeline 动画。公开 hook MUST NOT 需要 `config.kind`；目标在 `animation` binding 作为 `xr-animation` 传给组件时解析（`<div enable-xr>` → spatialized2d、`<Model>` → static3d、`<Reality>` → dynamic3d）。

#### Scenario: 能力矩阵为规范

- **WHEN** 产品负责人审查动画支持
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST 列出每种 kind 的交付状态

### Requirement: AnimationObject 由 SpatializedElement 创建，uuid 由 native 生成

`SpatializedElement`（及子类）MUST 提供 `createAnimation(config)`。调用 MUST 通过 `CreateSpatializedElementAnimation` JSB 在 native 创建 `AnimationObject : SpatialObject`，并返回 Core 侧 `AnimationObject` 句柄，其 `id` MUST 等于 native 分配的 uuid。

Timeline MUST 在 `createAnimation` 时编译为 canonical `tracks` 并锁定；后续控制命令 MUST NOT 携带 timeline。修改动画配置 MUST 通过 `destroy()` 后重新 `createAnimation`。

#### Scenario: create 返回 native uuid

- **WHEN** `await element.createAnimation(config)` 成功
- **THEN** 返回的 `AnimationObject.id` MUST 由 native 生成
- **AND** native `SpatialObject` 注册表 MUST 包含该 id

#### Scenario: timeline 在 create 时锁定

- **WHEN** `createAnimation(configA)` 成功后调用 `play()`
- **AND** 应用随后尝试以 `configB` 影响同一会话
- **THEN** SDK MUST NOT 将 `configB` 应用到该 `AnimationObject` 的已锁定 timeline
- **AND** 应用 MUST `destroy()` 后 `createAnimation(configB)` 才能使用新 timeline

### Requirement: AnimationObject 销毁走通用 SpatialObject 路径

`AnimationObject.destroy()` MUST 使用通用 `DestroyCommand`。Native MUST 终止采样会话、清除 element animating mask，并从注册表移除对象。

#### Scenario: destroy 清理 native 会话

- **WHEN** `animationObject.destroy()` 成功
- **THEN** native MUST 停止该 animation 的帧驱动
- **AND** parent element 上由该 animation 设置的 animating mask MUST 清除

### Requirement: Core 对外暴露 AnimationObject 播放 API

`AnimationObject` MUST 暴露 `SpatializedPlaybackApi` 形状：`play`、`pause`、`resume`、`stop`、`reset`、`finish`、`playState`、`isAnimating`、`isPaused`、`finished`。`pause()` / `resume()` MUST 只表示整体会话控制，不接受 `keys` 参数。

#### Scenario: 播放 API 与绑定目标无关

- **WHEN** 开发者对任意 kind 的 `AnimationObject` 调用 `play()` / `pause()` / …
- **THEN** 方法语义 MUST 一致

#### Scenario: stop / reset / finish 相互独立

- **WHEN** 调用 `stop()`、`reset()` 或 `finish()`
- **THEN** 各命令语义 MUST 保持独立，不得互相吞掉

### Requirement: Native 独占播放状态并通过 WebMsg 广播

Native `AnimationObject` MUST 拥有播放状态机。状态变化 MUST 通过 `SpatialAnimationStateChanged` WebMsg 广播，参数包含 `animationId` 与 `action`。Core `AnimationObject` MUST 以 native 广播为 `playState` 唯一来源。

#### Scenario: completed 广播

- **WHEN** 动画自然播放到 duration 结束
- **THEN** native MUST 发送 `action: 'completed'` 及终值 `values`
- **AND** Core MUST 将 `playState` 置为 `finished` 并触发 `onComplete`

#### Scenario: failed 广播

- **WHEN** native 异步播放失败
- **THEN** native MUST 发送 `action: 'failed'` 及 `error`
- **AND** Core MUST 触发 `onError`

### Requirement: 共享生命周期回调

Config MUST 支持 `onStart`、`onComplete`、`onStop`、`onReset`、`onError`。每次会话终止时 `onComplete` / `onStop` / `onReset` MUST 互斥，恰好触发一个。

### Requirement: v1 authoring 以 from/to 与 timeline 为主

Hook MUST 接受互斥配置形状：`from/to` 段、`timeline` 百分比关键帧、或高级 `tracks`。内部 MUST 编译为 canonical tracks 后在 `createAnimation` 时一次性提交 native。

### Requirement: 仅 native runtime 支持 useAnimation

`useAnimation` MUST 仅在 `supports('useAnimation', [subtoken])` 为 true 时可用。纯 Web 环境 MUST NOT 提供 Core RAF 播放后端；`useAnimation` MUST fail-fast（抛错或 documented 错误），由开发者使用 CSS / 第三方 web 动画库。

#### Scenario: 无 native 时 useAnimation 不可用

- **GIVEN** `supports('useAnimation', ['element'])` 为 false
- **WHEN** 应用调用 `useAnimation(config)`
- **THEN** SDK MUST NOT 启动 RAF 播放
- **AND** SDK MUST 明确报错或文档化不支持

### Requirement: Element 级 animating mask，不与 Portal 耦合

播放期间 native `SpatializedElement` MUST 标记 animating 字段（`transform` / `opacity`）。冲突的 transform / opacity JSB 更新在 native 侧 MUST 被忽略。抑制逻辑 MUST NOT 依赖 `PortalInstanceObject` 或 React Portal DOM 同步。

#### Scenario: 播放中忽略 transform JSB

- **GIVEN** `AnimationObject` 正在动画化 host `transform`
- **WHEN** JS 发送 `UpdateSpatializedElementTransform` 到同一 element
- **THEN** native MUST 忽略该更新（或 warn），直至 animating mask 清除

#### Scenario: 终态清除 mask

- **WHEN** `stop()`、`reset()`、`finish()`、`completed` 或 `destroy()` 完成
- **THEN** animating mask MUST 清除

### Requirement: React 在 bind 时创建 AnimationObject

`useAnimation(config)` 返回的 binding MUST 在 `xr-animation` 绑定、element 解析完成后调用 `element.createAnimation(config)`。bind 前对 `api` 的调用 MUST 由 `AnimationProxy` 排队，在 `AnimationObject` resolve 后 flush。

#### Scenario: bind 前 play 排队

- **WHEN** `api.play()` 在 binding 完成前调用
- **THEN** 命令 MUST 排队
- **AND** `createAnimation` 完成后 MUST 自动执行 `play()`（若 `autoStart` 未禁用）

#### Scenario: 单绑定约束

- **WHEN** 同一 `animation` binding 绑定到多个组件
- **THEN** SDK MUST 抛错或警告；仅第一次绑定生效

### Requirement: Model clip 播放独立

`SpatializedStatic3DElement` 上 USD clip（`ref.play()` / `pause()`）MUST 与 `AnimationObject` timeline 独立。

### Requirement: JSB 协议

JS → Native MUST 使用：

- `CreateSpatializedElementAnimation` — 创建，携带 `elementId`、`targetKind`、`timeline`
- `ControlSpatializedElementAnimation` — 控制，携带 `animationId`、`type`

Native → JS MUST 使用 `SpatialAnimationStateChanged` 广播状态。`AnimateSpatializedElementMotion` MUST NOT 作为目标态协议。
