## 新增需求

### Requirement: Entity motion 使用文档化的顶层 motion capability key

新的 Entity motion 目标态 capability 契约 MUST 使用顶层 `supports('useAnimation')`。`supports('useAnimation', ['entity'])` MUST 从文档化的 capability 契约中移除:任何文档、目标态指引或保留 sub-token MUST NOT 再描述 `useAnimation` 的 `entity` sub-token。

该 capability 代表当前 runtime 支持 Reality Entity 组件通过推荐的 `xr-animation` 绑定，且继续兼容 `animation` 绑定，来接入 `useEntityAnimation`。

#### Scenario: Entity motion capability 文档指引
- **WHEN** 应用文档解释如何检测新的 Entity motion API 是否受支持
- **THEN** 文档 MUST 使用 `supports('useAnimation')` 作为目标态 capability 检测方式

#### Scenario: 旧 sub-token 从契约中移除
- **WHEN** capability 文档或代码引用 Entity motion 支持检测
- **THEN** MUST NOT 使用或保留 `supports('useAnimation', ['entity'])`
- **AND** `supports('useAnimation')` MUST 是 Entity motion 唯一文档化的 capability 检测方式