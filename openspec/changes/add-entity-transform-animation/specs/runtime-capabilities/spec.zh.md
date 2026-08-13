## 新增需求

### Requirement: 宣告实体 Transform 动画能力支持

运行时能力 API MUST 文档化并解析用于实体 Transform 动画特性的 key `useAnimation` 及其 sub-token `entity`。

#### Scenario: 支持的 runtime

- **WHEN** 当前 runtime 端到端实现了实体 Transform 动画 API
- **THEN** `supports("useAnimation", ["entity"])` MUST 返回 `true`

#### Scenario: 不支持的 runtime

- **WHEN** 当前 runtime 缺少实体 Transform 动画所需的 native bridge 或播放行为
- **THEN** `supports("useAnimation", ["entity"])` MUST 返回 `false`

#### Scenario: supports 结果稳定

- **WHEN** 应用在同一 runtime 进程生命周期内多次调用 `supports("useAnimation", ["entity"])`
- **THEN** 返回结果 MUST 保持稳定，不得在运行时变化

#### Scenario: useAnimation 仅支持 entity sub-token

- **WHEN** 应用代码对 `supports("useAnimation", tokens)` 传入 `["entity"]` 以外的 sub-token
- **THEN** 结果 MUST 为 `false`
- **AND** 这是有意设计：实体 Transform 动画的第一版仅支持 `["entity"]` sub-token，其他 sub-token（如 `["opacity"]`）保留给未来版本