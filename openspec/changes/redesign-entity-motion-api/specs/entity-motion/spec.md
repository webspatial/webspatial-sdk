## ADDED Requirements

### Requirement: `useEntityAnimation` exposes the new Entity motion tuple

The SDK MUST provide `useEntityAnimation(config)` as the public Entity motion hook. The hook MUST return a 3-tuple `[animation, api, entityProps]`.

The returned `animation` object MUST be bindable through the `animation` prop on Entity components. The returned `entityProps` object MAY be empty before the first native-confirmed state; once native returns a confirmed state, `entityProps` MUST represent the transform components committed by the animation system (the end values of animated components plus components written via `api.set`), limited to the `position`, `rotation`, and `scale` fields and no other properties; components never written by an animation or `api.set` MUST NOT appear in `entityProps`.

#### Scenario: Hook return shape
- **WHEN** application code calls `useEntityAnimation(config)`
- **THEN** the hook MUST return `[animation, api, entityProps]`
- **AND** `api` MUST expose `play`, `pause`, `stop`, `reset`, `finish`, and `set`
- **AND** `set` MUST be documented as a state setter for committed transform values rather than a playback command
- **AND** `entityProps` MUST only contain `position`, `rotation`, and `scale`

#### Scenario: Entity binding uses `animation`
- **WHEN** the returned `animation` object is passed to an Entity component through the `animation` prop
- **THEN** the SDK MUST treat it as the Entity motion binding input

#### Scenario: One binding cannot drive multiple entities
- **GIVEN** an `animation` object is already bound to one Entity instance
- **WHEN** application code attempts to bind the same object to a second Entity instance
- **THEN** the SDK MUST fail immediately instead of allowing multi-entity sharing

### Requirement: Entity motion authoring uses Entity props hierarchy

The public Entity motion config MUST use fields aligned with Entity props:
- `position`
- `rotation`
- `scale`

The public v1 authoring surface MUST support three shapes: top-level `from` / `to`, segment-style `timeline.from` / `timeline.to`, and percentage keyframes. Top-level `from` / `to` MUST be equivalent authoring sugar for `timeline.from` / `timeline.to`: Core MUST normalize both into the same single internal track set. `tracks` MUST remain an internal, non-public execution shape and MUST NOT be documented as a public authoring surface. Unsupported targets MUST fail explicitly.

Every animation MUST have both a start boundary and an end boundary: the start is one of top-level `from`, `timeline.from`, or the `0%` frame, and the end is one of top-level `to`, `timeline.to`, or the `100%` frame; a configuration missing either boundary MUST be rejected explicitly (through validation or `onError`) and MUST NOT fill the missing boundary frame from the native baseline or the object's current pose. This constraint applies to all three authoring shapes (top-level `from` / `to`, `timeline.from` / `timeline.to`, and percentage keyframes). Fields *within* a boundary frame MAY still be sparse: scalars omitted in a boundary frame (e.g. writing only `position` and not `rotation`) still fall back to the native baseline under the per-channel missing-frame rule; what is required is that the boundary frames themselves exist, not that every field inside a frame be written.

Inside a `timeline`, `from` MUST be equivalent to the `0%` frame and `to` MUST be equivalent to the `100%` frame; therefore `timeline.from` / `timeline.to` MAY be mixed with percentage keys in the same `timeline`. Within one `timeline`, `from` and `0%` (or `to` and `100%`) MUST NOT both appear, and defining the same frame twice MUST be rejected explicitly.

#### Scenario: Segment config uses Entity props fields
- **WHEN** application code defines `timeline.from` or `timeline.to` for Entity motion
- **THEN** Entity transform values MUST be authored through `position`, `rotation`, and `scale`
- **AND** `transform.translate`, `transform.rotate`, and `transform.scale` MUST NOT be the public target-state config contract for Entity

#### Scenario: Top-level from/to authors a segment
- **WHEN** application code defines top-level `from` and `to` in the Entity motion config
- **THEN** Entity transform values MUST be authored through `position`, `rotation`, and `scale`
- **AND** Core MUST normalize top-level `from` / `to` into the same internal track set as `timeline.from` / `timeline.to`
- **AND** when top-level `from` / `to` are the only authoring form and no percentage key is used, `duration` MUST default to 0.3 seconds

#### Scenario: Top-level from/to require both boundaries
- **WHEN** application code supplies only top-level `from` or only top-level `to`
- **THEN** Core MUST reject the configuration explicitly through validation or `onError`
- **AND** the missing boundary MUST NOT be filled from the native baseline or the object's current pose

#### Scenario: A timeline requires both start and end boundaries
- **WHEN** application code defines a `timeline` that lacks a start boundary (neither `timeline.from` nor a `0%` frame) or lacks an end boundary (neither `timeline.to` nor a `100%` frame)
- **THEN** Core MUST reject the configuration explicitly through validation or `onError`
- **AND** the missing boundary frame MUST NOT be implicitly filled from the native baseline or the object's current pose
- **AND** this constraint targets only the existence of the boundary frames; scalar fields omitted inside a boundary frame MUST still fall back to the native baseline under the per-channel missing-frame rule

#### Scenario: timeline takes precedence over top-level from/to
- **GIVEN** a config that contains both a `timeline` and top-level `from` / `to`
- **WHEN** Core normalizes the config
- **THEN** the `timeline` MUST determine the animation and the top-level `from` / `to` MUST be ignored
- **AND** Core MUST emit a development-mode warning that the top-level `from` / `to` were ignored

#### Scenario: Timeline uses percentage keyframes
- **WHEN** application code defines Entity motion with `timeline`
- **THEN** the SDK MUST accept percentage keys such as `0%`, `50%`, and `100%`
- **AND** each keyframe block MUST use `position`, `rotation`, and `scale`

#### Scenario: Mixing from/to with percentages in a timeline
- **WHEN** application code defines both `from` / `to` and percentage keys (such as `50%`) in the same `timeline`
- **THEN** Core MUST treat `from` as the `0%` frame and `to` as the `100%` frame and normalize them into the same internal track set
- **AND** if `from` and `0%` (or `to` and `100%`) both appear in the same `timeline`, Core MUST reject it explicitly through validation or `onError`

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

`entityProps` MUST NOT update every frame. It MUST only update when the animation system commits a meaningful lifecycle value, including start, complete, stop, reset, finish, and native-accepted `api.set(values)` writes. Before the first confirmed state, `entityProps` MAY be empty; once native returns a confirmed state, it MUST mirror the transform components committed by the animation system (the end values of animated components plus components written via `api.set`), limited to the `position` / `rotation` / `scale` fields; components never written by an animation or `api.set` MUST NOT appear in `entityProps`, so spreading it does not override components the user controls through React props.

#### Scenario: Complete writes terminal transform to `entityProps`
- **WHEN** a non-looping Entity animation completes naturally
- **THEN** `entityProps` MUST reflect the completed transform state
- **AND** subsequent React renders can preserve that terminal state by spreading `entityProps` onto the Entity component

#### Scenario: No per-frame React outlet updates
- **WHEN** native playback is actively interpolating between keyframes
- **THEN** the SDK MUST NOT update `entityProps` for every animation frame

#### Scenario: Looping animation does not commit `entityProps` at loop boundaries
- **GIVEN** an Entity animation with `loop: true`
- **WHEN** the animation crosses a loop boundary
- **THEN** the SDK MUST NOT update `entityProps` at that boundary
- **AND** `entityProps` MUST only be committed on `stop`, `finish`, or a native-accepted `api.set(values)`

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

### Requirement: Every fresh play compiles against the latest native baseline

When native creates an animation, it MUST fallback-validate and store the canonical timeline, register the animation object, and return an `animationId`; it MUST NOT read the playback baseline or generate a RealityKit playback resource during creation. A fresh play is the first `play` / `autoStart` after creation, or a `play` that starts again after `complete`, `finish`, `stop`, or `reset`. After each fresh play is accepted and before entering `delay` / `running`, native MUST read the current `entity.transform` as that run's baseline and compile the RealityKit playback resource from the canonical timeline and that baseline. Fields explicitly declared by the config MUST use config values, while fields omitted from the config MUST be filled from that run's baseline.

A `play` after `pause` MUST resume the current playback controller and progress and MUST NOT read a new baseline or recompile. Loops within one fresh play MUST reuse that run's playback resource and MUST NOT read a new baseline or recompile at each loop boundary.

#### Scenario: First playback reads baseline at play time
- **GIVEN** native has created and registered the animation object
- **WHEN** application code calls `play` for the first time or triggers `autoStart`
- **THEN** native MUST read the current `entity.transform` after accepting the fresh play
- **AND** native MUST compile and start that run using the transform as its baseline

#### Scenario: Replay after a terminal state uses the latest baseline
- **GIVEN** the animation became inactive through `complete`, `finish`, `stop`, or `reset`, and the current native transform has changed
- **WHEN** application code calls `play` again
- **THEN** native MUST treat the call as a fresh play
- **AND** native MUST read the latest native transform and recompile that run's playback resource

#### Scenario: Play after pause resumes the current run
- **GIVEN** the animation is paused and retains its current playback controller and resource
- **WHEN** application code calls `play`
- **THEN** native MUST resume the current playback progress
- **AND** native MUST NOT read a new baseline or recompile

#### Scenario: Loop reuses the current run's resource
- **GIVEN** the current fresh play is configured to loop
- **WHEN** playback reaches a loop boundary
- **THEN** native MUST reuse the current playback resource for the next iteration
- **AND** native MUST NOT read a new baseline or recompile at that boundary

#### Scenario: Fresh-play compilation fails
- **WHEN** native cannot generate a RealityKit playback resource from the canonical timeline and that run's baseline
- **THEN** the fresh-play control command MUST fail explicitly
- **AND** the animation MUST remain inactive

### Requirement: Active animation owns the entire Entity transform

During active playback states, the animation system MUST own the entire Entity transform: the underlying platforms (visionOS / picoOS) can only bind the whole `.transform`, so as soon as any animation field appears in the config the entire transform is owned by the animation during active playback. Components not written in the config MUST be frozen at baseline. During this period, direct React prop writes or `api.set` writes to any component MUST NOT interrupt playback, MUST NOT immediately override the active animation, and MUST NOT be replayed automatically after completion; such writes MUST take effect only once the animation becomes inactive.

#### Scenario: React props do not override the active animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code updates any transform component while the animation is active
- **THEN** those prop writes MUST NOT override the active animation

#### Scenario: Components not in the config freeze at baseline during animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`, and the config does not animate some component (e.g. it only animates `position`)
- **WHEN** application code updates that **component not written in the config** (e.g. `rotation`) while the animation is active
- **THEN** the prop write MUST NOT take effect immediately, the component MUST stay frozen at baseline, and it MUST only be taken over by props / `api.set` once the animation becomes inactive

#### Scenario: Terminal state wins over stale base props
- **GIVEN** an Entity component composes static props and spread `entityProps`
- **WHEN** the animation reaches a terminal state
- **THEN** the committed values in `entityProps` MUST represent the authoritative terminal transform
- **AND** the recommended composition order is for `entityProps` to be applied after stale base props


### Requirement: Dynamic take-over uses `api.set`

While no animation is active (`idle` or terminal), Source A is authoritative. Application code that needs to dynamically take over the committed Entity transform after animation MUST use `api.set`. Ordinary Entity props remain static/base inputs in the recommended composition pattern and MUST NOT be treated as a second dynamic take-over channel that competes with `entityProps`.

#### Scenario: Inactive dynamic take-over uses set
- **GIVEN** no Entity animation is active (`idle` or terminal)
- **WHEN** application code needs to take over the committed `position`, `rotation`, or `scale`
- **THEN** it MUST call `api.set` with the desired Entity transform values
- **AND** static/base Entity props MUST NOT override `entityProps` in the recommended composition order

### Requirement: Callbacks are notifications and do not drive terminal state

Entity motion lifecycle callbacks MUST be notifications only. Their return values MUST be ignored and MUST NOT be used to control the terminal transform. The terminal transform MUST be determined either by the config declared before playback (such as top-level `to` or `timeline.to`) or by explicit take-over after playback through `entityProps` or `api.set`.

#### Scenario: onComplete return value is ignored
- **WHEN** an `onComplete` callback returns a value
- **THEN** the SDK MUST ignore that return value
- **AND** the return value MUST NOT override or redefine the committed terminal transform

#### Scenario: Dynamic terminal state uses config or explicit set
- **WHEN** application code needs a terminal transform different from a statically written top-level `to` or `timeline.to`
- **THEN** it MUST express that either through the pre-playback config or through an explicit `api.set` call after the animation ends
- **AND** it MUST NOT rely on a callback return value to do so

### Requirement: `api.set` is the imperative write entry for committed transform state

The SDK MUST provide `api.set` as the imperative write entry for the committed Entity transform state that `entityProps` mirrors. `api.set` MUST only accept a sparse `EntityMotionPatch` object (the write-side patch type; the same `{ position?, rotation?, scale? }` shape as the read-side `EntityMotionProps`, but named distinctly) and MUST NOT support the updater function form `(prev) => next`. `api.set` MUST NOT be a playback command and MUST NOT seek, start, or change playback progress.

Entity transform is composed from two sources: Source A is static/base React props plus `entityProps` (the committed state mirrored by the SDK; dynamic take-over is written through `api.set`), and Source B is the `animation` binding (per-frame sampled values). Arbitration MUST be over the whole transform uniformly: while the animation is active (`delay` / `running` / `paused`) Source B is authoritative for the entire transform (components not written in the config are frozen at baseline by Source B), and while it is inactive (`idle` / terminal) Source A is authoritative. `api.set` always writes Source A and is reflected on the transform only while the animation is inactive.

The SDK MUST NOT provide a bare `api.get`. Application code that needs to read the current committed value MUST read declarative `entityProps`, and compute its own patch before calling `api.set(values)` when it needs to write. `entityProps` MAY be empty before the first native-confirmed state and MUST NOT be promised readable at mount: creating or binding the animation MUST NOT emit an extra initial confirmed value. To read a meaningful native pose, application code MUST first trigger a lifecycle that commits a confirmed value (a `play` that reaches a terminal / lifecycle node, or an accepted `api.set`).

#### Scenario: set updates committed state and entityProps
- **WHEN** application code calls `api.set(values)` with Entity transform values
- **THEN** the SDK MUST send the write to native, which decides whether to accept it
- **AND** when native accepts, `entityProps` MUST update to the confirmed transform values emitted by native
- **AND** when native rejects, `entityProps` MUST NOT update, and the rejection MUST surface a console warning rather than an `onError` event

#### Scenario: set performs a sparse merge
- **WHEN** application code calls `api.set` with only some transform fields, such as `{ position: { y: 0.3 } }`
- **THEN** the SDK MUST send that sparse patch to native instead of merging a full value on the JS/Core side using `entityProps`
- **AND** native MUST use the current committed `entity.transform` as the baseline and overwrite only fields provided in the patch
- **AND** omitted fields such as `rotation` and `scale` MUST keep the previous committed values from the native committed baseline

#### Scenario: set does not support updater form
- **WHEN** application code calls `api.set` with an updater function
- **THEN** the SDK MUST explicitly reject the call
- **AND** the SDK MUST NOT fabricate `prev` from an empty object, defaults, or a stale mirror
- **AND** read-modify-write MUST be expressed by reading `entityProps` and then explicitly calling `api.set(values)`

#### Scenario: set during an active animation is not stashed
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code calls `api.set`
- **THEN** the SDK MUST NOT interrupt or override the active animation
- **AND** native MUST NOT stash the write and MUST NOT replay it after the animation ends
- **AND** `entityProps` MUST NOT update due to that write
- **AND** the rejected write MUST be a no-op that surfaces a console warning, and MUST NOT be delivered through `onError`

#### Scenario: set before binding or native object creation is invalid
- **GIVEN** the Entity motion binding is not bound yet, or the corresponding native object has not been created
- **WHEN** application code calls `api.set`
- **THEN** the SDK MUST NOT create a pending write
- **AND** the write MUST NOT be replayed after later binding or native object creation
- **AND** the rejected write MUST be a no-op that surfaces a console warning, and MUST NOT be delivered through `onError`

#### Scenario: Start point after set then play
- **WHEN** application code calls `api.set` and then `api.play()`
- **THEN** playback MUST start from the start boundary declared by the config (top-level `from`, `timeline.from`, or the `0%` frame)
- **AND** this `api.play()` MUST act as a fresh play and read the latest native transform after `api.set`
- **AND** fields omitted from the config MUST use that latest transform as this run's baseline
- **AND** because the start boundary is required, there is no valid config with "no start frame"; a config missing the start boundary has already been rejected during normalization

#### Scenario: Terminal fill does not snap back
- **WHEN** an animation reaches a terminal state
- **THEN** the SDK MUST fill to the terminal transform and write it back to `entityProps`
- **AND** the SDK MUST NOT snap the Entity back to the pre-animation value

### Requirement: Playback errors are classified

The SDK MUST expose a closed `SpatializedPlaybackError.code` classification for Entity motion failures, covering at least `TARGET_NOT_FOUND`, `UNSUPPORTED_TARGET`, and `TARGET_DESTROYED`. All classified failures MUST be delivered to the user through `onError`. Rejected `api.set` writes — during an active animation, or before binding / native object creation — MUST NOT be delivered through `onError`; they MUST be no-ops that emit a console warning.

#### Scenario: Error code is distinguishable
- **WHEN** an Entity motion operation fails
- **THEN** `onError` MUST receive a `SpatializedPlaybackError` whose `code` identifies the failure kind
- **AND** application code MUST be able to branch on `code` without parsing `message`
