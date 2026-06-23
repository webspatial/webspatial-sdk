# 空间化 2D 动画

## 范围

`Spatialized2DElement`（`enable-xr`）是三种容器中的 2D 目标。`useAnimation` 返回的 `animation` 通过 `xr-animation` 绑定到 `enable-xr` 节点时，目标解析为 `spatialized2d`。

**仅 native：** 本 kind 不支持 Web RAF。`supports('useAnimation', ['element'])` 为 false 时 `useAnimation` 不可用。

## 新增需求

### Requirement: 2D 通过 createAnimation 创建 AnimationObject

bind 完成后，SDK MUST 调用 `Spatialized2DElement.createAnimation(config)`，native 创建 `AnimationObject` 并锁定 timeline。播放 MUST 通过 `ControlSpatializedElementAnimation` 驱动 native 写入 `element.transform` 与 `element.opacity`。

#### Scenario: 公共 React 入口

- **WHEN** 开发者调用 `useAnimation(config)` 并绑定到 `enable-xr` 节点
- **THEN** hook MUST 返回 `[animation, api, style]`
- **AND** native 可用时 MUST 在 bind 时 `createAnimation`

#### Scenario: style 为初始预览

- **WHEN** hook 首次渲染
- **THEN** `style` MAY 反映 `from` 值（`evaluateMotionTimeline(config, 0)`）供布局参考
- **AND** 播放中视觉 MUST 由 native 写入 element，不经过 React RAF

---

### Requirement: 白名单属性

Track `property` MUST 限于：`opacity`、`transform.translate.*`、`transform.rotate.*`、`transform.scale.*`。

#### Scenario: 拒绝布局属性

- **WHEN** track 引用 `width`、`height`、`back` 或 `depth`
- **THEN** 校验 MUST 在 `createAnimation` 前抛错

---

### Requirement: Element animating mask 替代 Portal 抑制

2D 播放期间 MUST 在 native `Spatialized2DElement` 设置 animating mask。SDK MUST NOT 通过 `PortalInstanceObject` 或 React `resolveMotionStyle` suppression 阻止 DOM 同步来作为 motion 主路径。

#### Scenario: 播放中 native 独占 transform

- **GIVEN** opacity / transform timeline 正在播放
- **WHEN** 冲突的 `UpdateSpatializedElementTransform` 到达
- **THEN** native MUST 忽略直至 mask 清除

---

### Requirement: 命令式播放和生命周期

`play`、`pause`、`stop`、`reset`、`finish` 及回调 MUST 遵循伞式 spec。状态 MUST 来自 `SpatialAnimationStateChanged` WebMsg。

---

### Requirement: create 前校验

Timeline 配置 MUST 在 `createAnimation` 前通过 `validateSpatializedMotionConfig`。

#### Scenario: 拒绝重复 property track

- **WHEN** 两条 track 共享同一 `property`
- **THEN** 校验 MUST 抛错

---

## 交叉引用

- 伞式：`specs/spatialized-element-motion/spec.md`
