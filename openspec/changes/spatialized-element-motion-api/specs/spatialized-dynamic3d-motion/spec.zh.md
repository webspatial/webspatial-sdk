# 空间化 Dynamic3D 动画（Reality 容器）

## 新增需求

### Requirement: Dynamic3D timeline 驱动容器根 transform 和 opacity

SDK MUST 支持 `SpatializedDynamic3DElement.createAnimation(config)`，将采样值应用到容器的 `element.transform` 和 `element.opacity`。

#### Scenario: bind 时 createAnimation

- **GIVEN** `supports('useAnimation', ['dynamic3d'])` 为 true
- **WHEN** `<Reality xr-animation={binding} />` 完成 bind
- **THEN** SDK MUST `createAnimation` 并在 `play()` 时更新容器 transform / opacity

#### Scenario: bind 前 play 排队

- **WHEN** `api.play()` 在 Reality bind 前调用
- **THEN** Proxy MUST 排队，create 后 flush

### Requirement: 仅容器根节点

Timeline MUST 只动画化 Reality 容器根，不涵盖子节点 transform。
