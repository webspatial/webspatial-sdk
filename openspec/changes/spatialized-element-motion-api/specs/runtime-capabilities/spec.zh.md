## 新增需求

### Requirement: 宣告 spatialized element animation 能力支持

运行时能力 API MUST 文档化并解析用于 spatialized element animation target 的 `useAnimation` key 及以下 sub-token：

- `element`：对应 `spatialized2d`
- `static3d`：对应 `SpatializedStatic3DElement` / `<Model>`
- `dynamic3d`：对应 `SpatializedDynamic3DElement` / `<Reality>`

需要判断具体目标的应用 MUST 使用 `supports('useAnimation', [token])`。`supports('useAnimation')` 仍然只是 family 级检查，MUST NOT 被当作任一具体 spatialized target 可用的证明。

#### Scenario: 支持 2D spatialized element target

- **WHEN** 当前 runtime 为 `spatialized2d` 实现了 `CreateSpatializedElementAnimation`、`ControlSpatializedElementAnimation`、`SpatialAnimationStateChanged` 和 element animating mask 行为
- **THEN** `supports('useAnimation', ['element'])` MUST 返回 `true`

#### Scenario: 支持 Static3D target

- **WHEN** 当前 runtime 为 `static3d` 实现了 AnimationObject 路径和写入 sink
- **THEN** `supports('useAnimation', ['static3d'])` MUST 返回 `true`

#### Scenario: 支持 Dynamic3D target

- **WHEN** 当前 runtime 为 `dynamic3d` 实现了 AnimationObject 路径和写入 sink
- **THEN** `supports('useAnimation', ['dynamic3d'])` MUST 返回 `true`

#### Scenario: 纯 Web runtime 返回 false

- **WHEN** 当前 runtime 是没有 native AnimationObject bridge 的纯 Web runtime
- **THEN** `supports('useAnimation', ['element'])` MUST 返回 `false`
- **AND** `supports('useAnimation', ['static3d'])` MUST 返回 `false`
- **AND** `supports('useAnimation', ['dynamic3d'])` MUST 返回 `false`

#### Scenario: 不支持的 sub-token 返回 false

- **WHEN** 应用代码传入 `entity`、`element`、`static3d`、`dynamic3d` 等已文档化 token 之外的 `useAnimation` sub-token
- **THEN** `supports('useAnimation', tokens)` MUST 返回 `false`

#### Scenario: 多个 target token 使用 AND 语义

- **WHEN** 应用代码调用 `supports('useAnimation', ['element', 'dynamic3d'])`
- **THEN** 只有当前 runtime 同时支持这两个 spatialized target 时，结果才 MUST 为 `true`
