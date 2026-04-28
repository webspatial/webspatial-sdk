## Why

WebSpatial SDK can update entity transform props today (position, rotation, scale), but every change is instantaneous with no built-in transition. This makes common spatial UX patterns (entrance, move, rotate, scale, delayed appearance, looping motion) harder to express consistently across apps. The reviewed direction introduces a first-class, react-spring-inspired declarative API while delegating playback to RealityKit's native animation engine (90fps) so animation is not JS frame-driven. This change is needed now so the public contract, feature detection, and cross-layer behavior are agreed before implementation starts.

## What Changes

- Add a new entity transform animation capability centered on a React `useAnimation(config)` hook and an `animation` prop for entity components.
- Add imperative playback controls with `play`, `pause`, `resume`, and `stop`, plus lifecycle callbacks for start, natural completion, and stop-with-current-transform.
- Define timing behavior for `duration`, `timingFunction`, `delay`, `autoStart`, and `loop` with reverse support aligned with the reviewed API direction.
- Define the cross-layer contract for React, core SDK, JSBridge, and native playback so animations run natively and do not fight normal transform updates.
- Extend runtime capability documentation so applications can query `supports('useAnimation')` before relying on the animation API.

## Capabilities

### New Capabilities

- `entity-transform-animation`: Declarative and imperative animation of entity transform properties, including playback lifecycle and React integration rules.

### Modified Capabilities

- `runtime-capabilities`: Add a documented `supports('useAnimation')` capability key for the entity transform animation API.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the visionOS native bridge / scene runtime.
- **Public API**: New `useAnimation` hook, entity `animation` prop, and animation playback methods.
- **Documentation**: Update the entity animation docs and capability documentation.
- **Validation**: Add coverage for runtime capability checks, React API behavior, JSBridge command flow, and native completion / stop events.