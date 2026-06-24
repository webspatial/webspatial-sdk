## Context and goals

This change defines declarative motion for three spatialized container kinds:

- `spatialized2d` via `Spatialized2DElement`
- `static3d` via `SpatializedStatic3DElement`
- `dynamic3d` via `SpatializedDynamic3DElement`

All three share the same authoring model and canonical `tracks` execution model, but they differ in React binding entry points and native write paths. Entity animation remains a separate stack and is out of scope for this design.

The target state preserves playback lifecycle, native frame sampling, animation-owned masks, terminal callback semantics, and `from` / `to` authoring from earlier motion designs. It also adopts canonical `tracks` timeline, `xr-animation` bind-time target resolution, and the React `style` outlet.

The target state does not keep the Web RAF backend. Pure Web runtimes are capability-negative for `useAnimation` spatialized targets.

## Target-state architecture

The target implementation is split across React SDK, Core SDK, and native runtime:

- React SDK owns `AnimationBinding`, created by `useAnimation(config)`. It stores config, queues pre-bind commands, and creates the Core `AnimationObject` only after `xr-animation` resolves a concrete `SpatializedElement` target.
- Core SDK owns `AnimationObject extends SpatialObject`. It exposes `play/pause/resume/stop/reset/finish` directly, inherits `destroy()`, subscribes to `NativeWebMsg`, filters `SpatialAnimationStateChanged` by native uuid, and updates its own observable state.
- visionOS owns native `AnimationObject extends SpatialObject` and `SpatializedElementAnimationManager`. The manager handles native animation registration, create/control lookup, element destroy cascading, animating mask coordination, and `SpatialAnimationStateChanged` emission.

See `references/animation-object-architecture.md` for class diagrams, sequence diagrams, and migration notes from the current visionOS motion implementation.

## React SDK module boundaries

| Module | Responsibility |
|--------|----------------|
| `useAnimation(config)` | Creates `AnimationBinding`, `PlaybackApi`, and the `style` outlet. |
| `AnimationBinding` | Stores config, tracks normalized config signature, queues pre-bind explicit commands, and creates Core `AnimationObject` after bind. |
| `PlaybackApi` | Exposes React-facing `play/pause/resume/stop/reset/finish` and subscribes to Core `AnimationObject` state. |
| `xr-animation` binding adapter | Resolves concrete target kind and triggers `AnimationBinding.bind()` / `unbind()`. |

## Core SDK module boundaries

| Module | Responsibility |
|--------|----------------|
| `SpatializedElement.createAnimation(config)` | Creates a native-backed `AnimationObject` after target binding, and owns validation, normalization, and create JSB send. |
| `AnimationObject` | First-class Core object extending `SpatialObject`; implements playback controls directly, inherits `destroy()`, subscribes to NativeWebMsg directly, and owns its state. |
| `validateSpatializedMotionConfig` | Validates authoring config before native create, such as rejecting Static3D `opacity` tracks. |
| `motionConfigToAnimationTimeline` | Compiles normalized motion config into the canonical `CreateSpatializedElementAnimation` payload. |

## Native Runtime / visionOS module boundaries

| Module | Responsibility |
|--------|----------------|
| `SpatializedElementAnimationManager` | Manages native `AnimationObject` registry, create/control lookup, `destroyAnimationsForElement`, mask coordination, and `SpatialAnimationStateChanged` emission. |
| `Native AnimationObject` | Extends `SpatialObject`; owns native uuid, locked `TimelineSampler`, playback state, and implements `play/pause/resume/stop/reset/finish/tick/destroy`. |
| `SpatialObjectRegistry` | Registers, looks up, and destroys native spatial objects, including `AnimationObject`. |
| `TimelineSampler` | Reuses the existing timeline sampler and samples the locked canonical timeline. |
| `AnimationFrameDriver` | Drives per-frame tick for active animations. |
| `ElementAnimationWriteAdapter` | Writes `transform`, `opacity`, or `modelTransform` according to target kind. |
| `AnimatingMask` | Records animation-owned fields and prevents regular element sync from overriding active animation. |
| `NativeWebMsgEmitter` | Emits unified `SpatialAnimationStateChanged`. |

## Non-goals

- Do not introduce public `AnimationObjectChannel`, `AnimationObjectBridge`, or `SpatialObjectBridge` architecture objects.
- Do not keep Core/Web RAF playback fallback.
- Do not use `AnimateSpatializedElementMotion` as the target-state runtime command.
- Do not base mask ownership on `PortalInstanceObject` or React Portal suppression.
- Do not support Static3D root opacity animation; Static3D `opacity` tracks must be rejected before native create.
