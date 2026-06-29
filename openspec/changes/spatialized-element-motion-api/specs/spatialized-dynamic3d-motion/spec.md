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

### Requirement: Entity motion stays separate

Child `SpatialEntity` animation MUST continue to use the separate entity stack and MUST NOT route through the container `AnimationObject`.

#### Scenario: useEntityAnimation on Entity is not container motion

- **WHEN** authors animate a child `Entity` with `useEntityAnimation`
- **THEN** that MUST NOT use the container `AnimationObject`; entity stack remains unchanged
