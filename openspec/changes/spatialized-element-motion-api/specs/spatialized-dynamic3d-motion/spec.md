# Spatialized Dynamic3D motion (Reality container)

## ADDED Requirements

### Requirement: Dynamic3D timeline animates container root transform and opacity

The SDK MUST support `SpatializedDynamic3DElement` timeline motion applying sampled values to the **container** `element.transform` and `opacity`. Child `SpatialEntity` nodes MUST remain in local space (they move with the container).

Implementation MUST use `SpatializedMotionController` with the `dynamic3d` target, resolved when `animation` is bound to a `<Reality>` component (native-only; no Web RAF).

#### Scenario: Native play sends timeline

- **GIVEN** `supports('useAnimation', ['dynamic3d'])` is true
- **WHEN** `SpatializedDynamic3DElement.animateMotion({ type: 'play', timeline })` runs
- **THEN** native MUST sample the timeline and update container transform / opacity until complete or cancel

#### Scenario: Reality motion binding

- **WHEN** `<Reality motion={binding} />` receives `animation` from `useSpatializedMotion(config)`, resolving the target to `dynamic3d`
- **THEN** play before bind MAY queue; after bind native playback MUST drive the Reality root without conflicting React transform writes (suppression analogous to 2D)

### Requirement: Entity motion stays separate

Child `SpatialEntity` animation MUST continue to use the separate entity stack and MUST NOT route through the container motion controller.

#### Scenario: useAnimation on Entity is not container motion

- **WHEN** authors animate a child `Entity` with `useAnimation`
- **THEN** that MUST NOT use `SpatializedMotionController`; entity stack remains unchanged
