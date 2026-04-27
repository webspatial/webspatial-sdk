## 新增需求

### Requirement: 宣告实体 Transform 动画能力支持

运行时能力 API MUST 文档化并解析用于实体 Transform 动画特性的 top-level key `useAnimation`。

#### Scenario: 支持的 runtime

- **WHEN** 当前 runtime 端到端实现了实体 Transform 动画 API
- **THEN** `supports('useAnimation')` MUST 返回 `true`

#### Scenario: 不支持的 runtime

- **WHEN** 当前 runtime 缺少实体 Transform 动画所需的 native bridge 或播放行为
- **THEN** `supports('useAnimation')` MUST 返回 `false`

#### Scenario: useAnimation 不支持 sub-token

- **WHEN** 应用代码对 `supports('useAnimation', tokens)` 传入任意 sub-token
- **THEN** 结果 MUST 为 `false`