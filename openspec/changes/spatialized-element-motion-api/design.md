## Context

This change defines declarative motion for three spatialized container kinds:

- `spatialized2d` via `Spatialized2DElement`
- `static3d` via `SpatializedStatic3DElement`
- `dynamic3d` via `SpatializedDynamic3DElement`

All three share the same authoring model and the same canonical `tracks` execution model, but they differ in React integration points and native write paths. Entity animation remains a separate stack and is not part of this target-state design.

## Design Evolution

### Plan A foundations

Plan A established the primitives that remain normative here:

- Session lifecycle and playback state
- Animation-owned field masking during native-controlled playback
- Native per-frame sampling semantics
- Lifecycle callback mutual exclusion
- Single-segment `from` and `to` authoring as a convenience shape

### Plan B generalization

Plan B introduced the general-purpose timeline model:

- Canonical per-property `tracks`
- `style` as the single React merge outlet
- Bind-time target resolution through `xr-animation`

The target state deliberately does not keep the Web RAF backend as a playback path. Pure Web runtimes are capability-negative for `useAnimation` spatialized targets.

### Unified target state

This design merges those ideas into a single three-layer architecture:

- `React SDK` defines authoring, binding, and React `AnimationBinding`
- `Core SDK` defines `SpatializedElement.createAnimation(config)`, `AnimationObject : SpatialObject`, config validation / normalization, and direct NativeWebMsg state subscription
- `Native Runtime` defines native `AnimationObject : SpatialObject`, `SpatializedElementAnimationManager`, target-specific playback, and write paths

## Goals

- One authoring API for 2D, Static3D, and Dynamic3D container motion
- One canonical timeline model for all execution paths
- One shared playback API and callback contract across all kinds
- Clear separation between React binding, Core AnimationObject, and Native playback
- Explicit cross-layer contracts so module responsibilities are easy to reason about

## AnimationObject implementation architecture

The target implementation is split across React SDK, Core SDK, and native runtime:

- React SDK owns `AnimationBinding`, created by `useAnimation(config)`. It stores config, queues pre-bind commands, and creates the Core `AnimationObject` only after `xr-animation` resolves a concrete `SpatializedElement` target.
- Core SDK owns `AnimationObject extends SpatialObject`. It exposes `play/pause/resume/stop/reset/finish` directly, inherits `destroy()`, subscribes to `NativeWebMsg`, filters `SpatialAnimationStateChanged` by native uuid, and updates its own observable state.
- visionOS owns native `AnimationObject extends SpatialObject` and `SpatializedElementAnimationManager`. The manager handles native animation registration, create/control lookup, element destroy cascading, animating mask coordination, and `SpatialAnimationStateChanged` emission.

See `references/animation-object-architecture.md` for class diagrams, sequence diagrams, and migration notes from the current visionOS motion implementation.

## Core SDK module boundaries

| Module | Responsibility |
|--------|----------------|
| `SpatializedElement.createAnimation(config)` | Creates a native-backed `AnimationObject` after target binding, and owns validation, normalization, and create JSB send. |
| `AnimationObject` | First-class Core object extending `SpatialObject`; implements playback controls directly, subscribes to NativeWebMsg directly, and owns its state. |
| `validateSpatializedMotionConfig` | Validates authoring config before native create, such as rejecting Static3D `opacity` tracks. |
| `motionConfigToAnimationTimeline` | Compiles normalized motion config into the canonical `CreateSpatializedElementAnimation` payload. |
| `evaluateMotionTimeline` | Used only for validation, test fixtures, or explicit non-runtime tools; target-state playback does not depend on a Core/Web RAF sampler. |
| `ELEMENT_ANIMATING_MASK_POLICIES` | Encodes per-kind animation-owned field mask behavior and terminal handoff rules. |

The target state does not introduce public `AnimationObjectChannel`, `AnimationObjectBridge`, or `SpatialObjectBridge` architecture objects. Low-level JSB/WebMsg capabilities should remain implementation details of `SpatialObject` / `AnimationObject`.
