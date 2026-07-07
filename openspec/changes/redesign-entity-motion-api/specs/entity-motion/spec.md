## ADDED Requirements

### Requirement: `useEntityAnimation` exposes the new Entity motion tuple

The SDK MUST provide `useEntityAnimation(config)` as the public Entity motion hook. The hook MUST return a 3-tuple `[animation, api, entityProps]`.

The returned `animation` object MUST be bindable through `xr-animation` on Entity components and SHOULD remain compatible with `animation` binding. The returned `entityProps` object MUST be a sparse React outlet containing only Entity transform fields: `position`, `rotation`, and `scale`.

#### Scenario: Hook return shape
- **WHEN** application code calls `useEntityAnimation(config)`
- **THEN** the hook MUST return `[animation, api, entityProps]`
- **AND** `api` MUST expose `play`, `pause`, `resume`, `stop`, `reset`, and `finish`
- **AND** `entityProps` MUST only contain `position`, `rotation`, and `scale`

#### Scenario: Entity binding uses `xr-animation`
- **WHEN** the returned `animation` object is passed to an Entity component through `xr-animation`
- **THEN** the SDK MUST treat it as the Entity motion binding input

#### Scenario: Entity remains compatible with `animation` binding
- **WHEN** the returned `animation` object is passed to an Entity component through `animation`
- **THEN** the SDK MUST continue to treat it as a valid Entity motion binding input
- **AND** documentation SHOULD describe `xr-animation` as the recommended shape

#### Scenario: One binding cannot drive multiple entities
- **GIVEN** an `animation` object is already bound to one Entity instance
- **WHEN** application code attempts to bind the same object to a second Entity instance
- **THEN** the SDK MUST fail immediately instead of allowing multi-entity sharing

### Requirement: Entity motion authoring uses Entity props hierarchy

The public Entity motion config MUST use fields aligned with Entity props:
- `position`
- `rotation`
- `scale`

The public v1 authoring surface MUST support segment-style `from` / `to` and percentage `timeline`. `tracks` MAY exist as an internal or advanced execution shape, but unsupported targets MUST fail explicitly.

#### Scenario: Segment config uses Entity props fields
- **WHEN** application code defines `from` or `to` for Entity motion
- **THEN** Entity transform values MUST be authored through `position`, `rotation`, and `scale`
- **AND** `transform.translate`, `transform.rotate`, and `transform.scale` MUST NOT be the public target-state config contract for Entity

#### Scenario: Timeline uses percentage keyframes
- **WHEN** application code defines Entity motion with `timeline`
- **THEN** the SDK MUST accept percentage keys such as `0%`, `50%`, and `100%`
- **AND** each keyframe block MUST use `position`, `rotation`, and `scale`

#### Scenario: Tracks property uses Entity-style paths
- **WHEN** the SDK exposes or internally handles Entity motion `tracks`
- **THEN** property paths MUST use `position.*`, `rotation.*`, and `scale.*`
- **AND** `transform.translate.*`, `transform.rotate.*`, and `transform.scale.*` MUST NOT be the Entity target property-path contract

#### Scenario: Unsupported target fails explicitly
- **WHEN** Entity motion config includes an unsupported target such as `opacity`
- **THEN** the SDK MUST report an explicit failure through validation or `onError`
- **AND** the unsupported target MUST NOT be silently ignored

### Requirement: `entityProps` persists committed transform state

The SDK MUST use `entityProps` as the React-side persistence outlet for committed Entity transform values owned by the animation system.

`entityProps` MUST NOT update every frame. It MUST only update when the animation system commits a meaningful lifecycle value, including start, complete, stop, reset, and finish.

#### Scenario: Complete writes terminal transform to `entityProps`
- **WHEN** a non-looping Entity animation completes naturally
- **THEN** `entityProps` MUST reflect the completed transform state
- **AND** subsequent React renders can preserve that terminal state by spreading `entityProps` onto the Entity component

#### Scenario: No per-frame React outlet updates
- **WHEN** native playback is actively interpolating between keyframes
- **THEN** the SDK MUST NOT update `entityProps` for every animation frame

### Requirement: Playback and callbacks align with the new motion model

Entity motion MUST align with the newer motion-family playback surface and lifecycle semantics while remaining transform-only.

The target callback surface MUST include:
- `onStart`
- `onComplete`
- `onStop`
- `onReset`
- `onError`

Callback values MUST only include supported Entity transform fields.

`api.set(values)` is not a settled requirement yet; whether it is exposed and whether it belongs to the playback API remains a follow-up decision.

#### Scenario: Stop commits a stopped transform state
- **WHEN** application code calls `api.stop()`
- **THEN** the SDK MUST transition the active session to the documented stopped terminal behavior
- **AND** `onStop` MUST receive only Entity transform values
- **AND** `entityProps` MUST be updated to the stopped committed transform state

#### Scenario: Reset restores reset-state transform
- **WHEN** application code calls `api.reset()`
- **THEN** the SDK MUST restore the documented reset transform state
- **AND** `onReset` MUST receive only Entity transform values
- **AND** `entityProps` MUST be updated to the reset committed transform state

#### Scenario: Error callback does not expose unsupported fields
- **WHEN** playback or validation fails for Entity motion
- **THEN** `onError` MUST receive the failure information
- **AND** no callback value payload in the Entity motion API may include unsupported fields such as `opacity`

### Requirement: Active animation owns animated transform fields

During active playback states, the animation system MUST own any animated Entity transform fields. Direct React prop writes to the same fields MUST NOT interrupt playback, MUST NOT immediately override active animation values, and MUST NOT be replayed automatically after completion.

#### Scenario: React props do not override active animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code updates `position`, `rotation`, or `scale` props that are currently animated
- **THEN** those prop writes MUST NOT override the active animation

#### Scenario: Terminal state wins over stale base props
- **GIVEN** an Entity component composes static props and spread `entityProps`
- **WHEN** the animation reaches a terminal state
- **THEN** the committed values in `entityProps` MUST represent the authoritative terminal transform
- **AND** the recommended composition order is for `entityProps` to be applied after stale base props