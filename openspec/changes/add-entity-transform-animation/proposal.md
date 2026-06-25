## Why

**Problem**

WebSpatial SDK can update entity transform props (position, rotation, scale), but every change is instantaneous — there is no built-in transition. Common spatial UX patterns such as entrance animations, smooth moves, rotations, delayed appearances, and looping motion are hard to express consistently across apps.

**Approach**

Introduce a react-spring-inspired declarative `useAnimation` API on the React side, while delegating actual playback to RealityKit's native animation engine. This keeps animation at 90 fps without per-frame JS-to-native bridge calls.

**Why now**

The public API shape, feature-detection contract, and cross-layer behavior need to be agreed before implementation starts, so this proposal locks the spec first.

## At a Glance

```tsx
import {
  Reality,
  SceneGraph,
  BoxEntity,
  useAnimation,
} from '@webspatial/react-sdk'

function AnimatedBox() {
  const [animation, api] = useAnimation({
    to: { position: { x: 0, y: 1.5, z: -2 } },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <Reality style={{ width: '100%', height: '600px', '--xr-depth': 150 }}>
      <SceneGraph>
        <BoxEntity
          width={0.3}
          height={0.3}
          depth={0.3}
          animation={animation}
        />
      </SceneGraph>
    </Reality>
  )
}
```

The hook declares *what* to animate; playback runs natively at 90 fps. `api.play()`, `pause()`, and `cancel()` give imperative control when needed, with `play()` resuming the current session after a pause, while `onError` surfaces asynchronous bridge/native failures. Native-backed state changes are observed asynchronously, so a same-tick read of `api.playState` / `api.finished` after a command call may still return the previously committed state until the matching native event arrives.

## What Changes

- Add a new entity transform animation capability centered on a React `useAnimation(config)` hook and an `animation` prop for entity components.
- Add imperative playback controls with `play`, `pause`, and `cancel`, plus `finished`, `onStart`, natural completion, cancellation that restores `from`, and `onError` lifecycle / error callbacks.
- Define timing behavior for `duration`, `timingFunction`, `delay`, `autoStart`, and `loop` with reverse support aligned with the reviewed API direction.
- Define the cross-layer contract for React, core SDK, JSBridge, and native playback so animations run natively and do not fight normal transform updates.
- Define the scope of the `animation` prop with separate static and runtime guarantees:
  - **Static (TypeScript) guarantee**: The `animation` prop is only exposed in the type definitions of entity components that integrate with the `SpatialEntity` abstraction (e.g. `BoxEntity`, `ModelEntity`). Non-entity components (`SpatialDiv`, plain HTML elements) and non-Reality-entity `Model` components do not include this prop in their types, so passing it is a compile-time error. Note that TypeScript **cannot** statically prove that an entity component is actually rendered inside a `Reality` / `SceneGraph` subtree — this is a runtime concern.
  - **Runtime behavior when entity is unbound**: If a component with `useAnimation` is rendered outside `Reality` / `SceneGraph` (i.e. it never binds to a `SpatialEntity` context), the following behavior applies:
    - `api.play()` transitions `playState` to `queued` and remains there until either the entity binds to a `SpatialEntity` context (at which point playback starts normally) or the component unmounts (at which point the queued session is discarded).
    - `api.pause()` freezes the pending play request in `paused` state; after the entity binds, playback remains paused until the application calls `api.play()` again.
    - `api.cancel()` cancels the queued session, returns `playState` to `'idle'`, and fires `onCancel`.
    - `api.isAnimating` remains `true` while `playState` is `'queued'`; after a queued pause, `api.isAnimating` becomes `false` and `api.isPaused` becomes `true`.
    - For already bound native sessions, `playState` / `finished` update on the corresponding native state event rather than synchronously at command return time; only the queued/unbound path updates local state immediately.
    - No lifecycle callbacks (`onStart`, `onComplete`, `onCancel`) fire while unbound; `onError` is not triggered either, since the absence of a bound entity is a valid waiting state, not an error.
    - On unmount, any queued session is silently cleaned up with no callbacks.
- Extend runtime capability documentation so applications can query `supports("useAnimation", ["entity"])` before relying on the animation API.

## Capabilities

### New Capabilities

- `entity-transform-animation`: Declarative and imperative animation of entity transform properties (position, rotation, scale only; non-transform properties such as material, opacity, and color are out of scope), including `onStart`, `onComplete`, `onCancel`, `onError`, and React integration rules.

### Modified Capabilities

- `runtime-capabilities`: Add a documented `supports("useAnimation", ["entity"])` capability key for the entity transform animation API.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the visionOS native bridge / scene runtime.
- **Public API**: New `useAnimation` hook, entity `animation` prop, and animation playback methods.
- **Documentation**: Update the entity animation docs and capability documentation.
- **Validation**: Add coverage for runtime capability checks, React API behavior, JSBridge command flow, native completion / cancel events, and asynchronous error callback behavior.
- **Breaking changes**: None. This change is purely additive.
