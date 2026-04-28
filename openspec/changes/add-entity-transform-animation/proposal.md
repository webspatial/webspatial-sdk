## Why

**Problem**

WebSpatial SDK can update entity transform props (position, rotation, scale), but every change is instantaneous — there is no built-in transition. Common spatial UX patterns such as entrance animations, smooth moves, rotations, delayed appearances, and looping motion are hard to express consistently across apps.

**Approach**

Introduce a react-spring-inspired declarative `useAnimation` API on the React side, while delegating actual playback to RealityKit's native animation engine. This keeps animation at 90 fps without per-frame JS-to-native bridge calls.

**Why now**

The public API shape, feature-detection contract, and cross-layer behavior need to be agreed before implementation starts, so this proposal locks the spec first.

## At a Glance

```tsx
// Minimal usage — surrounding <Reality> and <SceneGraph> omitted for brevity
const [animation, api] = useAnimation({
  to: { position: { x: 0, y: 1.5, z: -2 } },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// Inside a <SceneGraph>:
<BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
```

The hook declares *what* to animate; playback runs natively at 90 fps. `api.play()`, `pause()`, `resume()`, and `stop()` give imperative control when needed, while `onError` surfaces asynchronous bridge/native failures.

## What Changes

- Add a new entity transform animation capability centered on a React `useAnimation(config)` hook and an `animation` prop for entity components.
- Add imperative playback controls with `play`, `pause`, `resume`, and `stop`, plus `onStart`, natural completion, `stop`, and `onError` lifecycle / error callbacks.
- Define timing behavior for `duration`, `timingFunction`, `delay`, `autoStart`, and `loop` with reverse support aligned with the reviewed API direction.
- Define the cross-layer contract for React, core SDK, JSBridge, and native playback so animations run natively and do not fight normal transform updates.
- Extend runtime capability documentation so applications can query `supports('useAnimation')` before relying on the animation API.

## Capabilities

### New Capabilities

- `entity-transform-animation`: Declarative and imperative animation of entity transform properties (position, rotation, scale only; non-transform properties such as material, opacity, and color are out of scope), including `onStart`, `onComplete`, `onStop`, `onError`, and React integration rules.

### Modified Capabilities

- `runtime-capabilities`: Add a documented `supports('useAnimation')` capability key for the entity transform animation API.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the visionOS native bridge / scene runtime.
- **Public API**: New `useAnimation` hook, entity `animation` prop, and animation playback methods.
- **Documentation**: Update the entity animation docs and capability documentation.
- **Validation**: Add coverage for runtime capability checks, React API behavior, JSBridge command flow, native completion / stop events, and asynchronous error callback behavior.
- **Breaking changes**: None. This change is purely additive.