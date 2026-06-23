# Spatialized Dynamic3D motion (Reality container)

## ADDED Requirements

### Requirement: Dynamic3D timeline drives container root transform and opacity

The SDK MUST support `SpatializedDynamic3DElement.createAnimation(config)` applying samples to container `element.transform` and `element.opacity`.

#### Scenario: createAnimation on bind

- **GIVEN** `supports('useAnimation', ['dynamic3d'])` is true
- **WHEN** `<Reality xr-animation={binding} />` finishes bind
- **THEN** the SDK MUST `createAnimation` and update container transform / opacity on `play()`

#### Scenario: play before bind queues

- **WHEN** `api.play()` runs before Reality bind
- **THEN** Proxy MUST queue and flush after create

### Requirement: container root only

Timeline MUST animate only the Reality container root, not child node transforms.
