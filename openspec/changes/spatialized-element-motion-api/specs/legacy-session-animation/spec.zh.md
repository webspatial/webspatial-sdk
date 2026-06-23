## 新增需求

### Requirement: 旧版会话动画仅保留为历史参考

已移除的 Plan A session animation 路径 MUST 仅作为历史背景保留。它 MUST NOT 为当前 API surface 定义规范性需求。

#### Scenario: 新集成使用目标态动画

- **WHEN** 开发者创建新的 spatialized element animation 集成
- **THEN** 他们 MUST 使用统一的 `useAnimation(config)` timeline API 和 `xr-animation`
- **AND** 他们 MUST NOT 使用已移除的旧版 `animation` prop 路径

## 说明

### 历史摘要

- Plan A 使用 `useAnimation(config)` 加上 `enable-xr` 节点上的 `animation` prop。
- 该兼容路径已经从目标态 API 中移除。
- 新集成 MUST 使用统一的 `useAnimation(config)` timeline API 和 `xr-animation`。

### 交叉引用

- 归档的 Plan A spec：`openspec/changes/archive/spatial-div-animation-api/specs/spatial-div-animation/spec.md`
- 统一伞式变更：`openspec/changes/spatialized-element-motion-api/`
