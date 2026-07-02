## 新增 Requirements

### Requirement: Native motion backend gate

`useSpatializedMotion` 的原生后端仅可在 `supports('useAnimation', ['element'])` 为 `true` 时启用。Web 后端不得依赖该能力。

#### Scenario: Capability false still allows Web motion

- **GIVEN** `supports('useAnimation', ['element'])` 为 `false`
- **WHEN** 应用使用 `useSpatializedMotion` 并调用 `api.play()`
- **THEN** motion 仍必须通过 Web 后端运行
- **AND** 在普通浏览器中，motion 功能不得要求 `supports` 返回 `true`