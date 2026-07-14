# Spatialized element motion

## Scope

This capability defines one public container-motion API for `Spatialized2DElement`, `SpatializedStatic3DElement`, and `SpatializedDynamic3DElement`. Entity animation remains on the separate `useEntityAnimation` / `AnimateTransform` stack.

## ADDED Requirements

### Requirement: One target-agnostic container-motion API

The SDK experimental entry `@webspatial/react-sdk/experimental` MUST expose `useAnimation(config)` returning `[animation, api, style]`. The default and eager React SDK entries MUST NOT expose `useAnimation` or `useEntityAnimation`. The config MUST NOT contain a target `kind`; the SDK MUST resolve the target when the returned opaque `animation` binding is assigned through `xr-animation`.

| Bound component | Resolved target | Animated native fields |
|---|---|---|
| `<div enable-xr>` / SpatialDiv | `spatialized2d` | container-root `transform`, `opacity` |
| `<Model>` | `static3d` | container-root `transform`, `opacity` |
| `<Reality>` | `dynamic3d` | container-root `transform`, `opacity` |

#### Scenario: Binding resolves the target

- **WHEN** the same valid animation config is bound to an `enable-xr` node, `<Model>`, or `<Reality>`
- **THEN** the SDK MUST accept the same public config shape for all three targets
- **AND** it MUST create native playback for the resolved target kind

#### Scenario: One binding has one target

- **WHEN** the same `animation` binding is assigned to multiple components concurrently
- **THEN** the SDK MUST reject or warn about the later binding
- **AND** only the first binding MUST remain effective

#### Scenario: Entity animation remains separate

- **WHEN** an author animates a child `Entity` through `useEntityAnimation`
- **THEN** that animation MUST remain on the Entity stack
- **AND** it MUST NOT use the container `AnimationObject`

### Requirement: Public config supports simple and timeline authoring

The experimental `useAnimation(config)` input MUST support either:

1. Top-level segment authoring with required `from` and required `to` visual values.
2. A `timeline` object that MAY combine `from`, `to`, and percentage-keyframe entries whose keys match `/^\d+(\.\d+)?%$/`.

`duration`, `timingFunction`, `delay`, `autoStart`, `loop`, `playbackRate`, and lifecycle callbacks remain on the outer config. When no percentage key is used, duration is optional and defaults to 0.3 seconds. A config containing any percentage key MUST provide `duration`.

When `timeline` is present, top-level `from` and `to` MAY both be absent. If either is present, Core MUST ignore it; top-level values MUST NOT participate in validation or normalization. Top-level `tracks` MUST be rejected by the public type surface and runtime validation.

The timeline as a whole MUST define both a start frame (`from` or `0%`) and an end frame (`to` or `100%`). A timeline missing either boundary MUST be rejected; missing boundaries MUST NOT be filled from the underlying element style. Every animated scalar property in `timeline` MUST produce at least two keyframes. A property MAY begin after the timeline start or end before the timeline end; sampling outside its authored keyframe range MUST hold its first or last value. A property declared in both `from` and `0%`, or in both `to` and `100%`, MUST be rejected as a duplicate boundary declaration.

#### Scenario: Top-level segment is accepted

- **WHEN** an author provides top-level `from` and `to` without `timeline`
- **THEN** the SDK MUST accept it as simple segment authoring
- **AND** it MUST normalize the segment into internal per-property tracks before playback

#### Scenario: Incomplete top-level segment is rejected

- **WHEN** a config has no `timeline` and omits either top-level `from` or top-level `to`
- **THEN** the public type surface MUST reject the config
- **AND** runtime validation MUST reject it before native create

#### Scenario: Timeline mixes boundaries and percentage keyframes

- **WHEN** an author provides `timeline` with `from`, one or more intermediate percentage keys, and `to`
- **THEN** the SDK MUST accept the mixed timeline
- **AND** it MUST normalize `from` at 0%, `to` at 100%, and percentage keys at their declared positions

#### Scenario: Timeline authoring omits top-level boundaries

- **WHEN** a valid `timeline` supplies at least two keyframes for every animated property
- **AND** top-level `from` and `to` are both absent
- **THEN** the SDK MUST accept the config

#### Scenario: Timeline takes precedence over top-level boundaries

- **GIVEN** a config contains `timeline` and top-level `from` or `to`
- **WHEN** the config is validated and normalized
- **THEN** Core MUST ignore the top-level `from` and `to`
- **AND** Core MUST emit a development warning that top-level `from`/`to` are ignored because a timeline is present
- **AND** only `timeline` content MUST determine the animation

#### Scenario: Property begins after timeline start

- **GIVEN** an animated property first appears after 0% and appears in at least one later frame
- **WHEN** the timeline is validated and sampled before that property's first keyframe
- **THEN** the SDK MUST accept the config
- **AND** it MUST hold that property's first value before its first keyframe

#### Scenario: Property ends before timeline end

- **GIVEN** an animated property appears in at least two frames and its last keyframe is before 100%
- **WHEN** the timeline is validated and sampled after that property's last keyframe
- **THEN** the SDK MUST accept the config
- **AND** it MUST hold that property's last value through timeline end

#### Scenario: Timeline missing a start frame is rejected

- **WHEN** a `timeline` declares no `from` and no `0%` frame
- **THEN** runtime validation MUST reject the config before native create

#### Scenario: Timeline missing an end frame is rejected

- **WHEN** a `timeline` declares no `to` and no `100%` frame
- **THEN** runtime validation MUST reject the config before native create

#### Scenario: Single property keyframe is rejected

- **WHEN** an animated property appears in only one timeline entry
- **THEN** runtime validation MUST reject the config before native create

#### Scenario: Duplicate boundary declaration is rejected

- **WHEN** the same property is declared in both `from` and `0%`, or in both `to` and `100%`
- **THEN** runtime validation MUST reject the config before native create

#### Scenario: Timeline array is rejected

- **WHEN** an author provides `timeline: []`
- **THEN** runtime validation MUST reject it before native create

### Requirement: Percentage-keyframe behavior is deterministic

Decimal percentages MUST be supported. Every percentage MUST be in `[0%, 100%]`; invalid keys and out-of-range percentages MUST be rejected. Timeline entries MAY be sparse across properties as long as every animated property produces at least two keyframes.

Normalization MUST treat `from` as 0% and `to` as 100%, parse each percentage into a ratio, and multiply it by `duration` to produce an absolute internal keyframe time. Each animated scalar property MUST be collected independently. If a property is absent from an intermediate percentage frame, no keyframe is generated for that property at that time.

#### Scenario: Decimal percentage is normalized

- **WHEN** `duration` is 10 and a frame is declared at `30.33%`
- **THEN** its internal absolute keyframe time MUST be 3.033 seconds

#### Scenario: Properties are collected independently

- **GIVEN** opacity is declared at `0%`, `50%`, and `100%`
- **AND** translation X is declared only at `0%` and `100%`
- **WHEN** the timeline is normalized
- **THEN** the opacity track MUST contain three keyframes
- **AND** the translation X track MUST contain two keyframes

#### Scenario: Values hold outside a property's keyframe range

- **WHEN** an internal track is sampled before its first keyframe or after its last keyframe
- **THEN** it MUST use the first or last value respectively

### Requirement: Tracks are internal only

The SDK MUST normalize top-level segment authoring and public timeline authoring into a canonical internal tracks document before native create. The internal document MUST contain `duration`, optional timing controls, and a non-empty tracks array. Each track MUST contain one whitelisted property and at least two sorted numeric absolute-time keyframes. A sparse track MAY begin after time zero or end before `duration`.

Track, keyframe, property-path, normalized timeline, and native wire types MUST NOT be exported from stable Core or React package entry points. `useAnimation` MUST NOT accept tracks authoring. Public documentation and test-server examples MUST NOT present tracks as authoring. The SDK MUST NOT provide an experimental tracks entry point in this change.

#### Scenario: Top-level segment compiles to internal tracks

- **WHEN** a top-level segment animates opacity from 0 to 1 over 0.5 seconds
- **THEN** normalization MUST create an internal opacity track at 0 and 0.5 seconds

#### Scenario: Percentage timeline compiles to internal tracks

- **WHEN** a two-second percentage timeline declares opacity at `0%`, `50%`, and `100%`
- **THEN** normalization MUST create internal opacity keyframes at 0, 1, and 2 seconds

#### Scenario: Canonical tracks are sent to native

- **WHEN** Core sends `CreateSpatializedElementAnimation`
- **THEN** the command MUST contain the normalized internal tracks document
- **AND** native MUST NOT receive or evaluate the public authoring shape

### Requirement: Only visual container properties are animatable

Container motion MUST support `opacity` and the scalar paths under `transform.translate`, `transform.rotate`, and `transform.scale` for X, Y, and Z. Other fields, including layout and spatial-size fields such as `width`, `height`, `back`, `backOffset`, and `depth`, MUST be ignored during normalization and MUST NOT appear in the internal tracks sent to native. The public TypeScript authoring surface MUST continue to expose only supported fields.

#### Scenario: Unsupported property is ignored

- **WHEN** public visual values contain both supported scalar fields and unsupported fields
- **THEN** normalization MUST produce tracks only for the supported scalar fields
- **AND** the unsupported fields MUST NOT be sent to native

#### Scenario: No supported property remains after normalization

- **WHEN** all fields in the public visual values are unsupported and normalization produces no tracks
- **THEN** the existing normalized-track validation MUST reject the config before native create

#### Scenario: Transform composition order is stable

- **WHEN** multiple transform scalars are sampled at the same time
- **THEN** the SDK MUST compose translate, then rotate, then scale

### Requirement: Timing functions resolve predictably

For percentage-keyframe authoring, interpolation from one frame to the next MUST use that frame's `timingFunction`, then the outer config `timingFunction`, then `linear`. A timing function on the final frame has no effect. Segment authoring MUST use the outer config timing function or `linear`.

The internal tracks document MAY carry the resolved timing function per keyframe or track, but those internal fields are not public authoring API.

#### Scenario: Frame timing overrides config timing

- **WHEN** a percentage frame declares `easeOut` and the outer config declares `easeIn`
- **THEN** interpolation from that frame to the next MUST use `easeOut`

#### Scenario: Default timing is linear

- **WHEN** neither the active frame nor outer config declares a timing function
- **THEN** interpolation MUST use `linear`

### Requirement: Native-first AnimationObject playback

After binding resolves a target, Core MUST create a native-backed `AnimationObject` through `SpatializedElement.createAnimation(config)`. Create MUST validate and normalize the public config, lock the normalized timeline for that object, and MUST NOT itself start sampling unless implicit auto-start or a queued explicit play follows.

Playback controls MUST operate on the same object. A config signature change or target rebinding MUST destroy and recreate the object rather than mutate its locked timeline. Pure Web runtimes MUST NOT start a Web RAF fallback.

#### Scenario: Play before bind is queued

- **WHEN** `api.play()` is called before `xr-animation` resolves a target
- **THEN** the command MUST queue
- **AND** it MUST run after the native-backed object is created
- **AND** no Web RAF fallback may start

#### Scenario: Explicit play survives autoStart false

- **GIVEN** `autoStart` is false
- **WHEN** explicit `api.play()` is called before bind
- **THEN** the command MUST still run after bind

#### Scenario: Config change recreates playback object

- **WHEN** the normalized config signature changes
- **THEN** the current native-backed object MUST be destroyed
- **AND** a new object with a newly locked timeline MUST be created for the bound target

#### Scenario: Pure Web runtime has no playback fallback

- **WHEN** native `AnimationObject` support is unavailable
- **THEN** `supports('useAnimation')` MUST be false
- **AND** the SDK MUST NOT run a JavaScript RAF sampler

### Requirement: Target-specific writes preserve component boundaries

Static3D motion MUST write the `<Model>` container root and MUST NOT write model-internal `entityTransform` or `modelTransform` fields. Dynamic3D motion MUST write the `<Reality>` container root; child entities remain in local space and move with the container. Spatialized2D motion MUST write the spatialized container root.

#### Scenario: Model clip playback remains separate

- **WHEN** an author calls the Model ref `play()` or `pause()` for an embedded USD clip
- **THEN** the container motion session MUST remain independent

#### Scenario: Reality motion does not become Entity motion

- **WHEN** a timeline is bound to `<Reality>`
- **THEN** native playback MUST update the Reality container root
- **AND** it MUST NOT route child Entity transforms through the container-motion stack

### Requirement: Returned style closes host visual state

Authors MUST merge the returned `style` onto the same host that receives `xr-animation`. Playback MAY start without this merge, but terminal visual persistence after rerender or resync is not guaranteed.

For Spatialized2D terminal handoff, only `style.opacity` or `style.transform` supplied directly in React props qualifies as explicit authored style. Values found only through `className`, stylesheets, inherited visual effects, or `getComputedStyle()` MUST NOT be treated as explicit authored values.

#### Scenario: Merged style preserves terminal values

- **WHEN** stop, reset, finish, or natural completion is followed by host rerender or resync
- **THEN** a host that merged the returned style MUST preserve the emitted terminal visual values

#### Scenario: Explicit 2D authored style regains ownership

- **GIVEN** a Spatialized2D host explicitly declares the animated field in React `style`
- **WHEN** terminal mask handoff completes
- **THEN** that explicit authored value MUST regain post-terminal ownership
- **AND** the native sampled terminal value MUST still be used for lifecycle callback values

### Requirement: Playback and lifecycle semantics are shared

The API MUST expose `play`, `pause`, `stop`, `reset`, and `finish`, plus `isAnimating`, `isPaused`, `finished`, and `playState`. It MUST NOT expose `resume()`. `play()` and `pause()` are whole-session operations and MUST NOT accept track selectors.

- Paused `play()` resumes the session.
- Running `play()` is a no-op.
- `stop()` freezes the current sampled values and returns to `idle` with `finished=false`.
- `reset()` always samples the timeline at time zero and returns to `idle` with `finished=false`, including while already idle; sparse property tracks use their first values.
- `finish()` seeks to terminal values and enters `finished` only after native confirmation.
- A pre-bind `finish()` remains `queued` with `finished=false` until the native-backed object exists and confirms the terminal state.

#### Scenario: Terminal commands remain independent

- **WHEN** stop, reset, or finish is invoked
- **THEN** its behavior MUST NOT be swallowed or replaced by another terminal command

#### Scenario: Native terminal state is authoritative

- **WHEN** stop, reset, finish, or natural completion produces terminal values
- **THEN** the native-backed `AnimationObject` MUST provide those values and authoritative state

### Requirement: Lifecycle callbacks are mutually consistent

Config MUST support `onStart`, `onComplete`, `onStop`, `onReset`, and `onError`. Natural completion and confirmed `finish()` invoke `onComplete`; `stop()` invokes `onStop`; `reset()` invokes `onReset`. Exactly one of `onComplete`, `onStop`, or `onReset` MUST fire for each session termination. `onError` MAY fire independently for asynchronous native failure.

#### Scenario: Finish invokes onComplete

- **WHEN** native confirms an explicit finish
- **THEN** `onComplete` MUST receive terminal values
- **AND** `finished` MUST become true

#### Scenario: Stop and reset clear finished

- **WHEN** stop or reset completes
- **THEN** `finished` MUST be false

### Requirement: Animating mask protects active native ownership

While native playback owns `transform` or `opacity`, ordinary element synchronization MUST NOT overwrite the owned field. Pause retains the sampled value and mask. Stop, reset, finish, natural completion, unbind, destroy, and element destruction MUST release or update mask ownership consistently and MUST NOT leave native and React simultaneously owning the same visual field.

#### Scenario: Ordinary update cannot overwrite active animation

- **GIVEN** native playback owns transform or opacity
- **WHEN** ordinary element synchronization writes that field
- **THEN** the conflicting write MUST be ignored or deferred until ownership handoff

#### Scenario: Element destruction cleans up animation

- **WHEN** the bound spatialized element is destroyed
- **THEN** all related native-backed animation state and mask ownership MUST be cleaned up
