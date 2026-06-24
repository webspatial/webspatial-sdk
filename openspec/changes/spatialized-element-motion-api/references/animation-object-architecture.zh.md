# AnimationObject 架构参考

本文是 `spatialized-element-motion-api` 目标态的非规范性架构参考。规范性 MUST 约束仍以 `specs/*/spec.md` 和 `specs/*/spec.zh.md` 为准。

## 三包职责

| 层 | 核心对象 | 职责 |
|----|----------|------|
| React SDK | `AnimationBinding` | 由 `useAnimation(config)` 创建，保存 config，等待 `xr-animation` 绑定具体 target，支持 bind 前命令排队。 |
| React SDK | `PlaybackApi` | 暴露 `play/pause/resume/stop/reset/finish`，内部转发给 `AnimationBinding`，绑定后订阅 Core `AnimationObject` 状态。 |
| Core SDK | `SpatializedElement` | 具体空间元素对象，提供 `createAnimation(config)`。 |
| Core SDK | `AnimationObject extends SpatialObject` | Core 一等动画对象，持有 native uuid，直接实现播放方法，继承 `destroy()`，直接订阅 `NativeWebMsg`。 |
| visionOS | `AnimationObject extends SpatialObject` | Native 一等动画对象，持有 locked timeline sampler、播放状态、frame timing 和 target 写入逻辑。 |
| visionOS | `SpatializedElementAnimationManager` | Native 动画管理器，负责 create/control lookup、registry、element 级联销毁、mask 协调和 WebMsg 广播。 |
| visionOS | `TimelineSampler` / `TimingFunction` / `TransformAdapter` | 现有实现中可复用的底层采样、缓动和写入适配能力。 |

## 合并类图

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

    class SpatializedContainer {
      +xr-animation?: AnimationBinding
    }

    class Model {
      +xr-animation?: AnimationBinding
    }

    class Reality {
      +xr-animation?: AnimationBinding
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
  SpatializedContainer --> AnimationBinding : bind spatialized2d
  Model --> AnimationBinding : bind static3d
  Reality --> AnimationBinding : bind dynamic3d
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

## 创建时序

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

## Bind 前显式 play 时序

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

`autoStart: false` 只禁止 implicit play-on-bind，不得丢弃 bind 前显式 `api.play()`。

## 每帧采样与写入

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

## Mask 冲突时序

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

Mask 位于 native `SpatializedElement` runtime 或 target write adapter，不依赖 `PortalInstanceObject`。

## Config 变化

```mermaid
sequenceDiagram
  participant React as React AnimationBinding
  participant OldObj as Core AnimationObject old
  participant Element as Core SpatializedElement
  participant NewObj as Core AnimationObject new
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

Config 变化不做 hot update；目标态使用 destroy + recreate。

## 现有 visionOS 实现复用策略

| 现有能力 | 复用结论 |
|----------|----------|
| `SpatializedElementMotionTimelineSampler.swift` | 直接复用为 native `AnimationObject` 的 locked sampler。 |
| `SpatializedElementMotionTiming.swift` | 直接复用 timing function / loop config。 |
| `SpatializedElementMotionTransformTypes.swift` | 直接复用 transform components。 |
| `SpatializedElementMotionTransformAdapter.swift` | 改造为 target write adapter；Static3D opacity 仍必须在 create 前 reject。 |
| `SpatializedElementMotionManager.swift` | 重构为 `SpatializedElementAnimationManager`，保留 shared frame driver、查找、terminal values、compose/decompose 思路。 |
| `SpatializedElementMotionSession.swift` | 不保留类；迁移 timing 字段和状态算法到 native `AnimationObject`。 |
| `AnimateSpatializedElementMotionCommand` | 废弃；替换为 `CreateSpatializedElementAnimation` 和 `ControlSpatializedElementAnimation`。 |
| `${animationId}_completed/canceled/failed` WebMsg | 废弃；替换为统一 `SpatialAnimationStateChanged`。 |
