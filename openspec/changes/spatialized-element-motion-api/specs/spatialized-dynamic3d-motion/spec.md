# Spatialized Dynamic3D motion (Reality container)

## ADDED Requirements

### Requirement: Dynamic3D timeline animates container root transform and opacity

The SDK MUST support `SpatializedDynamic3DElement` timeline motion applying sampled values to the **container** `element.transform` and `opacity`. Child `SpatialEntity` nodes MUST remain in local space (they move with the container).

Target-state execution MUST create an `AnimationObject` through `SpatializedElement.createAnimation(config)` when `animation` is bound to a `<Reality>` component and resolves to `dynamic3d`.

#### Scenario: Native create sends timeline

- **GIVEN** `supports('useAnimation')` is true
- **WHEN** `CreateSpatializedElementAnimation` runs for a `SpatializedDynamic3DElement`
- **THEN** native MUST sample the timeline and update container transform / opacity until completion or session termination

#### Scenario: Reality xr-animation binding

- **WHEN** `<Reality xr-animation={binding} />` receives `animation` from `useAnimation(config)`, resolving the target to `dynamic3d`
- **THEN** play before bind MAY queue; after bind native playback MUST drive the Reality root without conflicting React transform writes through the element animating mask

### Requirement: Reality host merges the returned style outlet

For a `<Reality>` host, the `style` returned by `useAnimation(config)` MUST be merged back onto the same `<Reality>` element that receives `xr-animation`. This merge closes animation-emitted visual values through later rerender and resync of the host container.

#### Scenario: Reality terminal values remain visible after later host resync

- **GIVEN** `<Reality style={{ ...style }} xr-animation={binding} />`
- **WHEN** `stop()`, `reset()`, `finish()`, or natural completion is followed by a later rerender or host resync
- **THEN** the visible Reality container state MUST continue to reflect the terminal values emitted by the animation session

#### Scenario: Reality playback without merged style does not guarantee terminal persistence

- **GIVEN** `<Reality xr-animation={binding} />` omits merging the returned `style`
- **WHEN** playback still starts through the native animation path
- **THEN** the SDK MAY still play the animation
- **AND** post-terminal visual persistence after later rerender or host resync MUST be treated as unspecified

### Requirement: Entity motion stays separate

Child `SpatialEntity` animation MUST continue to use the separate entity stack and MUST NOT route through the container `AnimationObject`.

#### Scenario: useEntityAnimation on Entity is not container motion

- **WHEN** authors animate a child `Entity` with `useEntityAnimation`
- **THEN** that MUST NOT use the container `AnimationObject`; entity stack remains unchanged