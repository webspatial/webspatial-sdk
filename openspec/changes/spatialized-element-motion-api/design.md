## Context and goals

This change defines declarative motion for three spatialized container kinds:

- `spatialized2d` via `Spatialized2DElement`
- `static3d` via `SpatializedStatic3DElement`
- `dynamic3d` via `SpatializedDynamic3DElement`

All three share the same public segment/timeline authoring model and canonical internal `tracks` execution model, but they differ in React binding entry points and native write paths. Entity animation remains a separate stack.

The design defines playback lifecycle, native frame sampling, animation-owned masks, terminal callback semantics, public segment/timeline authoring, canonical internal `tracks`, `xr-animation` bind-time target resolution, and the React `style` outlet.

## Architecture

The implementation is split across React SDK, Core SDK, and native runtime:

- React SDK exports the ready-gated `useAnimation` and `useEntityAnimation` facades from `@webspatial/react-sdk/experimental`. React SDK owns `AnimationBinding`, created by `useAnimation(config)`. It stores config, queues pre-bind commands, and creates the Core `AnimationObject` only after `xr-animation` resolves a concrete `SpatializedElement` target.
- Core SDK owns `AnimationObject extends SpatialObject`. It resolves playback controls, inherits `destroy()`, subscribes to `NativeWebMsg`, filters `SpatialAnimationStateChanged` by matching animation identity, and updates its own observable state.
- visionOS owns native `AnimationObject extends SpatialObject` and `SpatializedElementAnimationManager`. `SpatialScene` registers JSB listeners and stores native spatial objects; the manager owns animation business lifecycle, create/control lookup, frame loop scheduling, element destroy cascading, animating mask coordination, and construction of `SpatialAnimationStateChanged` payloads sent through the WebMsg path.

## Public authoring and internal representation

The experimental `useAnimation(config)` input accepts either top-level `from` / `to` segment authoring or a `timeline` object. The top-level branch requires both boundaries. The timeline branch carries its boundaries inside `timeline`; the timeline as a whole must define both a start frame (`from`/`0%`) and an end frame (`to`/`100%`), and Core rejects a timeline missing either boundary rather than filling it from underlying style. A timeline may mix `from`, `to`, and percentage-keyframe entries. When timeline is present, Core discards any top-level `from` and `to` before validation and normalization, emitting an unconditional development warning that the top-level boundaries are ignored. Public `tracks` authoring remains invalid.

Core treats timeline `from` as 0% and `to` as 100%, merges them with percentage entries, and normalizes every property independently into a numeric track with absolute-time keyframes. A property track may begin after the timeline start or end before the timeline end, but it must contain at least two keyframes; the timeline itself must still supply a start and end boundary frame. Sampling before the first keyframe holds its first value, and sampling after the last keyframe holds its last value. A property declared in both `from` and `0%`, or in both `to` and `100%`, fails validation as a duplicate boundary declaration. Track, keyframe, property-path, normalized timeline, and native wire types remain internal implementation details: they are not exported from the stable package entry points, accepted by `useAnimation`, documented as authoring API, or exposed through an experimental entry point.

Core sends fully resolved numeric tracks to native, so the existing native timeline sampler contract remains unchanged.

## React SDK module boundaries

| Module | Responsibility |
|--------|----------------|
| `useAnimation(config)` | Creates `AnimationBinding`, `PlaybackApi`, and the `style` outlet. |
| `AnimationBinding` | Stores config, tracks normalized config signature, queues pre-bind explicit commands, and creates Core `AnimationObject` after bind. |
| `PlaybackApi` | Exposes React-facing `play/pause/stop/reset/finish` and subscribes to Core `AnimationObject` state. `play()` resumes a paused session and is a no-op while running. |
| `xr-animation` binding adapter | Resolves concrete target kind and triggers `AnimationBinding.bind()` / `unbind()`. |

The `style` outlet is the React-side visual-state closure output of `useAnimation(config)`. Authors MUST merge it onto the same host that receives `xr-animation` so later rerender or resync reads the same visual state that the animation session last emitted. The `style` outlet is not the runtime playback source for native-backed animation; playback still comes from the native `AnimationObject`.

## Core SDK module boundaries

| Module | Responsibility |
|--------|----------------|
| `SpatializedElement.createAnimation(config)` | Creates a native-backed `AnimationObject` after target binding, and owns validation, normalization, and create JSB send; native response returns the created object identity as `{ id }`. |
| `AnimationObject` | First-class Core object extending `SpatialObject`; implements playback controls directly, inherits `destroy()`, subscribes to NativeWebMsg directly, and owns its state. |
| `validateSpatializedMotionConfig` | Applies timeline precedence, rejects duplicate boundary declarations, and validates that resulting internal tracks contain at least two keyframes, including Static3D `opacity`. |
| `motionConfigToAnimationTimeline` | Compiles normalized motion config into the canonical `CreateSpatializedElementAnimation` payload. |

## Native Runtime / visionOS module boundaries

| Module | Responsibility |
|--------|----------------|
| `SpatialScene JSB listeners` | `SpatialScene.setupJSBListeners()` / `spatialWebViewModel.addJSBListener(...)` register animation create/control commands and delegate them to `SpatializedElementAnimationManager`. |
| `SpatializedElementAnimationManager` | Manages native `AnimationObject` business lifecycle, `animationId -> NativeAnimationObject` lookup, create/control, frame loop start/stop, `destroyAnimationsForElement`, mask coordination, and construction of `SpatialAnimationStateChanged` payloads. |
| `Native AnimationObject` | Extends `SpatialObject`; owns object identity, locked `TimelineSampler`, playback state, and implements `play/pause/resume/stop/reset/finish/tick/destroy`; `reset/finish` operate on the same object and do not recreate it. |
| `SpatialScene.spatialObjects` | `SpatialScene.spatialObjects` / `addSpatialObject` / `findSpatialObject` / destroy path register, look up, and destroy native spatial objects, including `AnimationObject`. |
| `TimelineSampler` | Samples the locked canonical numeric timeline. |
| `Frame driver / CADisplayLink` | Internal scheduling capability of `SpatializedElementAnimationManager`; the manager starts it while any animation is running, it calls `manager.tickAll(timestamp)` every frame, and the driver itself owns no animation semantics. |
| `ElementAnimationWriteAdapter` | Called by `Native AnimationObject.tick()` to write container-root `transform` and `opacity` according to target kind; the manager does not perform per-property writes. |
| `AnimatingMask` | Records animation-owned fields and prevents regular element sync from overriding active animation. |
| `SpatialScene WebMsg send path` | `SpatialScene` / `spatialWebViewModel` emit unified `SpatialAnimationStateChanged`. |

## Target kind field mapping

| target kind | writable fields | mask fields |
|-------------|-----------------|-------------|
| `spatialized2d` | `transform`, `opacity` | `transform`, `opacity` |
| `dynamic3d` | `transform`, `opacity` | `transform`, `opacity` |
| `static3d` | `transform`, `opacity` | `transform`, `opacity` |

Static3D `transform` and `opacity` tracks must be preserved through native create. Static3D animation writes the `SpatializedStatic3DElement` container-root `transform` and `opacity`; it must not write model-internal `entityTransform` / `modelTransform` fields or affect USD embedded clip playback.

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
      +id: string
      +destroy(): Promise<void>
    }

    class SpatializedElement {
      <<abstract>>
      +id: string
      +createAnimation(config): Promise~AnimationObject~
    }

    class CoreAnimationObject {
      +id: string
      +playState: PlayState
      +isAnimating: boolean
      +isPaused: boolean
      +finished: boolean
      +play(): Promise<void>
      +pause(): Promise<void>
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
      +sendWebMsg(type, payload)
      +onCreateSpatializedElementAnimation(command)
      +onControlSpatializedElementAnimation(command)
      +onDestroySpatialObjectCommand(command)
    }

    class NativeSpatialObject {
      <<abstract>>
      +id: UUID
      +destroy()
    }

    class NativeSpatializedElement {
      <<abstract>>
      +id: UUID
      +animatingMask: AnimatingMask
      +applyTransformUpdate(update)
      +applyOpacityUpdate(update)
      +destroy()
    }

    class NativeAnimationObject {
      +id: UUID
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

    class ElementAnimationWriteAdapter {
      +apply(sample, target, kind)
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
  SpatializedElement --> CoreAnimationObject : wraps response id
  CoreAnimationObject --> ControlSpatializedElementAnimation : sends JSB
  CoreAnimationObject --> SpatialAnimationStateChanged : filters by animation id

  NativeSpatialObject <|-- NativeSpatializedElement
  NativeSpatialObject <|-- NativeAnimationObject
  SpatialScene --> SpatializedElementAnimationManager : owns
  SpatialScene --> NativeSpatialObject : stores in spatialObjects
  SpatialScene --> CreateSpatializedElementAnimation : registers JSB listener
  SpatialScene --> ControlSpatializedElementAnimation : registers JSB listener
  SpatializedElementAnimationManager --> FrameDriver : owns internal scheduler
  FrameDriver --> SpatializedElementAnimationManager : tickAll(timestamp)
  SpatializedElementAnimationManager --> NativeAnimationObject : manages lifecycle/control
  SpatializedElementAnimationManager --> SpatialScene : sends WebMsg
  SpatializedElementAnimationManager --> NativeSpatializedElement : lookup target via SpatialScene.findSpatialObject
  NativeSpatializedElement --> AnimatingMask : owns
  NativeAnimationObject --> TimelineSampler : owns locked timeline
  NativeAnimationObject --> ElementAnimationWriteAdapter : applies sampled values
  ElementAnimationWriteAdapter --> NativeSpatializedElement : writes transform / opacity
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
  Element->>Scene: CreateSpatializedElementAnimation(target, timeline)
  Scene->>Manager: createAnimation(command)
  Manager->>Scene: findSpatialObject(targetElementId)
  Manager->>Manager: resolve target kind from native element type
  Manager->>NativeObj: new AnimationObject(object id, locked timeline)
  Manager->>Scene: addSpatialObject(animationObject)
  Manager-->>Scene: { id: object identity }
  Scene-->>Element: { id }
  Element->>CoreObj: new AnimationObject(id)
  CoreObj->>CoreObj: subscribe NativeWebMsg SpatialAnimationStateChanged
  Element-->>Binding: Core AnimationObject
  Binding->>Binding: flush queued commands
```

`CreateSpatializedElementAnimation` only creates a native animation object and locks its fully resolved numeric timeline. Create itself does not start frame sampling unless followed by implicit play-on-bind or a queued explicit `play` flush.

## Playback controls and object lifecycle

`play`, `pause`, `stop`, `reset`, and `finish` all operate on the same already-created `AnimationObject`. `play()` starts an idle session, resumes a paused session, and is a no-op while running. These playback controls do not recreate the native object and do not change the object id.

Only config signature changes, target rebinding, recreation after explicit `destroy()`, or element destroy cascading enter the destroy + recreate lifecycle. `reset()` writes the timeline sample at time zero and `finish()` writes the sample at duration; sparse property tracks therefore use their first and last values respectively. Both controls operate on the current native `AnimationObject`.

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
  Element-->>Binding: Core AnimationObject

  Binding->>CoreObj: flush queued play()
  CoreObj->>Scene: ControlSpatializedElementAnimation(play)
  Scene->>Manager: controlAnimation(animationId, play)
  Manager->>NativeObj: play()
  Manager->>Driver: start if any animation is running
  Driver->>Manager: tickAll(timestamp)
  NativeObj->>Manager: state changed running
  Manager->>Scene: sendWebMsg(SpatialAnimationStateChanged)
  WebMsg->>CoreObj: event
  CoreObj->>CoreObj: filter by animation id and update state
  CoreObj->>API: notify subscribers
```

`autoStart: false` only disables implicit play-on-bind and MUST NOT drop explicit pre-bind `api.play()`.

`api.finish()` has split semantics: before bind it is an explicit queued intent, so the visible API stays `queued` with `finished=false`; after the native-backed `AnimationObject` exists, the queued command flushes and the terminal state only becomes `finished` when native confirms it.

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
  participant Adapter as ElementAnimationWriteAdapter
  participant Element as Native SpatializedElement
  participant Mask as AnimatingMask
  participant Scene as SpatialScene WebMsg path

  Driver->>Manager: tickAll(timestamp)
  Manager->>Obj: tick(timestamp)
  Obj->>Sampler: sample(time)
  Sampler-->>Obj: SpatializedVisualValues
  Obj->>Mask: mark target-kind mask fields
  Obj->>Adapter: apply(sample, target, kind)
  Adapter->>Element: write transform / opacity

  alt reaches terminal
    Obj->>Obj: playState = finished
    Obj->>Mask: clear or update by terminal handoff rules
    Obj->>Manager: report terminal
    Manager->>Scene: sendWebMsg(SpatialAnimationStateChanged, values)
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

The mask lives on the native `SpatializedElement` runtime or target write adapter.

## Terminal mask handoff

| action | value write | mask handoff |
|--------|-------------|--------------|
| `pause` | preserve current sampled value | keep mask because the animation still owns the visual field |
| `stop` | write current sampled value | release mask fields owned by this animation |
| `reset` | write the sample at time zero | release mask fields owned by this animation |
| `finish` | write the sample at duration | release mask fields owned by this animation |
| natural completion | write the sample at duration | release mask fields owned by this animation |
| `destroy` | do not force an additional terminal write; clean up the animation | release mask fields owned by this animation |

## Config changes, destruction, and cascading cleanup

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
  Manager-->>Scene: { id: new object identity }
  Scene-->>Element: { id }
  Element-->>React: New Core AnimationObject
```

Config changes use destroy + recreate. `AnimationObject.destroy()` enters the `SpatialObject` destroy lifecycle.

When the target `SpatializedElement` is destroyed, the native runtime must destroy all related `AnimationObject` instances through `SpatializedElementAnimationManager.destroyAnimationsForElement(elementId)`. This flow must enter each animation object's destroy lifecycle and must not only remove objects from the manager lookup.
