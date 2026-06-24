# AnimationObject architecture reference

This document is a non-normative architecture reference for the `spatialized-element-motion-api` target state. Normative MUST requirements remain in `specs/*/spec.md` and `specs/*/spec.zh.md`.

## Package responsibilities

| Layer | Core object | Responsibility |
|-------|-------------|----------------|
| React SDK | `AnimationBinding` | Created by `useAnimation(config)`, stores config, waits for `xr-animation` to bind a concrete target, and queues pre-bind commands. |
| React SDK | `PlaybackApi` | Exposes `play/pause/resume/stop/reset/finish`, delegates to `AnimationBinding`, and subscribes to Core `AnimationObject` state after bind. |
| Core SDK | `SpatializedElement` | Concrete spatial element object that exposes `createAnimation(config)`. |
| Core SDK | `AnimationObject extends SpatialObject` | First-class Core animation object with native uuid, direct playback methods, inherited `destroy()`, and direct `NativeWebMsg` subscription. |
| visionOS | `AnimationObject extends SpatialObject` | First-class native animation object owning locked timeline sampler, playback state, frame timing, and target writes. |
| visionOS | `SpatializedElementAnimationManager` | Native animation manager for create/control lookup, registry, element destroy cascading, mask coordination, and WebMsg emission. |
| visionOS | `TimelineSampler` / `TimingFunction` / `TransformAdapter` | Reusable low-level sampling, easing, and target write adaptation from the current implementation. |

## Combined class diagram

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
      #sendJSB(command): Promise<void>
      #onNativeWebMsg(type, handler): Unsubscribe
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

    class NativeWebMsg {
      <<event bus>>
      +on(type, handler): Unsubscribe
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

    class SpatialObjectRegistry {
      +register(object)
      +get(uuid): NativeSpatialObject?
      +destroy(uuid)
      +remove(uuid)
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
  CoreAnimationObject --> NativeWebMsg : subscribes
  NativeWebMsg --> SpatialAnimationStateChanged : emits
  CoreAnimationObject --> SpatialAnimationStateChanged : filters by uuid

  NativeSpatialObject <|-- NativeSpatializedElement
  NativeSpatialObject <|-- NativeAnimationObject
  SpatializedElementAnimationManager --> SpatialObjectRegistry : register / lookup / remove
  SpatializedElementAnimationManager --> NativeSpatializedElement : lookup target
  SpatializedElementAnimationManager --> NativeAnimationObject : manages
  NativeSpatializedElement --> AnimatingMask : owns
  NativeAnimationObject --> TimelineSampler : owns locked timeline
  NativeAnimationObject --> NativeSpatializedElement : writes sampled values
  NativeAnimationObject --> AnimatingMask : marks animation-owned fields
```

## Creation sequence

```mermaid
sequenceDiagram
  participant App
  participant Hook as React useAnimation
  participant Binding as React AnimationBinding
  participant Target as React target
  participant Element as Core SpatializedElement
  participant CoreObj as Core AnimationObject
  participant Manager as visionOS AnimationManager
  participant NativeObj as visionOS AnimationObject

  App->>Hook: useAnimation(config)
  Hook->>Binding: create AnimationBinding(config)
  Hook-->>App: [animation=binding, api, style]

  App->>Target: <Model xr-animation={animation} />
  Target->>Binding: bind(element, static3d)
  Binding->>Element: createAnimation(config)
  Element->>Element: validate + normalize
  Element->>Manager: CreateSpatializedElementAnimation(target, kind, timeline)
  Manager->>NativeObj: new AnimationObject(native uuid, locked timeline)
  Manager-->>Element: native uuid
  Element->>CoreObj: new AnimationObject(uuid)
  CoreObj->>CoreObj: subscribe NativeWebMsg SpatialAnimationStateChanged
  Element-->>Binding: Core AnimationObject
  Binding->>Binding: flush queued commands
```

## Pre-bind explicit play sequence

```mermaid
sequenceDiagram
  participant App
  participant API as React PlaybackApi
  participant Binding as React AnimationBinding
  participant Element as Core SpatializedElement
  participant CoreObj as Core AnimationObject
  participant NativeObj as visionOS AnimationObject
  participant WebMsg as NativeWebMsg

  App->>API: api.play() before bind
  API->>Binding: dispatch(play)
  Binding->>Binding: queue explicit play command

  App->>Binding: bind(target element, kind)
  Binding->>Element: createAnimation(config)
  Element-->>Binding: Core AnimationObject(uuid)

  Binding->>CoreObj: flush queued play()
  CoreObj->>NativeObj: ControlSpatializedElementAnimation(play)
  NativeObj->>WebMsg: SpatialAnimationStateChanged(running)
  WebMsg->>CoreObj: event
  CoreObj->>CoreObj: filter by uuid and update state
  CoreObj->>API: notify subscribers
```

`autoStart: false` only disables implicit play-on-bind and MUST NOT drop explicit pre-bind `api.play()`.

## Frame sampling and writes

```mermaid
sequenceDiagram
  participant Driver as AnimationFrameDriver
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
  end
```

## Mask conflict sequence

```mermaid
sequenceDiagram
  participant Core as Core normal element sync
  participant Element as Native SpatializedElement
  participant Mask as AnimatingMask
  participant Obj as Native AnimationObject

  Obj->>Mask: mark transform animation-owned
  Core->>Element: UpdateSpatializedElementTransform(elementId, transform)
  Element->>Mask: check transform owner

  alt transform is animation-owned
    Element-->>Core: ignore or defer conflicting transform update
  else transform not animation-owned
    Element->>Element: apply normal transform update
  end
```

The mask lives on native `SpatializedElement` runtime or target write adapter and does not depend on `PortalInstanceObject`.

## Config changes

```mermaid
sequenceDiagram
  participant React as React AnimationBinding
  participant OldObj as Core AnimationObject old
  participant Element as Core SpatializedElement
  participant Manager as visionOS AnimationManager

  React->>React: normalized config signature changed
  React->>OldObj: destroy()
  OldObj->>Manager: DestroySpatialObject(animationId)
  Manager->>Manager: destroyAnimation(animationId), clear mask, remove registry entry

  React->>Element: createAnimation(newConfig)
  Element->>Manager: CreateSpatializedElementAnimation(new timeline)
  Manager-->>Element: new uuid
  Element-->>React: New Core AnimationObject
```

Config changes do not hot-update an existing object. Target state uses destroy + recreate.

## Current visionOS implementation reuse strategy

| Current capability | Reuse decision |
|--------------------|----------------|
| `SpatializedElementMotionTimelineSampler.swift` | Reuse directly as the locked sampler owned by native `AnimationObject`. |
| `SpatializedElementMotionTiming.swift` | Reuse timing function / loop config directly. |
| `SpatializedElementMotionTransformTypes.swift` | Reuse transform components directly. |
| `SpatializedElementMotionTransformAdapter.swift` | Refactor into target write adapter; Static3D opacity must still be rejected before create. |
| `SpatializedElementMotionManager.swift` | Refactor into `SpatializedElementAnimationManager`, preserving shared frame driver, lookup, terminal values, and compose/decompose ideas. |
| `SpatializedElementMotionSession.swift` | Do not keep the class; migrate timing fields and state algorithm into native `AnimationObject`. |
| `AnimateSpatializedElementMotionCommand` | Remove; replace with `CreateSpatializedElementAnimation` and `ControlSpatializedElementAnimation`. |
| `${animationId}_completed/canceled/failed` WebMsg | Remove; replace with unified `SpatialAnimationStateChanged`. |
