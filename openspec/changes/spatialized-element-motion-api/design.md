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
- visionOS owns native `AnimationObject extends SpatialObject` and `SpatializedElementAnimationManager`. `SpatialScene` remains the JSB listener registration entry point and native spatial object store owner; the manager only owns animation business lifecycle, create/control lookup, frame loop scheduling, element destroy cascading, animating mask coordination, and `SpatialAnimationStateChanged` emission.

## Non-goals

- Do not introduce public `AnimationObjectChannel`, `AnimationObjectBridge`, or `SpatialObjectBridge` architecture objects.
- Do not add a standalone `SpatialObjectRegistry`; target state reuses existing `SpatialScene.spatialObjects`, `addSpatialObject`, `findSpatialObject`, and destroy path.
- Do not add a standalone `JSBCommandHandler`; target state reuses existing `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` entry points.
- Do not design the frame driver as a standalone public module; it is an internal scheduling capability of `SpatializedElementAnimationManager`.
- Do not keep Core/Web RAF playback fallback.
- Do not use `AnimateSpatializedElementMotion` as the target-state runtime command.
- Do not base mask ownership on `PortalInstanceObject` or React Portal suppression.
- Do not support Static3D root opacity animation; Static3D `opacity` tracks must be rejected before native create.

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
| `SpatialScene JSB listeners` | Reuse the existing `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` mechanism to register animation create/control commands and delegate them to `SpatializedElementAnimationManager`. |
| `SpatializedElementAnimationManager` | Manages native `AnimationObject` business lifecycle, `animationId -> NativeAnimationObject` lookup, create/control, frame loop start/stop, `destroyAnimationsForElement`, mask coordination, and `SpatialAnimationStateChanged` emission. |
| `Native AnimationObject` | Extends `SpatialObject`; owns native uuid, locked `TimelineSampler`, playback state, and implements `play/pause/resume/stop/reset/finish/tick/destroy`. |
| `SpatialScene.spatialObjects` | Reuse existing `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` / destroy path to register, look up, and destroy native spatial objects, including `AnimationObject`. |
| `TimelineSampler` | Reuses the existing timeline sampler and samples the locked canonical timeline. |
| `Frame driver / CADisplayLink` | Internal scheduling capability of `SpatializedElementAnimationManager`; the manager starts it while any animation is running, it calls `manager.tickAll(timestamp)` every frame, and the driver itself owns no animation semantics. |
| `ElementAnimationWriteAdapter` | Writes `transform`, `opacity`, or `modelTransform` according to target kind. |
| `AnimatingMask` | Records animation-owned fields and prevents regular element sync from overriding active animation. |
| `NativeWebMsgEmitter` | Emits unified `SpatialAnimationStateChanged`. |

## Cross-layer object relationships

```mermaid
classDiagram
  direction TB

  namespace ReactSDK {
    class useAnimation {
      <<hook>>
      +useAnimation(config): [AnimationBinding, PlaybackApi, style]
    }

    class AnimationBinding {
      <<React internal>>
      +config: SpatializedMotionConfig
      +target?: SpatializedElement
      +kind?: spatialized2d|static3d|dynamic3d
      +animationObject?: CoreAnimationObject
      +queuedCommands: AnimationCommand[]
      +bind(target, kind): Promise<void>
      +unbind(): Promise<void>
      +recreateIfConfigChanged(config): Promise<void>
      +dispatch(command): Promise<void>
      -flushQueuedCommands(): Promise<void>
    }

    class PlaybackApi {
      +play(): Promise<void>
      +pause(): Promise<void>
      +resume(): Promise<void>
      +stop(): Promise<void>
      +reset(): Promise<void>
      +finish(): Promise<void>
      +playState: PlayState
      +isAnimating: boolean
      +isPaused: boolean
      +finished: boolean
    }
  }

  namespace CoreSDK {
    class SpatialObject {
      <<abstract>>
      +uuid: string
      +destroy(): Promise<void>
    }

    class SpatializedElement {
      <<abstract>>
      +uuid: string
      +createAnimation(config): Promise~AnimationObject~
    }

    class CoreAnimationObject {
      +uuid: string
      +playState: PlayState
      +isAnimating: boolean
      +isPaused: boolean
      +finished: boolean
      +play(): Promise<void>
      +pause(): Promise<void>
      +resume(): Promise<void>
      +stop(): Promise~SpatializedVisualValues~
      +reset(): Promise~SpatializedVisualValues~
      +finish(): Promise~SpatializedVisualValues~
      +subscribe(listener): Unsubscribe
      -control(action): Promise<void>
      -applyNativeState(event): void
    }

    class CreateSpatializedElementAnimation {
      <<JSB command>>
      +targetElementId: string
      +targetKind: string
      +timeline: CanonicalMotionTimeline
    }

    class ControlSpatializedElementAnimation {
      <<JSB command>>
      +animationId: string
      +action: play|pause|resume|stop|reset|finish
    }

    class SpatialAnimationStateChanged {
      <<NativeWebMsg payload>>
      +animationId: string
      +action: string
      +playState: PlayState
      +values?: SpatializedVisualValues
      +error?: SpatializedPlaybackError
    }
  }

  namespace VisionOS {
    class SpatialScene {
      +spatialWebViewModel
      +spatialObjects
      +elementAnimationManager
      +setupJSBListeners()
      +addSpatialObject(object)
      +findSpatialObject(id)
      +onCreateSpatializedElementAnimation(command)
      +onControlSpatializedElementAnimation(command)
      +onDestroySpatialObjectCommand(command)
    }

    class NativeSpatialObject {
      <<abstract>>
      +uuid: UUID
      +destroy()
    }

    class NativeSpatializedElement {
      <<abstract>>
      +uuid: UUID
      +animatingMask: AnimatingMask
      +applyTransformUpdate(update)
      +applyOpacityUpdate(update)
      +destroy()
    }

    class NativeAnimationObject {
      +uuid: UUID
      +targetElementId: UUID
      +targetKind: AnimationTargetKind
      +playState: AnimationPlayState
      +timelineSampler: TimelineSampler
      +play()
      +pause()
      +resume()
      +stop()
      +reset()
      +finish()
      +destroy()
      +tick(timestamp)
      -applySample(values)
      -emitStateChanged(action, values?)
    }

    class SpatializedElementAnimationManager {
      +createAnimation(command): NativeAnimationObject
      +controlAnimation(animationId, action)
      +destroyAnimation(animationId)
      +destroyAnimationsForElement(elementId)
      +getAnimation(animationId): NativeAnimationObject?
      +tickAll(timestamp)
      +emitStateChanged(animation, action, values?)
    }

    class FrameDriver {
      <<internal>>
      +start()
      +stop()
      +onFrame(timestamp)
    }

    class TimelineSampler {
      +sample(time): SpatializedVisualValues
      +duration: TimeInterval
    }

    class AnimatingMask {
      +transform: Bool
      +opacity: Bool
      +clear()
    }
  }

  useAnimation --> AnimationBinding : creates
  useAnimation --> PlaybackApi : creates
  PlaybackApi --> AnimationBinding : delegates commands
  AnimationBinding --> SpatializedElement : target after bind
  AnimationBinding --> CoreAnimationObject : owns after create
  PlaybackApi --> CoreAnimationObject : subscribes state after bind

  SpatialObject <|-- SpatializedElement
  SpatialObject <|-- CoreAnimationObject
  SpatializedElement --> CreateSpatializedElementAnimation : sends JSB
  SpatializedElement --> CoreAnimationObject : returns native uuid handle
  CoreAnimationObject --> ControlSpatializedElementAnimation : sends JSB
  CoreAnimationObject --> SpatialAnimationStateChanged : filters by uuid

  NativeSpatialObject <|-- NativeSpatializedElement
  NativeSpatialObject <|-- NativeAnimationObject
  SpatialScene --> SpatializedElementAnimationManager : owns
  SpatialScene --> NativeSpatialObject : stores in spatialObjects
  SpatialScene --> CreateSpatializedElementAnimation : registers JSB listener
  SpatialScene --> ControlSpatializedElementAnimation : registers JSB listener
  SpatializedElementAnimationManager --> FrameDriver : owns internal scheduler
  FrameDriver --> SpatializedElementAnimationManager : tickAll(timestamp)
  SpatializedElementAnimationManager --> NativeAnimationObject : manages
  SpatializedElementAnimationManager --> NativeSpatializedElement : lookup target via SpatialScene.findSpatialObject
  NativeSpatializedElement --> AnimatingMask : owns
  NativeAnimationObject --> TimelineSampler : owns locked timeline
  NativeAnimationObject --> NativeSpatializedElement : writes sampled values
  NativeAnimationObject --> AnimatingMask : marks animation-owned fields
```

## Creation and binding sequence

```mermaid
sequenceDiagram
  participant App
  participant Hook as React useAnimation
  participant Binding as React AnimationBinding
  participant Target as React target
  participant Element as Core SpatializedElement
  participant CoreObj as Core AnimationObject
  participant Scene as visionOS SpatialScene
  participant Manager as visionOS AnimationManager
  participant NativeObj as visionOS AnimationObject

  App->>Hook: useAnimation(config)
  Hook->>Binding: create AnimationBinding(config)
  Hook-->>App: [animation=binding, api, style]

  App->>Target: <Model xr-animation={animation} />
  Target->>Binding: bind(element, static3d)
  Binding->>Element: createAnimation(config)
  Element->>Element: validate + normalize
  Element->>Scene: CreateSpatializedElementAnimation(target, kind, timeline)
  Scene->>Manager: createAnimation(command)
  Manager->>Scene: findSpatialObject(targetElementId)
  Manager->>NativeObj: new AnimationObject(native uuid, locked timeline)
  Manager->>Scene: addSpatialObject(animationObject)
  Manager-->>Scene: native uuid
  Scene-->>Element: native uuid
  Element->>CoreObj: new AnimationObject(uuid)
  CoreObj->>CoreObj: subscribe NativeWebMsg SpatialAnimationStateChanged
  Element-->>Binding: Core AnimationObject
  Binding->>Binding: flush queued commands
```

`CreateSpatializedElementAnimation` only creates a native animation object and locks its timeline. Create itself does not start frame sampling unless followed by implicit play-on-bind or a queued explicit `play` flush.

## Pre-bind explicit play sequence

```mermaid
sequenceDiagram
  participant App
  participant API as React PlaybackApi
  participant Binding as React AnimationBinding
  participant Element as Core SpatializedElement
  participant CoreObj as Core AnimationObject
  participant Scene as visionOS SpatialScene
  participant Manager as visionOS AnimationManager
  participant Driver as Frame driver / CADisplayLink
  participant NativeObj as visionOS AnimationObject
  participant WebMsg as NativeWebMsg

  App->>API: api.play() before bind
  API->>Binding: dispatch(play)
  Binding->>Binding: queue explicit play command

  App->>Binding: bind(target element, kind)
  Binding->>Element: createAnimation(config)
  Element-->>Binding: Core AnimationObject(uuid)

  Binding->>CoreObj: flush queued play()
  CoreObj->>Scene: ControlSpatializedElementAnimation(play)
  Scene->>Manager: controlAnimation(animationId, play)
  Manager->>NativeObj: play()
  Manager->>Driver: start if any animation is running
  Driver->>Manager: tickAll(timestamp)
  NativeObj->>WebMsg: SpatialAnimationStateChanged(running)
  WebMsg->>CoreObj: event
  CoreObj->>CoreObj: filter by uuid and update state
  CoreObj->>API: notify subscribers
```

`autoStart: false` only disables implicit play-on-bind and MUST NOT drop explicit pre-bind `api.play()`.

## Frame loop lifecycle

`Frame driver / CADisplayLink` is an internal scheduling capability of `SpatializedElementAnimationManager`, backed by a platform frame callback such as `CADisplayLink`. The driver only provides per-frame timestamps to the manager and does not own animationId, target element, timeline, playback state, or WebMsg emission responsibilities.

When a control command makes at least one `Native AnimationObject` enter `running`, the manager starts the frame loop, including `play` and `resume`. After `pause`, `stop`, `reset`, `finish`, `destroy`, natural completion, `destroyAnimationsForElement`, and scene/page cleanup, the manager must check whether the frame loop can stop. The frame loop must stop when there are no running native animation objects.

## Frame sampling and writes

```mermaid
sequenceDiagram
  participant Driver as Frame driver / CADisplayLink
  participant Manager as visionOS AnimationManager
  participant Obj as visionOS AnimationObject
  participant Sampler as TimelineSampler
  participant Element as Native SpatializedElement
  participant Mask as AnimatingMask
  participant WebMsg as NativeWebMsg

  Driver->>Manager: tickAll(timestamp)
  Manager->>Obj: tick(timestamp)
  Obj->>Sampler: sample(time)
  Sampler-->>Obj: SpatializedVisualValues
  Obj->>Mask: mark transform/opacity animation-owned
  Obj->>Element: write transform / opacity / modelTransform

  alt reaches terminal
    Obj->>Obj: playState = finished
    Obj->>Mask: clear or update by terminal handoff rules
    Obj->>Manager: report terminal
    Manager->>WebMsg: SpatialAnimationStateChanged(finished, values)
    Manager->>Driver: stop if no animation is running
  end
```

## Mask conflict handling

```mermaid
sequenceDiagram
  participant Core as Core normal element sync
  participant Scene as visionOS SpatialScene
  participant Element as Native SpatializedElement
  participant Mask as AnimatingMask
  participant Obj as Native AnimationObject

  Obj->>Mask: mark transform animation-owned
  Core->>Scene: UpdateSpatializedElementTransform(elementId, transform)
  Scene->>Element: findSpatialObject(elementId).applyTransformUpdate(update)
  Element->>Mask: check transform owner

  alt transform is animation-owned
    Element-->>Scene: ignore or defer conflicting transform update
  else transform not animation-owned
    Element->>Element: apply normal transform update
  end
```

The mask lives on native `SpatializedElement` runtime or target write adapter and does not depend on `PortalInstanceObject`.

## Config changes and destruction

```mermaid
sequenceDiagram
  participant React as React AnimationBinding
  participant OldObj as Core AnimationObject old
  participant Element as Core SpatializedElement
  participant Scene as visionOS SpatialScene
  participant Manager as visionOS AnimationManager
  participant Driver as Frame driver / CADisplayLink

  React->>React: normalized config signature changed
  React->>OldObj: destroy()
  OldObj->>Scene: DestroySpatialObject(animationId)
  Scene->>Scene: findSpatialObject(animationId)
  Scene->>Manager: destroyAnimation(animationId)
  Manager->>Manager: clear mask, remove animation lookup
  Manager->>Driver: stop if no animation is running
  Scene->>Scene: spatialObjects remove via SpatialObject destroy lifecycle

  React->>Element: createAnimation(newConfig)
  Element->>Scene: CreateSpatializedElementAnimation(new timeline)
  Scene->>Manager: createAnimation(command)
  Manager-->>Scene: new uuid
  Scene-->>Element: new uuid
  Element-->>React: New Core AnimationObject
```

Config changes do not hot-update an existing object. The target state uses destroy + recreate. `AnimationObject.destroy()` enters the existing `SpatialObject` destroy lifecycle.

## Current visionOS implementation reuse strategy

| Current capability | Reuse decision |
|--------------------|----------------|
| `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` | Reuse directly as the registration entry point for animation create/control commands. |
| `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` | Reuse directly as the common object store and lookup mechanism for native `AnimationObject`. |
| `SpatializedElementMotionTimelineSampler.swift` | Reuse directly as the locked sampler owned by native `AnimationObject`. |
| `SpatializedElementMotionTiming.swift` | Reuse timing function / loop config directly. |
| `SpatializedElementMotionTransformTypes.swift` | Reuse transform components directly. |
| `SpatializedElementMotionTransformAdapter.swift` | Refactor into target write adapter; Static3D opacity must still be rejected before create. |
| `SpatializedElementMotionManager.swift` | Refactor into `SpatializedElementAnimationManager`, preserving shared frame driver, lookup, terminal values, and compose/decompose ideas. |
| `SpatializedElementMotionSession.swift` | Do not keep the class; migrate timing fields and state algorithm into native `AnimationObject`. |
| `AnimateSpatializedElementMotionCommand` | Remove; replace with `CreateSpatializedElementAnimation` and `ControlSpatializedElementAnimation`. |
| `${animationId}_completed/canceled/failed` WebMsg | Remove; replace with unified `SpatialAnimationStateChanged`. |
