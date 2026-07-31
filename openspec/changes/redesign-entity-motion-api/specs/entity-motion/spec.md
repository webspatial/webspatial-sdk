## ADDED Requirements

### Requirement: `useEntityAnimation` exposes the new Entity motion tuple

The SDK MUST provide `useEntityAnimation(config)` as the public Entity motion hook. The hook MUST return a 3-tuple `[animation, api, entityProps]`.

The returned `animation` object MUST be bindable through the `animation` prop on Entity components. An empty `entityProps` object MUST be valid before the first native-confirmed state. Once native returns a confirmed state, `entityProps` MUST represent the complete committed transform with exactly three complete fields: `position`, `rotation`, and `scale`. During inactive playback, the Entity MUST accept the transform produced by the component's combined React props. Initial animation-object creation failure MUST clear the mirror and terminate the current binding lifecycle; same-target config-update failure MUST preserve the mirror and binding lifecycle. Removing the binding MUST clear the mirror and leave the remaining React props in control.

#### Scenario: Hook return shape
- **WHEN** application code calls `useEntityAnimation(config)`
- **THEN** the hook MUST return `[animation, api, entityProps]`
- **AND** `api` MUST expose `play`, `pause`, `stop`, `reset`, `finish`, and `set`
- **AND** `set` MUST be documented as a state setter for committed transform values rather than a playback command
- **AND** after the first native-confirmed state, `entityProps` MUST contain complete `position`, `rotation`, and `scale` values

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

Every animation MUST have both a start boundary and an end boundary: the start is one of top-level `from`, `timeline.from`, or the `0%` frame, and the end is one of top-level `to`, `timeline.to`, or the `100%` frame. Core MUST synchronously throw for a configuration missing either boundary. This constraint applies to all three authoring shapes (top-level `from` / `to`, `timeline.from` / `timeline.to`, and percentage keyframes). Fields *within* a boundary frame MAY still be sparse: scalars omitted in a boundary frame (e.g. writing only `position` and not `rotation`) still fall back to the native baseline under the per-channel missing-frame rule.

Inside a `timeline`, `from` MUST be equivalent to the `0%` frame and `to` MUST be equivalent to the `100%` frame; therefore `timeline.from` / `timeline.to` MAY be mixed with percentage keys in the same `timeline`. Within one `timeline`, `from` and `0%` (or `to` and `100%`) MUST NOT both appear, and defining the same frame twice MUST be rejected explicitly.

The default values MUST be `autoStart: true`, `timingFunction: 'easeInOut'`, `delay: 0`, `playbackRate: 1`, and `loop: false`. A config containing `timeline` MUST provide `duration`; pure top-level `from` / `to` MUST default `duration` to 0.3 seconds. Every transform scalar and percentage MUST be finite, `duration` MUST be positive and finite, `delay` MUST be non-negative and finite, `playbackRate` MUST be positive and finite, `scale` MUST be non-negative, and percentages MUST fall within `[0%, 100%]`. Each timeline frame MUST contain at least one transform scalar. Core MUST synchronously throw for an empty timeline, an empty frame, or percentage keys such as `50%` and `50.0%` that normalize to the same frame.

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
- **THEN** Core MUST synchronously throw a configuration error
- **AND** the missing boundary MUST NOT be filled from the native baseline or the object's current pose

#### Scenario: A timeline requires both start and end boundaries
- **WHEN** application code defines a `timeline` that lacks a start boundary (neither `timeline.from` nor a `0%` frame) or lacks an end boundary (neither `timeline.to` nor a `100%` frame)
- **THEN** Core MUST synchronously throw a configuration error
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
- **AND** if `from` and `0%` (or `to` and `100%`) both appear in the same `timeline`, Core MUST synchronously throw a configuration error

#### Scenario: Tracks property uses Entity-style paths
- **WHEN** the SDK internally handles Entity motion `tracks`
- **THEN** property paths MUST use `position.*`, `rotation.*`, and `scale.*`
- **AND** `transform.translate.*`, `transform.rotate.*`, and `transform.scale.*` MUST NOT be the Entity target property-path contract

#### Scenario: Unsupported target fails explicitly
- **WHEN** Entity motion config includes an unsupported target such as `opacity`
- **THEN** Core MUST synchronously throw a configuration error
- **AND** the unsupported target MUST NOT be silently ignored

### Requirement: Entity rotation has deterministic cross-platform Euler semantics

Entity motion MUST use the Entity's parent-relative local, right-handed coordinate system and Euler degrees. Rotation composition MUST use ZYX intrinsic order, equivalent to XYZ extrinsic order, with matrix order `Rz × Ry × Rx`. Rotation decomposition MUST use the rotation matrix and return `y` in `[-90°, 90°]` and `x` / `z` in `(-180°, 180°]`; at gimbal lock it MUST return `z = 0°` and derive `x` from the matrix. Sparse rotation patches MUST merge onto this canonical complete Euler value before recomposition.

#### Scenario: Equivalent rotations and sparse patches produce canonical Euler values
- **WHEN** visionOS or picoOS confirms an Entity rotation or applies a sparse `api.set` rotation patch
- **THEN** equivalent quaternion representations MUST produce the same canonical Euler value
- **AND** omitted rotation axes MUST retain their values from the canonical complete Euler baseline

### Requirement: `entityProps` persists committed transform state

The SDK MUST use `entityProps` as the React-side persistence outlet for the complete committed Entity transform reported by Native.

`start`, `stop`, `reset`, `finish`, natural completion, and native-accepted `api.set` MUST first commit the pose and then read the Entity's complete current transform again. State-message `values`, callback values, and `SetEntityAnimationResult.values` MUST all use that readback and contain complete `position`, `rotation`, `scale`, and canonical ZYX Euler values.

`entityProps` MUST update when the animation system commits a meaningful lifecycle value, including start, complete, stop, reset, finish, successful config update, and native-accepted `api.set(update)` writes. Initial creation failure MUST clear it to `{}`; config-update failure MUST preserve its current value. An empty `entityProps` object MUST be valid before the first confirmed state. Once native returns a confirmed state, `entityProps` MUST mirror the complete committed transform with complete `position`, `rotation`, and `scale` values. The complete mirror MUST be independent of the fields present in the animation config or an `api.set` update. During inactive playback, spreading `entityProps` after static/base props MUST make that complete committed transform the effective React transform input.

#### Scenario: Complete writes terminal transform to `entityProps`
- **WHEN** a non-looping Entity animation completes naturally
- **THEN** `entityProps` MUST reflect the complete completed transform state, including `position`, `rotation`, and `scale`
- **AND** subsequent React renders can preserve that terminal state by spreading `entityProps` onto the Entity component

#### Scenario: Removing the binding returns control to React props
- **GIVEN** `entityProps` contains a native-confirmed transform
- **WHEN** the Entity animation binding is removed or unbound
- **THEN** the SDK MUST reset the returned `entityProps` to `{}` and schedule a React render
- **AND** spreading that empty object after ordinary React transform props MUST leave those props authoritative

#### Scenario: No per-frame React outlet updates
- **WHEN** native playback is actively interpolating between keyframes
- **THEN** the SDK MUST NOT update `entityProps` for every animation frame

#### Scenario: Looping animation does not commit `entityProps` at loop boundaries
- **GIVEN** an Entity animation with `loop: true`
- **WHEN** the animation crosses a loop boundary
- **THEN** the SDK MUST NOT update `entityProps` at that boundary
- **AND** `entityProps` MUST only be committed on `stop`, `reset`, `finish`, or a native-accepted `api.set(update)`

### Requirement: Playback and callbacks align with the new motion model

Entity motion MUST align with the newer motion-family playback surface and lifecycle semantics while remaining transform-only.

The target callback signatures MUST be `onStart(values: EntityMotionProps)`, `onComplete(values: EntityMotionProps)`, `onStop(values: EntityMotionProps)`, `onReset(values: EntityMotionProps)`, and `onError(error: SpatializedPlaybackError)`. Each lifecycle `values` argument MUST contain the complete confirmed `position`, `rotation`, and `scale`. Callback return values MUST be ignored.

Core `EntityAnimationObject` MUST provide `onStart`, `onComplete`, `onStop`, `onReset`, and `onError` debug-listener methods aligned with those callbacks. These methods MUST only register observers and MUST NOT send playback control or config-update commands. `pause` MUST NOT add `onPause`.

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
- **WHEN** Entity motion has an asynchronous playback or fallback-validation failure in Bridge or Native
- **THEN** `onError` MUST receive the failure information
- **AND** no callback value payload in the Entity motion API may include unsupported fields such as `opacity`

### Requirement: Entity motion has deterministic state and lifecycle transitions

The public Entity motion state MUST use `queued`, `idle`, `running`, `paused`, and `finished`. `queued` MUST represent one or more playback commands waiting for native animation-object creation. Native animation-object creation with no pending playback command MUST keep the public state at `idle`. The implicit `play` generated by `autoStart` MUST count as a pending playback command. During `queued`, `isAnimating`, `isPaused`, and `finished` MUST remain `false`, and queued commands MUST preserve those booleans. During a healthy binding lifecycle, the native creation reply MUST establish the initial public `idle` state. After creation, Native MUST send a state message carrying the latest `playState` for every playback-state change, and Core MUST update public state from that message. Native states MUST use `idle`, `running`, `paused`, and `finished`. A successful native creation reply MUST confirm the initial `idle` state before pending commands are flushed. A failed native creation reply MUST execute the terminal current-binding-lifecycle error path. The public `finished` flag MUST equal the result of `playState === 'finished'`.

Each fresh play MUST store its active native business-controller identity. Native MUST serialize command handlers and controller completion callbacks. A completion event whose controller identity matches the current business controller MUST be eligible to complete that run.

#### Scenario: Native creation reply exits queued
- **GIVEN** one or more playback commands are waiting for native animation-object creation
- **WHEN** the native creation reply arrives
- **THEN** a successful reply MUST confirm public `idle` before the binding flushes pending commands
- **AND** a queued `pause` or `stop` executed against native `idle` MUST preserve public `idle` even when that no-op emits no state event
- **AND** a failed reply MUST execute the terminal creation-failure path

#### Scenario: Initial creation failure terminates the current binding lifecycle
- **GIVEN** initial animation-object creation fails
- **WHEN** the corresponding asynchronous failure reply arrives
- **THEN** the SDK MUST settle the public playback state to `idle`
- **AND** the SDK MUST invalidate the current binding generation and clear the animation-object reference, controller-derived state, and every pending command
- **AND** the SDK MUST clear `entityProps` to `{}` and schedule a React render so static/base React props regain whole-transform authority
- **AND** `onError` MUST fire once with the classified `SpatializedPlaybackError`
- **AND** the current binding lifecycle MUST terminate
- **AND** later `play`, `pause`, `stop`, `reset`, `finish`, and `set` calls on that binding MUST log a warning and perform a no-op
- **AND** those later calls MUST preserve the existing `onError` count
- **AND** later config and callback updates MUST only refresh the latest values stored by the binding
- **AND** explicit unbind followed by rebind, or a new binding, MUST start a new generation from the latest config and callbacks

#### Scenario: Commands preserve idle and finished states deterministically
- **GIVEN** the native animation state is `idle` or `finished`
- **WHEN** application code calls `pause` or `stop`
- **THEN** the current state and callback counts MUST remain stable
- **AND** `play` MUST start a fresh run
- **AND** `reset` MUST commit the configured start pose and enter `idle`
- **AND** `finish` from `idle` MUST commit the configured end pose and enter `finished`
- **AND** that `idle → finished` transition MUST fire `onComplete` once and preserve the existing `onStart` count
- **AND** `finish` from `finished` MUST preserve the finished state and callback counts

#### Scenario: Active commands follow one transition table
- **GIVEN** the native animation state is `running` or `paused`
- **WHEN** application code calls a playback command
- **THEN** `play` MUST preserve `running` or resume `paused` to `running`
- **AND** when `paused` resumes to `running`, Native MUST send a state message carrying only the animation `id`, execution revision, and `playState: running`
- **AND** `pause` MUST move `running` to `paused` and preserve `paused`
- **AND** `stop` MUST commit the current pose and enter `idle`
- **AND** `reset` MUST commit the run's start pose and enter `idle`
- **AND** `finish` MUST commit the configured end pose and enter `finished`

#### Scenario: Reset and finish before first play resolve poses on demand
- **GIVEN** the native animation object has no prior run
- **WHEN** application code calls `reset` or `finish`
- **THEN** Native MUST read the current transform as the baseline
- **AND** Native MUST compute and commit the configured start pose for `reset` or end pose for `finish`

#### Scenario: Finish uses the configured terminal pose for every loop mode
- **GIVEN** an ordinary, reset-loop, or reverse-loop Entity animation
- **WHEN** application code calls `finish`
- **THEN** Native MUST commit the configured `to` / `100%` pose
- **AND** the animation MUST enter `finished`

#### Scenario: Controller completion and a control command are serialized
- **GIVEN** a controller completion callback and `stop`, `reset`, or `finish` become ready concurrently
- **WHEN** Native processes them
- **THEN** the first processed action MUST commit its transition
- **AND** each later action MUST evaluate the resulting state through the same transition table
- **AND** a completion event from a controller other than the current business controller MUST preserve the current state and callback counts

#### Scenario: Lifecycle callbacks have one-shot counts
- **WHEN** one fresh run and its control commands are processed
- **THEN** `onStart` MUST fire exactly once for the accepted fresh play
- **AND** `onComplete` MUST fire exactly once when the animation naturally enters `finished`, or when `finish()` moves it from `idle`, `running`, or `paused` to `finished`
- **AND** each accepted `stop` transition MUST fire `onStop` exactly once
- **AND** each accepted `reset` MUST fire `onReset` exactly once

### Requirement: Entity motion cleanup is controller-scoped and internal commits are isolated

Each `EntityMotionAnimationObject` MUST scope cleanup to the animation controllers it owns. Other animation controllers on the same Entity and its descendants MUST preserve their playback state. A zero-duration pose commit MUST produce the corresponding `callbackAction`, while natural completion MUST remain exclusive to the current business playback controller.

#### Scenario: Playback control preserves unrelated animations
- **GIVEN** an Entity motion run and unrelated Entity or descendant animations are active
- **WHEN** Entity motion processes `stop`, `reset`, `finish`, in-place retarget, or destruction
- **THEN** Native MUST stop and release the controllers owned by that Entity motion object
- **AND** the unrelated Entity and descendant animation controllers MUST preserve their playback state

#### Scenario: Zero-duration playback-control pose commits produce callbackAction
- **GIVEN** accepted `stop`, `reset`, or `finish` requires a zero-duration pose commit
- **WHEN** Native confirms that pose
- **THEN** Native MUST respectively use `stop`, `reset`, or `complete` as `callbackAction` and carry the confirmed transform
- **AND** natural `complete` MUST remain exclusive to the current business playback controller

### Requirement: Entity motion commands preserve per-binding FIFO order

Public `EntityPlaybackApi` methods MAY return `void`. The concrete Core `EntityAnimationObject.set(update)` MUST return `Promise<EntityMotionProps | void>` so the binding can await the `SetEntityAnimation` reply. This promise MUST NOT be exposed through public `EntityPlaybackApi.set(update)`. Each Entity motion binding MUST use an independent FIFO queue. After the Native animation object exists, the binding MUST wait for the current JSB reply before sending the next `update`, playback, or `set` command. Failure settles only the current item and preserves later order.

When a playback control command produces a state message, Native MUST submit that message before confirming current-command completion with an empty success reply; the binding MUST then send the next command. Natural completion MUST produce an independent asynchronous completion state message.

#### Scenario: Playback commands before native object creation are flushed in order
- **GIVEN** an Entity motion binding whose native animation object has not been created
- **WHEN** application code calls `play`, `pause`, `stop`, `reset`, or `finish`
- **THEN** the binding MUST append those playback commands to its pending queue in call order
- **AND** after creation succeeds, the native creation reply MUST first confirm public `idle`
- **AND** the binding MUST then send them one at a time in FIFO order
- **AND** when `autoStart` is enabled, its generated `play` MUST precede the playback commands already pending at creation time

#### Scenario: Commands after Native object creation are serialized
- **GIVEN** the native animation object exists
- **WHEN** application code produces consecutive `update`, playback, or `set` commands
- **THEN** the binding MUST send them one at a time in FIFO order
- **AND** each command MUST wait for the previous JSB reply

#### Scenario: Consecutive config updates coalesce only at a safe position
- **GIVEN** the native animation object exists
- **WHEN** the queue tail contains consecutive unsent config updates
- **THEN** the binding MUST retain only the latest update
- **AND** updates separated by another command MUST preserve their original order
- **AND** after the current update settles, the binding MUST reconcile the latest config again

#### Scenario: Consecutive set then play uses the committed set result
- **GIVEN** the native animation object exists and playback is inactive
- **WHEN** application code calls `api.set(update)` and immediately calls `api.play()`
- **THEN** the binding MUST wait for the `set` reply before sending `play`
- **AND** the success reply `values` MUST contain complete confirmed `position`, `rotation`, and `scale`
- **AND** fresh play MUST read the native transform committed by that `set` as its latest baseline

#### Scenario: Unbind or destruction invalidates pending commands
- **GIVEN** a binding has an in-flight command or commands that have not been sent
- **WHEN** the binding is removed, its target is replaced, its animation object is destroyed, or the binding is destroyed
- **THEN** the SDK MUST discard all commands that have not been sent from that queue generation
- **AND** settlement of an in-flight command MUST NOT dispatch another command from the invalidated generation

### Requirement: Same-target config updates commit in place with deterministic retarget semantics

The Entity motion binding MUST compare canonical timelines and playback options. Equivalent configs MUST represent the same execution definition. Callbacks and `autoStart` MUST be handled separately. `autoStart` MUST only control implicit `play` after initial creation.

`SpatialEntity.createAnimation(config)` and `EntityAnimationObject.update(config)` MUST synchronously normalize and validate initial and updated config respectively.

Unbinding and target replacement MUST advance the binding generation, destroy the current object, and clear `entityProps`. Same-target config changes MUST commit in place through the current `EntityAnimationObject` and id while preserving the binding generation and object. A successful update MUST advance the execution revision. Commands, replies, and events MUST carry the binding generation, id, and execution revision.

#### Scenario: Rebinding starts the new target with an empty mirror
- **GIVEN** the current target has produced confirmed `entityProps`
- **WHEN** the binding moves to a different target
- **THEN** the SDK MUST retire and destroy the old target's animation object
- **AND** the SDK MUST reset `entityProps` to `{}` before establishing confirmed values for the new target

#### Scenario: Execution config change updates the same-target object in place
- **GIVEN** the current binding lifecycle is healthy and an Entity motion binding remains attached to the same target
- **WHEN** its canonical execution definition changes
- **THEN** the SDK MUST enqueue an in-place update in the existing FIFO
- **AND** the Core object, Native object, animation id, and binding generation MUST remain unchanged
- **AND** a successful update MUST store the new config, canonical timeline, and execution revision
- **AND** its success reply MUST carry the complete confirmed pose and update `entityProps`

#### Scenario: Callback-only update keeps the current playback object
- **GIVEN** the current binding lifecycle is healthy and the canonical execution definition remains equal
- **WHEN** one or more lifecycle callback references change
- **THEN** the binding MUST preserve the current object, controller, queue, state, and `entityProps`
- **AND** subsequent accepted events MUST use the latest callback references
- **AND** the SDK MUST update only the callback references

#### Scenario: Equivalent execution config produces no update
- **GIVEN** the current binding lifecycle is healthy
- **WHEN** a new config equals the committed canonical execution definition
- **THEN** the SDK MUST preserve the current object, controller, state, revision, and `entityProps`

#### Scenario: Active config change retargets immediately
- **GIVEN** the Native animation is in delay or `running`
- **WHEN** an execution-config update succeeds
- **THEN** Native MUST use the current pose as this run's temporary start
- **AND** the current pose MUST replace controlled-track `0%` values and provide the baseline for uncontrolled components
- **AND** the first segment MUST use the new `0%` easing, and a later first keyframe MUST interpolate from the current value
- **AND** the new delay, full duration, and playback options MUST start from the beginning
- **AND** the old run MUST preserve the `onStop` and `onComplete` counts
- **AND** the new run MUST fire `onStart` once
- **AND** the new timeline MUST still execute when its terminal pose equals the current pose

#### Scenario: Retarget temporary start preserves configured boundaries
- **GIVEN** an active config update used the current pose as a temporary start
- **WHEN** application code later calls `reset`, `finish`, or replay
- **THEN** `reset` and replay MUST use the new config's `0%`
- **AND** `finish` MUST use the new config's `100%`

#### Scenario: Paused config change remains paused
- **GIVEN** the Native animation is `paused`
- **WHEN** an execution-config update succeeds
- **THEN** Native MUST save the current pose and new definition and remain `paused`
- **AND** callback counts MUST remain unchanged
- **AND** the next `play` MUST run the new timeline from the saved pose and fire `onStart` once

#### Scenario: Inactive config change only installs the definition
- **GIVEN** the Native animation is `idle` or `finished`
- **WHEN** an execution-config update succeeds
- **THEN** Native MUST install the new definition and preserve the current state and callback counts
- **AND** the next play MUST use the new config's start

#### Scenario: Update failure rolls back atomically
- **GIVEN** the current animation object owns a committed execution definition
- **WHEN** Core synchronous validation fails, or Native validation, preparation, or commit fails
- **THEN** a Core-detectable argument error MUST throw locally and synchronously, with the Bridge command count unchanged
- **AND** a Native asynchronous failure MUST preserve the old config, timeline, execution revision, controller, state, pose, write protection, and `entityProps`
- **AND** the Native asynchronous failure MUST fire the latest `onError` exactly once
- **AND** the binding and later FIFO commands MUST continue

#### Scenario: Update accepts only current execution results
- **GIVEN** a successful update has advanced the execution revision
- **WHEN** an old controller completion, command reply, or state event arrives
- **THEN** only a result whose binding generation, animation id, and execution revision all match the current execution MAY update state, `entityProps`, or callbacks
- **AND** other results MUST preserve the current state and callback counts

### Requirement: Entity motion uses dedicated JSB protocols and one id field

Core and Native MUST use `CreateEntityAnimation`, `UpdateEntityAnimation`, `ControlEntityAnimation`, and `SetEntityAnimation` independently from the Spatialized Element animation protocol. The create request `id` MUST be the target Entity's `SpatialObject.id`; the successful create reply `id` MUST be the new Entity animation object's `SpatialObject.id`. Later update, control, set, state-event, and error-event traffic MUST directly use that animation-object `id` and MUST NOT introduce `elementId` or `animationId` aliases.

Every playback-state confirmation or lifecycle callback MUST use the same `EntityMotionStateChangedDetail` and carry the animation `id`, execution revision, and latest `playState`. Messages that trigger lifecycle callbacks MUST carry both `callbackAction` and complete `values`; the complete `callbackAction` set MUST be `start`, `complete`, `stop`, and `reset`. Explicit `finish()` and natural completion MUST both use `callbackAction: complete`. Pause and resume messages MUST carry only `id`, execution revision, and `playState`. Public `finished` MUST derive from `playState === 'finished'`. Asynchronous errors MUST use the dedicated `entityanimationerror` event. `SpatializedPlaybackError` MUST expose only a stable `code` and readable `reason`.

Native MUST create `EntityMotionAnimationObject` through the target `SpatialEntity.createAnimation(config)` and MUST NOT introduce `EntityMotionManager`. Core `EntityAnimationObject` MUST directly use the `id` inherited from `SpatialObject` and privately store the latest successfully committed public `config`, normalized `timeline`, and execution revision. Native `EntityMotionAnimationObject.emitStateChanged()` MUST be private.

#### Scenario: Creation uses the target and animation object ids directly
- **GIVEN** Core requests an Entity animation for a target `SpatialEntity`
- **WHEN** Native handles `CreateEntityAnimation`
- **THEN** the request `id` MUST resolve the target through its `SpatialObject.id`
- **AND** the target `SpatialEntity.createAnimation(config)` MUST create the animation object
- **AND** the successful reply `id` MUST be the created animation object's inherited `SpatialObject.id`

#### Scenario: Update, control, set, state, and error traffic use dedicated channels
- **GIVEN** an Entity animation object has been created
- **WHEN** Core updates config, controls playback, sets a transform, or consumes a Native event
- **THEN** update, control, and set commands and both event types MUST address the animation object through `id`
- **AND** a successful update MUST return complete confirmed pose and execution revision through `UpdateEntityAnimationResult`
- **AND** every playback-state confirmation or lifecycle callback MUST use `EntityMotionStateChangedDetail`
- **AND** a successful set MUST return confirmed values through `SetEntityAnimationResult` without a state event
- **AND** an asynchronous error MUST use `entityanimationerror` with `code` and `reason`

### Requirement: Every fresh play compiles against the latest native baseline

When native creates an animation, it MUST fallback-validate and store the canonical timeline, register the animation object, and return its `id`; it MUST NOT read the playback baseline or generate a RealityKit playback resource during creation. A fresh play is the first `play` / `autoStart` after creation, or a `play` that starts again after `complete`, `finish`, `stop`, or `reset`. After each fresh play is accepted and before entering `delay` / `running`, native MUST read the current `entity.transform` as that run's baseline and compile the RealityKit playback resource from the canonical timeline and that baseline. Fields explicitly declared by the config MUST use config values, while fields omitted from the config MUST be filled from that run's baseline.

When no config update succeeded while paused, a `play` after `pause` MUST resume the current playback controller and progress and MUST NOT read a new baseline or recompile. When a config update succeeded while paused, the next `play` MUST start a new execution from the saved pose under the paused-retarget rules. Loops within one fresh play MUST reuse that run's playback resource and MUST NOT read a new baseline or recompile at each loop boundary.

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

#### Scenario: Play after pause resumes the current run when config is unchanged
- **GIVEN** the animation is paused, retains its current playback controller and resource, and no config update succeeded while paused
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

### Requirement: Active animation protects the entire Entity transform

During `delay`, `running`, and `paused`, the animation system MUST control the entire Entity transform. The underlying platforms (visionOS / picoOS) bind the whole `.transform`; configured components animate and the remaining components MUST hold their baseline values. Native MUST enable whole-transform write protection for each fresh play and keep it through pause. While that protection is active, the latest confirmed `entityProps` values MUST remain stable, and the SDK MUST discard direct React prop writes immediately. An `api.set` call made after native object creation MUST retain FIFO ordering, reach Native, receive `INVALID_CONTROL_STATE`, and map that result to one warning plus no-op without `onError`. Native `SpatialScene` MUST perform whole-transform animating-mask arbitration at the ordinary Entity transform update entry, returning success while preserving the current native transform.

For `stop`, `reset`, `finish`, and natural completion, Native MUST commit the corresponding pose, obtain the Entity's complete current transform, remove whole-transform write protection, and then emit the state event carrying that transform. Unbinding, binding termination, and animation-object destruction MUST also remove the protection as cleanup paths. While playback is inactive and no protection is present, ordinary Entity transform updates MUST update the native transform.

#### Scenario: React props do not override the active animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code updates any transform component while the animation is active
- **THEN** those prop writes MUST NOT override the active animation

#### Scenario: Pause keeps transform write protection
- **GIVEN** an Entity animation is running
- **WHEN** the application pauses it
- **THEN** ordinary React transform writes MUST remain blocked
- **AND** the paused animation MUST preserve its current pose

#### Scenario: Components not in the config freeze at baseline during animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`, and the config does not animate some component (e.g. it only animates `position`)
- **WHEN** application code updates that **component not written in the config** (e.g. `rotation`) while the animation is active
- **THEN** the component MUST remain at baseline and the SDK MUST discard the prop write immediately
- **AND** after the animation becomes inactive, a dynamic transform change MUST be expressed through `api.set`

#### Scenario: Terminal state wins over stale base props
- **GIVEN** an Entity component composes static props and spread `entityProps`
- **WHEN** the animation reaches a terminal state
- **THEN** the complete committed `position`, `rotation`, and `scale` values in `entityProps` MUST represent the authoritative terminal transform
- **AND** the recommended composition order is for `entityProps` to be applied after stale base props

#### Scenario: Playback completion restores React transform writes
- **GIVEN** an Entity animation is active
- **WHEN** it stops, resets, finishes, or completes naturally
- **THEN** Native MUST commit the corresponding complete pose
- **AND** Native MUST remove whole-transform write protection before reporting the complete current transform
- **AND** subsequent ordinary React transform updates MUST update the native transform


### Requirement: Dynamic take-over uses `api.set`

During inactive playback, the component's combined React props MUST control the complete Entity transform. Before the first confirmed state, `entityProps` MAY be empty, so the base props determine the combined value. After a confirmed state, spreading complete `entityProps` after base props MUST make it the effective React transform value. `api.set` MUST update the native committed transform and then update `entityProps` from the complete transform returned by Native.

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

The SDK MUST provide `api.set` as the imperative write entry for the committed Entity transform state that `entityProps` mirrors. `api.set` MUST only accept a sparse `EntityTransformUpdate` object (the same `{ position?, rotation?, scale? }` shape as the read-side `EntityMotionProps`, but named distinctly) and MUST NOT support the updater function form `(prev) => next`. A valid update MUST contain at least one transform scalar; `api.set({})` and updates containing only empty nested objects MUST synchronously throw. `api.set` MUST NOT be a playback command and MUST NOT seek, start, change playback progress, or change `playState`.

Entity transform writes MUST be arbitrated as one whole. During inactive playback, the component's combined React props control the transform. While the animation is active (`delay` / `running` / `paused`), Native animation controls the entire transform and blocks ordinary React transform writes; configured fields animate and the remaining fields hold their baseline values. Stop, reset, finish, and natural completion MUST remove that protection after committing the corresponding pose. Active retarget MUST keep whole-transform write protection continuously active. During inactive states, `api.set` updates the native committed transform and Core updates `entityProps` from Native's complete result. Initial creation failure terminates the current binding lifecycle and clears `entityProps`; config-update failure preserves current protection and mirror. Removing the binding also clears `entityProps`.

The SDK MUST NOT provide a bare `api.get`. Application code that needs to read the current committed value MUST read declarative `entityProps`, compute its own update, and pass it to `api.set(update)`. `entityProps` MAY be empty before the first native-confirmed state and MUST NOT be promised readable at mount: creating or binding the animation MUST NOT emit an extra initial confirmed value. To read a meaningful native pose, application code MUST first trigger a lifecycle that commits a confirmed value (a `play` that reaches a terminal / lifecycle node, or an accepted `api.set`).

#### Scenario: set updates committed state and entityProps
- **WHEN** application code calls `api.set(update)` with an Entity transform update
- **THEN** the SDK MUST send the write to native, which decides whether to accept it
- **AND** when native accepts, it MUST update the Entity and return its complete current `position`, `rotation`, and `scale` through `SetEntityAnimationResult.values`
- **AND** Core MUST update `entityProps` from that success reply
- **AND** `set` MUST NOT produce `EntityMotionStateChangedMsg`
- **AND** when native rejects, `entityProps` MUST NOT update, and the rejection MUST surface a console warning rather than an `onError` event

#### Scenario: set performs a sparse merge
- **WHEN** application code calls `api.set` with only some transform fields, such as `{ position: { y: 0.3 } }`
- **THEN** the SDK MUST send that sparse update to native instead of merging a full value on the JS/Core side using `entityProps`
- **AND** native MUST use the current committed `entity.transform` as the baseline and overwrite only fields provided in the update
- **AND** omitted fields such as `rotation` and `scale` MUST keep the previous committed values from the native committed baseline

#### Scenario: set does not support updater form
- **WHEN** application code calls `api.set` with an updater function
- **THEN** the SDK MUST explicitly reject the call
- **AND** the SDK MUST NOT fabricate `prev` from an empty object, defaults, or a stale mirror
- **AND** read-modify-write MUST be expressed by reading `entityProps` and then explicitly calling `api.set(update)`

#### Scenario: set during an active animation is not stashed
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code calls `api.set`
- **THEN** the SDK MUST NOT interrupt or override the active animation
- **AND** native MUST NOT stash the write and MUST NOT replay it after the animation ends
- **AND** `entityProps` MUST NOT update due to that write
- **AND** the rejected write MUST be a no-op that surfaces a console warning, and MUST NOT be delivered through `onError`

#### Scenario: set before binding, before native object creation, or after binding termination is invalid
- **GIVEN** the Entity motion binding is not bound yet, the corresponding native object has not been created, or the current binding lifecycle has terminated
- **WHEN** application code calls `api.set`
- **THEN** the SDK MUST NOT create a pending write
- **AND** the write MUST NOT be replayed after later binding or native object creation
- **AND** the rejected write MUST be a no-op that surfaces a console warning, and MUST NOT be delivered through `onError`

#### Scenario: Start point after set then play
- **GIVEN** the native animation object exists and playback is inactive
- **WHEN** application code calls `api.set` and then `api.play()`
- **THEN** playback MUST start from the start boundary declared by the config (top-level `from`, `timeline.from`, or the `0%` frame)
- **AND** the binding MUST wait for the `api.set` JSB reply before sending `api.play()`
- **AND** this `api.play()` MUST act as a fresh play and read the latest native transform after `api.set`
- **AND** fields omitted from the config MUST use that latest transform as this run's baseline
- **AND** because the start boundary is required, there is no valid config with "no start frame"; a config missing the start boundary has already been rejected during normalization

#### Scenario: Terminal fill does not snap back
- **WHEN** an animation reaches a terminal state
- **THEN** the SDK MUST fill to the terminal transform and write it back to `entityProps`
- **AND** the SDK MUST NOT snap the Entity back to the pre-animation value

### Requirement: Playback errors are classified

The SDK MUST synchronously throw the built-in `Error` for programmer errors detectable from public config or method arguments and MUST preserve the existing `onError` count. A JSB command failure MUST be converted from that command's reply into one `SpatializedPlaybackError`. An asynchronous native failure after a successful command reply MUST trigger `onError` exactly once through `entityanimationerror`. State events MUST NOT carry errors, and the same failure MUST NOT be reported through both a reply and an error event. Error codes MUST cover at least `TARGET_NOT_FOUND`, `UNSUPPORTED_TARGET`, `ANIMATION_NOT_FOUND`, `INVALID_TIMELINE`, `COMPILATION_FAILED`, and `INVALID_SET_VALUES`. Asynchronous initial animation-object creation failure MUST terminate the current binding lifecycle; asynchronous config-update failure MUST roll back atomically and preserve the current lifecycle; other asynchronous playback failures MUST preserve their existing state semantics. Rejected `api.set` writes during an active animation, before binding / native object creation, or after current-binding termination MUST remain no-ops that emit a console warning.

#### Scenario: Error code is distinguishable
- **WHEN** an Entity motion operation fails asynchronously in Bridge or Native
- **THEN** `onError` MUST receive a `SpatializedPlaybackError` whose `code` identifies the failure kind
- **AND** application code MUST be able to branch on `code` and use `reason` as the readable diagnostic

### Requirement: Entity target destruction synchronizes associated animation cleanup

If an Entity target is destroyed first, the SDK MUST destroy its associated animation objects and Native MUST send `objectdestroy` for each animation id. Core MUST consume that message, mark the matching animation object destroyed, and unregister the event receiver for that animation id. After synchronization, playback commands MUST complete locally as no-ops and produce zero JSB commands; `api.set` MUST log a warning, complete locally as a no-op, produce zero JSB commands, and preserve the existing `onError` count. An in-flight command racing with teardown MAY end with `ANIMATION_NOT_FOUND`.

#### Scenario: Target-first destruction cascades animation cleanup
- **WHEN** an Entity target is destroyed before its associated native animation objects
- **THEN** Native MUST destroy every associated animation and send `objectdestroy` for each animation id
- **AND** Core MUST mark the object destroyed, unregister its event receiver, and complete later playback and `api.set` locally

#### Scenario: Control command races teardown
- **WHEN** a control command races with animation-object teardown
- **THEN** it MAY fail with `ANIMATION_NOT_FOUND`