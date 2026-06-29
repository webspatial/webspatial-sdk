## 新增需求

### Requirement: 宣告 spatialized element animation 能力支持

运行时能力 API MUST 文档化并解析 `useAnimation` key，作为发布后容器 motion 的公开能力 gate。`spatialized2d`、`static3d`、`dynamic3d` 等目标名是内部绑定解析 kind，MUST NOT 作为 `useAnimation` sub-token 暴露。legacy `entity` sub-token 继续保留给 `useEntityAnimation`。

应用在依赖 motion API 前 MUST 检查 `supports('useAnimation')`。

#### Scenario: 支持 motion API

- **WHEN** 当前 runtime 实现了 `CreateSpatializedElementAnimation`、`ControlSpatializedElementAnimation`、`SpatialAnimationStateChanged`、element animating mask 行为，以及发布后的 Entity animation 路径
- **THEN** `supports('useAnimation')` MUST 返回 `true`

#### Scenario: 纯 Web runtime 返回 false

- **WHEN** 当前 runtime 是没有 native AnimationObject bridge 的纯 Web runtime
- **THEN** `supports('useAnimation')` MUST 返回 `false`

#### Scenario: 容器 target sub-token 返回 false

- **WHEN** 应用代码对 `supports('useAnimation', tokens)` 传入 `element`、`static3d` 或 `dynamic3d`
- **THEN** `supports('useAnimation', tokens)` MUST 返回 `false`
