## ADDED Requirements

### Requirement: Manifest scene config resolves supported aliases deterministically
系统 MUST 接受 `xr_spatial_scene` 输入字段中受支持的 snake_case 和 camelCase 别名，并在运行时默认值被消费之前以确定性规则完成解析。

#### Scenario: Top-level alias is accepted
- **WHEN** manifest 在 `xr_spatial_scene.default_size` 或 `xr_spatial_scene.defaultSize` 中提供值
- **THEN** 系统 MUST 使用该值作为运行时 `defaultSize` 的来源

#### Scenario: Same-layer alias conflict prefers snake case
- **WHEN** 同一个 `xr_spatial_scene` 对象层同时包含受支持的 snake_case 键及其 camelCase 别名
- **THEN** 系统 MUST 在该层使用 snake_case 对应的值

### Requirement: Scene override selectors accept both alias forms
系统 MUST 接受 `xr_spatial_scene.overrides` 中的 snake_case 和 camelCase 场景选择器别名。

#### Scenario: Window override alias is accepted
- **WHEN** manifest 提供 `overrides.window_scene` 或 `overrides.windowScene`
- **THEN** 系统 MUST 仅将该对象应用到 window 场景默认值

#### Scenario: Volume override alias is accepted
- **WHEN** manifest 提供 `overrides.volume_scene` 或 `overrides.volumeScene`
- **THEN** 系统 MUST 仅将该对象应用到 volume 场景默认值

### Requirement: Override precedence remains unchanged
系统 MUST 保持内置默认值 顶层 manifest 值 按场景 override 和 `initScene()` 回调返回值之间既有的优先级顺序不变。

#### Scenario: Per-scene override beats top-level manifest values
- **WHEN** 顶层 `xr_spatial_scene` 对象定义了某个字段，且对应场景类型的 override 也定义了同一字段
- **THEN** 系统 MUST 对该场景类型使用 override 的值

#### Scenario: InitScene callback return beats manifest defaults
- **WHEN** `initScene()` 回调为某个字段返回了值，且 manifest 默认值也提供了同一字段
- **THEN** 系统 MUST 在最终场景配置中使用回调返回值

### Requirement: Manifest-derived defaults normalize supported resizability aliases
系统 MUST 在将 manifest 派生默认值暴露给场景初始化代码之前，把受支持的 snake_case `resizability` 键归一化为运行时 camelCase 结构。

#### Scenario: Snake case resizability keys become camel case runtime keys
- **WHEN** manifest 在 `resizability` 中提供 `min_width` `min_height` `max_width` 或 `max_height`
- **THEN** manifest 派生运行时默认值 MUST 分别以 `minWidth` `minHeight` `maxWidth` 和 `maxHeight` 暴露这些值

### Requirement: Callback chaining preserves raw callback returns
系统 MUST 在第一次回调前归一化 manifest 派生默认值，并且 MUST 在后续链式调用中保留 callback 返回值的原始键形态，不做重写。

#### Scenario: Previous callback return is passed through unchanged
- **WHEN** 同一场景名在 callback 返回了自定义对象之后再次调用 `initScene()`
- **THEN** 下一次 callback MUST 原样收到上一次的返回值