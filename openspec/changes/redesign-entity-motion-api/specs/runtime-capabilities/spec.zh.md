## 新增需求

### Requirement: Entity motion 使用文档化的顶层 motion capability key

新的 Entity motion 目标态 capability 契约 MUST 使用顶层 `supports('useAnimation')`。针对新 Entity motion 提案的文档 MUST NOT 再把 `supports('useAnimation', ['entity'])` 描述为推荐的目标态检测方式。

该 capability 代表当前 runtime 支持 Reality Entity 组件通过推荐的 `xr-animation` 绑定，且继续兼容 `animation` 绑定，来接入 `useEntityAnimation`。

#### Scenario: Entity motion capability 文档指引
- **WHEN** 应用文档解释如何检测新的 Entity motion API 是否受支持
- **THEN** 文档 MUST 使用 `supports('useAnimation')` 作为目标态 capability 检测方式

#### Scenario: 旧 sub-token 不再是目标态指引
- **WHEN** 文档在迁移语境下引用旧的 Entity motion 检测方式
- **THEN** `supports('useAnimation', ['entity'])` MUST 被视为迁移前或已被替代的行为，而不是推荐的目标态契约