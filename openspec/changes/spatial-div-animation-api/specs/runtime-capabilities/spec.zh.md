## 新增需求

### Requirement: 宣告 SpatialDiv 动画能力支持

运行时能力 API MUST 文档化并解析 top-level key `spatialDivAnimation`，用于表示当前 runtime 是否端到端支持 `SpatialDiv` 白名单属性动画。

#### Scenario: 支持的 runtime

- **WHEN** 当前 runtime 同时具备 `SpatialDiv` 动画所需的 React 集成、Core 命令链路、JSBridge 和 native 播放能力
- **THEN** `supports('spatialDivAnimation')` MUST 返回 `true`

#### Scenario: 不支持的 runtime

- **WHEN** 当前 runtime 缺少 `SpatialDiv` 动画所需的任一关键能力
- **THEN** `supports('spatialDivAnimation')` MUST 返回 `false`

#### Scenario: supports 结果稳定

- **WHEN** 应用在同一 runtime 进程生命周期内多次调用 `supports('spatialDivAnimation')`
- **THEN** 返回结果 MUST 保持稳定，不得在运行时变化

#### Scenario: 与实体动画能力独立

- **WHEN** 某个 runtime 支持实体 transform 动画但不支持 `SpatialDiv` 动画，或反之
- **THEN** `supports('useAnimation')` 与 `supports('spatialDivAnimation')` MUST 各自独立返回对应结果
- **AND** 一个能力 key 的结果 MUST NOT 隐式推导另一个能力 key 的结果