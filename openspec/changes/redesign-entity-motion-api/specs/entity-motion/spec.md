## ADDED Requirements

### Requirement: `useEntityAnimation` exposes the new Entity motion tuple

The SDK MUST provide `useEntityAnimation(config)` as the public Entity motion hook. The hook MUST return a 3-tuple `[animation, api, entityProps]`.

The returned `animation` object MUST be bindable through `xr-animation` on Entity components and SHOULD remain compatible with `animation` binding. The returned `entityProps` object MUST be a sparse React outlet containing only Entity transform fields: `position`, `rotation`, and `scale`.

#### Scenario: Hook return shape
- **WHEN** application code calls `useEntityAnimation(config)`
- **THEN** the hook MUST return `[animation, api, entityProps]`
- **AND** `api` MUST expose `play`, `pause`, `resume`, `stop`, `reset`, `finish`, and `set`
- **AND** `set` MUST be documented as a state setter for committed transform values rather than a playback command
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

The public v1 authoring surface MUST support segment-style `from` / `to` and percentage `timeline`. `tracks` MUST remain an internal, non-public execution shape and MUST NOT be documented as a public authoring surface. Unsupported targets MUST fail explicitly.

#### Scenario: Segment config uses Entity props fields
- **WHEN** application code defines `from` or `to` for Entity motion
- **THEN** Entity transform values MUST be authored through `position`, `rotation`, and `scale`
- **AND** `transform.translate`, `transform.rotate`, and `transform.scale` MUST NOT be the public target-state config contract for Entity

#### Scenario: Timeline uses percentage keyframes
- **WHEN** application code defines Entity motion with `timeline`
- **THEN** the SDK MUST accept percentage keys such as `0%`, `50%`, and `100%`
- **AND** each keyframe block MUST use `position`, `rotation`, and `scale`

#### Scenario: Tracks property uses Entity-style paths
- **WHEN** the SDK internally handles Entity motion `tracks`
- **THEN** property paths MUST use `position.*`, `rotation.*`, and `scale.*`
- **AND** `transform.translate.*`, `transform.rotate.*`, and `transform.scale.*` MUST NOT be the Entity target property-path contract

#### Scenario: Unsupported target fails explicitly
- **WHEN** Entity motion config includes an unsupported target such as `opacity`
- **THEN** the SDK MUST report an explicit failure through validation or `onError`
- **AND** the unsupported target MUST NOT be silently ignored

### Requirement: `entityProps` persists committed transform state

The SDK MUST use `entityProps` as the React-side persistence outlet for committed Entity transform values owned by the animation system.

`entityProps` MUST NOT update every frame. It MUST only update when the animation system commits a meaningful lifecycle value, including start, complete, stop, reset, finish, and each `api.set` call (including its updater form).

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

`api.set` is a settled requirement. It is the imperative write entry for committed transform state and is specified in the dedicated `api.set` requirement below. It MUST NOT be treated as a playback command.

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

### Requirement: Active animation owns the whole Entity transform

During active playback states, the animation system MUST own the whole Entity transform. Direct React prop writes to `position`, `rotation`, or `scale` MUST NOT interrupt playback, MUST NOT immediately override the active animation, and MUST NOT be replayed automatically after completion. v1 does not implement field-level ownership composition, so ownership applies to the whole transform regardless of which fields the config animates.

#### Scenario: React props do not override active animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code updates any `position`, `rotation`, or `scale` props while an animation is active
- **THEN** those prop writes MUST NOT override the active animation, even for fields the config does not animate

#### Scenario: Terminal state wins over stale base props
- **GIVEN** an Entity component composes static props and spread `entityProps`
- **WHEN** the animation reaches a terminal state
- **THEN** the committed values in `entityProps` MUST represent the authoritative terminal transform
- **AND** the recommended composition order is for `entityProps` to be applied after stale base props


### Requirement: Inactive-state prop writes go through native confirmation

While no animation is active (`idle` or terminal), Source A is authoritative and application code changes the Entity transform by updating `position`, `rotation`, or `scale` props (or by calling `api.set`). Because native is the single authoritative transform source, such prop writes MUST follow the same native-first path as `api.set`: the SDK sends the write to native, native decides whether to accept it, and `entityProps` mirrors only native-confirmed values. The SDK MUST NOT keep a separate local committed cache that competes with native.

#### Scenario: Inactive prop write is confirmed by native
- **GIVEN** no Entity animation is active (`idle` or terminal)
- **WHEN** application code updates `position`, `rotation`, or `scale` props
- **THEN** the SDK MUST submit the write to native, which decides whether to accept it
- **AND** when native accepts, `entityProps` MUST update to the confirmed transform values emitted by native
- **AND** when native rejects, `entityProps` MUST NOT update

### Requirement: Callbacks are notifications and do not drive terminal state

Entity motion lifecycle callbacks MUST be notifications only. Their return values MUST be ignored and MUST NOT be used to control the terminal transform. The terminal transform MUST be determined either by the config declared before playback (such as `to`) or by explicit take-over after playback through `entityProps` or `api.set`.

#### Scenario: onComplete return value is ignored
- **WHEN** an `onComplete` callback returns a value
- **THEN** the SDK MUST ignore that return value
- **AND** the return value MUST NOT override or redefine the committed terminal transform

#### Scenario: Dynamic terminal state uses config or explicit set
- **WHEN** application code needs a terminal transform different from a statically written `to`
- **THEN** it MUST express that either through the pre-playback config or through an explicit `api.set` call after the animation ends
- **AND** it MUST NOT rely on a callback return value to do so

### Requirement: `api.set` is the imperative write entry for committed transform state

The SDK MUST provide `api.set` as the imperative write entry for the committed Entity transform state that `entityProps` mirrors. `api.set` MUST accept either a sparse `EntityMotionProps` value or an updater function `(prev) => next`. `api.set` MUST NOT be a playback command and MUST NOT seek, start, or change playback progress.

Entity transform is composed from two sources: Source A is React props / `entityProps` (the committed state, written declaratively or through `api.set`), and Source B is the `xr-animation` binding (per-frame sampled values). While the animation is active (`delay` / `running` / `paused`) Source B is authoritative; while it is inactive (`idle` / terminal) Source A is authoritative. `api.set` always writes Source A.

The SDK MUST NOT provide a bare `api.get`. Application code that needs to read the current committed value MUST use the updater form of `api.set` or read the declarative `entityProps`.

#### Scenario: set updates committed state and entityProps
- **WHEN** application code calls `api.set(values)` with Entity transform values
- **THEN** the SDK MUST send the write to native, which decides whether to accept it
- **AND** when native accepts, `entityProps` MUST update to the confirmed transform values emitted by native
- **AND** when native rejects, `entityProps` MUST NOT update

#### Scenario: set performs a sparse merge
- **WHEN** application code calls `api.set` with only some transform fields, such as `{ position: { y: 0.3 } }`
- **THEN** the SDK MUST merge on the JS/Core side using the latest confirmed `entityProps` as the baseline, overwrite only the provided fields, and send the full merged value to native
- **AND** omitted fields such as `rotation` and `scale` MUST keep the previous committed values from the baseline

#### Scenario: updater form reads the current committed value
- **WHEN** application code calls `api.set` with an updater function
- **THEN** `prev` MUST be the latest native-confirmed `entityProps` mirror value (Source A), which MAY lag the real-time native transform
- **AND** read-modify-write MUST be expressed through the updater without exposing a bare getter

#### Scenario: set during an active animation does not throw and does not survive terminal fill
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code calls `api.set`
- **THEN** the SDK MUST NOT throw
- **AND** the SDK MUST NOT interrupt or override the active animation
- **AND** the written value MUST NOT be queued for replay after the animation
- **AND** when the animation reaches a terminal state the terminal fill MUST override the value written during the active animation

#### Scenario: Start point after set then play
- **WHEN** application code calls `api.set` and then `api.play()`
- **THEN** if the config declares `from`, playback MUST start from `from`
- **AND** if the config does not declare `from`, playback MUST start from the current committed value

#### Scenario: Terminal fill does not snap back
- **WHEN** an animation reaches a terminal state
- **THEN** the SDK MUST fill to the terminal transform and write it back to `entityProps`
- **AND** the SDK MUST NOT snap the Entity back to the pre-animation value
