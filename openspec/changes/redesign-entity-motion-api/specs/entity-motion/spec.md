## ADDED Requirements

### Requirement: `useEntityAnimation` exposes the new Entity motion tuple

The SDK MUST provide `useEntityAnimation(config)` as the public Entity motion hook. The hook MUST return a 3-tuple `[animation, api, entityProps]`.

The returned `animation` object MUST be bindable through the `animation` prop on Entity components. An empty `entityProps` object MUST be valid before the first native-confirmed state. Once native returns a confirmed state, `entityProps` MUST represent the complete committed transform with exactly three complete fields: `position`, `rotation`, and `scale`. While the binding remains attached, this complete mirror owns the inactive transform; removing the binding MUST return transform control to React props.

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

The SDK MUST use `entityProps` as the React-side persistence outlet for the complete committed Entity transform owned by the animation system.

`entityProps` MUST update only when the animation system commits a meaningful lifecycle value, including start, complete, stop, reset, finish, and native-accepted `api.set(values)` writes. An empty `entityProps` object MUST be valid before the first confirmed state. Once native returns a confirmed state, `entityProps` MUST mirror the complete committed transform with complete `position`, `rotation`, and `scale` values. The complete mirror MUST be independent of the fields present in the animation config or an `api.set` patch. While the animation binding remains attached, spreading `entityProps` after static/base props MUST keep that complete committed transform authoritative.

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
- **AND** `entityProps` MUST only be committed on `stop`, `reset`, `finish`, or a native-accepted `api.set(values)`

### Requirement: Playback and callbacks align with the new motion model

Entity motion MUST align with the newer motion-family playback surface and lifecycle semantics while remaining transform-only.

The target callback signatures MUST be `onStart(values: EntityMotionProps)`, `onComplete(values: EntityMotionProps)`, `onStop(values: EntityMotionProps)`, `onReset(values: EntityMotionProps)`, and `onError(error: SpatializedPlaybackError)`. Each lifecycle `values` argument MUST contain the complete confirmed `position`, `rotation`, and `scale`. Callback return values MUST be ignored.

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

The public Entity motion state MUST use `queued`, `idle`, `running`, `paused`, and `finished`. `queued` MUST represent the React binding period before native animation-object creation. During `queued`, `isAnimating`, `isPaused`, and `finished` MUST remain `false`, and queued commands MUST preserve those booleans. Native state events MUST use `idle`, `running`, `paused`, and `finished` and MUST be the sole data source for public playback state and booleans. The public `finished` flag MUST equal the result of `playState === 'finished'`.

Each fresh play MUST store its active native business-controller identity. Native MUST serialize command handlers and controller completion callbacks. A completion event whose controller identity matches the current business controller MUST be eligible to complete that run.

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

Each `EntityMotionAnimationObject` MUST scope cleanup to the animation controllers it owns. Other animation controllers on the same Entity and its descendants MUST preserve their playback state. A zero-duration pose commit MUST produce the requested command action, while natural `complete` MUST remain exclusive to the current business playback controller.

#### Scenario: Playback control preserves unrelated animations
- **GIVEN** an Entity motion run and unrelated Entity or descendant animations are active
- **WHEN** Entity motion processes `stop`, `reset`, `finish`, replacement, or destruction
- **THEN** Native MUST stop and release the controllers owned by that Entity motion object
- **AND** the unrelated Entity and descendant animation controllers MUST preserve their playback state

#### Scenario: Zero-duration pose commit produces the command action
- **GIVEN** accepted `stop`, `reset`, `finish`, or `set` requires a zero-duration pose commit
- **WHEN** Native confirms that pose
- **THEN** Native MUST emit the requested command action with the confirmed transform
- **AND** natural `complete` MUST remain exclusive to the current business playback controller

### Requirement: Entity motion commands preserve per-binding FIFO order

The public Entity playback methods MAY return `void`, but the SDK MUST preserve call order through one FIFO command chain per Entity motion binding. Once a native animation object exists, the binding MUST NOT send the next playback or `set` command until the previous command's internal JSB reply has settled. A failed command or a `set` mapped to warning plus no-op MUST settle its queue item and MUST NOT block or reorder later commands.

A successful JSB reply MUST mean Native has completed the command's synchronous state transition and any required transform commit. When a command produces a state event, Native MUST emit that event before returning the success reply. A natural asynchronous `complete` event is not part of the earlier `play` reply.

#### Scenario: Playback commands before native object creation are flushed in order
- **GIVEN** an Entity motion binding whose native animation object has not been created
- **WHEN** application code calls `play`, `pause`, `stop`, `reset`, or `finish`
- **THEN** the binding MUST append those playback commands to its pending queue in call order
- **AND** after creation succeeds, it MUST send them one at a time in FIFO order
- **AND** when `autoStart` is enabled, its generated `play` MUST precede the playback commands already pending at creation time

#### Scenario: Commands after native object creation are serialized
- **GIVEN** the native animation object exists
- **WHEN** application code calls multiple playback or `set` commands without waiting between calls
- **THEN** the binding MUST append them to one FIFO command chain
- **AND** it MUST wait for each internal JSB reply to settle before sending the next command

#### Scenario: Consecutive set then play uses the committed set result
- **GIVEN** the native animation object exists and playback is inactive
- **WHEN** application code calls `api.set(values)` and immediately calls `api.play()`
- **THEN** the binding MUST wait for the `set` reply before sending `play`
- **AND** fresh play MUST read the native transform committed by that `set` as its latest baseline

#### Scenario: Unbind or destruction invalidates pending commands
- **GIVEN** a binding has an in-flight command or commands that have not been sent
- **WHEN** the binding is removed, its target or animation object is replaced, or it is destroyed
- **THEN** the SDK MUST discard all commands that have not been sent from that queue generation
- **AND** settlement of an in-flight command MUST NOT dispatch another command from the invalidated generation

### Requirement: Binding replacement and config updates have a deterministic lifecycle

The Entity motion binding MUST compute a normalized execution signature from the effective timeline, duration, timing, delay, playback rate, loop, and `autoStart`. Equivalent public authoring forms MUST produce the same signature. Lifecycle callback identities MUST be handled independently from the execution signature.

Unbinding and target replacement MUST advance the binding generation, retire the current animation object, destroy its native object, and reset `entityProps` to `{}`. A normalized execution-signature change on the same target MUST advance the binding generation and replace the animation object while preserving the current `entityProps` mirror. Commands, replies, and events MUST be associated with one binding generation and animation-object identity.

#### Scenario: Rebinding starts the new target with an empty mirror
- **GIVEN** the current target has produced confirmed `entityProps`
- **WHEN** the binding moves to a different target
- **THEN** the SDK MUST retire and destroy the old target's animation object
- **AND** the SDK MUST reset `entityProps` to `{}` before establishing confirmed values for the new target

#### Scenario: Execution config change replaces the object on the same target
- **GIVEN** an Entity motion binding remains attached to the same target
- **WHEN** its normalized execution signature changes
- **THEN** the SDK MUST keep the current animation object and binding generation while waiting for its `destroy()` to succeed
- **AND** successful `destroy()` of the old object MUST mean its held controller has stopped, its transform owner has been released, and the old object will not write that target transform again
- **AND** the current `entityProps` MUST remain the last confirmed committed pose for that target during replacement
- **AND** after `destroy()` succeeds, the SDK MUST submit the complete pose in the current `entityProps` through the ordinary Entity transform update entry and wait for that update to succeed
- **AND** after the pose update succeeds, the SDK MUST advance the binding generation and create the new object from the latest config
- **AND** the replacement object's first fresh play MUST read that confirmed pose as its baseline
- **AND** this pose restoration MUST preserve the existing `entityProps` and lifecycle callback counts

#### Scenario: Destroy fails during same-target replacement
- **GIVEN** Entity motion is replacing an animation object for the same target
- **WHEN** destruction of the old object fails
- **THEN** the SDK MUST retain the old object and binding generation
- **AND** the SDK MUST clear commands pending for the attempted replacement
- **AND** `onError` MUST fire once

#### Scenario: Callback-only update keeps the current playback object
- **GIVEN** the normalized execution signature remains equal
- **WHEN** one or more lifecycle callback references change
- **THEN** the binding MUST keep the current animation object, controller, command queue, playback state, and `entityProps`
- **AND** subsequent accepted events MUST use the latest callback references

#### Scenario: Commands and autoStart use the replacement generation
- **GIVEN** an execution config change has started animation-object replacement
- **WHEN** application code issues commands before the replacement object is ready
- **THEN** those commands MUST enter the replacement generation's pending queue
- **AND** after creation, `autoStart: true` MUST contribute exactly one implicit `play` before those commands
- **AND** `autoStart: false` MUST begin with the explicit pending commands

#### Scenario: Replacement accepts only current-generation results
- **GIVEN** a previous animation object has been retired
- **WHEN** command replies or state events arrive
- **THEN** results whose binding generation and animation-object identity match the current object MUST be the exclusive source of state, `entityProps`, and callback updates

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

During active playback states, the animation system MUST own the entire Entity transform. The underlying platforms (visionOS / picoOS) bind the whole `.transform`; configured components animate and the remaining components MUST hold their baseline values. During this period, the active animation MUST remain authoritative, the latest confirmed `entityProps` values MUST remain stable, and the SDK MUST discard direct React prop writes and `api.set` writes immediately. After a confirmed state exists, inactive dynamic writes MUST use `api.set`; ordinary React transform props remain static/base inputs until the binding is removed. Native `SpatialScene` MUST perform whole-transform animating-mask arbitration at the ordinary Entity transform update entry. Before the first confirmed state, ordinary updates MUST update the fresh-play baseline; after the first confirmed state and while the binding remains attached, ordinary updates MUST return success and preserve the current native transform; after unbinding or destroying the animation object, ordinary updates MUST resume updating the native transform.

#### Scenario: React props do not override the active animation
- **GIVEN** an Entity animation is in `delay`, `running`, or `paused`
- **WHEN** application code updates any transform component while the animation is active
- **THEN** those prop writes MUST NOT override the active animation

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


### Requirement: Dynamic take-over uses `api.set`

Before the first confirmed state, ordinary Entity transform props are authoritative static/base inputs. Once a confirmed state exists and the animation binding remains attached, `entityProps` is authoritative for the complete inactive transform. `api.set` MUST be the sole dynamic write channel for that committed transform.

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

The SDK MUST provide `api.set` as the imperative write entry for the committed Entity transform state that `entityProps` mirrors. `api.set` MUST only accept a sparse `EntityMotionPatch` object (the write-side patch type; the same `{ position?, rotation?, scale? }` shape as the read-side `EntityMotionProps`, but named distinctly) and MUST NOT support the updater function form `(prev) => next`. A valid patch MUST contain at least one transform scalar; `api.set({})` and patches containing only empty nested objects MUST synchronously throw. `api.set` MUST NOT be a playback command and MUST NOT seek, start, or change playback progress.

Entity transform ownership MUST be arbitrated as one whole. Before the first confirmed state, static/base React props are authoritative. While the animation is active (`delay` / `running` / `paused`), the `animation` binding is authoritative for the entire transform; configured fields animate and the remaining fields hold their baseline values. Once native emits a confirmed state and while the binding remains attached, `entityProps` is authoritative for the complete inactive transform. During inactive states, `api.set` updates the native committed transform. Removing the binding returns authority to React props.

The SDK MUST NOT provide a bare `api.get`. Application code that needs to read the current committed value MUST read declarative `entityProps`, and compute its own patch before calling `api.set(values)` when it needs to write. `entityProps` MAY be empty before the first native-confirmed state and MUST NOT be promised readable at mount: creating or binding the animation MUST NOT emit an extra initial confirmed value. To read a meaningful native pose, application code MUST first trigger a lifecycle that commits a confirmed value (a `play` that reaches a terminal / lifecycle node, or an accepted `api.set`).

#### Scenario: set updates committed state and entityProps
- **WHEN** application code calls `api.set(values)` with Entity transform values
- **THEN** the SDK MUST send the write to native, which decides whether to accept it
- **AND** when native accepts, `entityProps` MUST update to the complete confirmed `position`, `rotation`, and `scale` values emitted by native
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

The SDK MUST synchronously throw the built-in `Error` for programmer errors detectable from public config or method arguments and MUST preserve the existing `onError` count. Native fallback-validation failures for creation payloads or `set` payloads MUST trigger `onError` through an asynchronous JSB result using `INVALID_TIMELINE` or `INVALID_SET_VALUES`, respectively. Failures discovered during Bridge or Native execution MUST be delivered through `onError` as a classified `SpatializedPlaybackError`, covering at least `TARGET_NOT_FOUND`, `UNSUPPORTED_TARGET`, `ANIMATION_NOT_FOUND`, and `COMPILATION_FAILED`. Rejected `api.set` writes during an active animation or before binding / native object creation MUST remain no-ops that emit a console warning.

#### Scenario: Error code is distinguishable
- **WHEN** an Entity motion operation fails asynchronously in Bridge or Native
- **THEN** `onError` MUST receive a `SpatializedPlaybackError` whose `code` identifies the failure kind
- **AND** application code MUST be able to branch on `code` without parsing `message`

### Requirement: Entity target destruction invalidates associated animations

If an Entity target is destroyed first, the SDK MUST destroy its associated animation objects. After that destruction has synchronized to Core, playback commands MUST be no-ops and `api.set` MUST be a warning plus no-op without triggering `onError`. A command racing with teardown MAY fail with `ANIMATION_NOT_FOUND`.

#### Scenario: Target-first destruction cascades animation cleanup
- **WHEN** an Entity target is destroyed before its associated native animation objects
- **THEN** Native MUST destroy every Entity animation object associated with that target
- **AND** after destruction synchronizes to Core, playback MUST be a no-op and `api.set` MUST be a warning plus no-op without triggering `onError`

#### Scenario: Control command races teardown
- **WHEN** a control command races with animation-object teardown
- **THEN** it MAY fail with `ANIMATION_NOT_FOUND`
