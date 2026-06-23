# 空间化 Static3D 动画

## 新增需求

### Requirement: Static3D timeline 驱动 model 根 transform

SDK MUST 支持 `SpatializedStatic3DElement.createAnimation(config)`，将锁定 timeline 的采样值应用到 `modelTransform`（translate/rotate/scale）。Static3D 根 `opacity` 不属于已交付 sink；opacity track MUST 在校验时被拒绝或 native 忽略。

#### Scenario: bind 时 createAnimation

- **GIVEN** `supports('useAnimation', ['static3d'])` 为 true
- **WHEN** `<Model xr-animation={binding} />` 完成 bind
- **THEN** SDK MUST 调用 `createAnimation` 并在 `play()` 时更新 `modelTransform`

#### Scenario: bind 前 play 排队

- **WHEN** `api.play()` 在 Model bind 前调用
- **THEN** Proxy MUST 排队，create 后 flush

### Requirement: Clip 播放保持独立

#### Scenario: ref.play 不启动 AnimationObject

- **WHEN** 应用调用 model ref `play()` 播放 USD clip
- **THEN** `AnimationObject` timeline MUST NOT 被隐含启动
