## Why

Today, `SpatialDiv` in the WebSpatial SDK can only be updated via regular DOM / CSS updates for `transform` and `opacity`, with no built-in declarative visual animation. Common spatial UI patterns like entrance transitions, subtle hover movement, rotation emphasis, scale feedback, and fade in/out require per-frame app-side driving, which is costly and easy to conflict with the existing sync pipeline.

This repo already has an `entity transform animation` proposal that establishes an API direction centered on `useAnimation(config)` and an `animation` prop. Extending that family to `SpatialDiv` lets us keep a consistent surface while locking down the property whitelist, runtime capability detection, and cross-layer contracts up front, so implementation does not fight `SpatialDiv`'s existing DOM sync behavior.

## At a Glance

```jsx
Minimal usage (illustrative):

const [animation, api] = useAnimation({
  from: { transform: { translate: { y: 24 }, scale: { x: 0.96, y: 0.96, z: 1 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 }, scale: { x: 1, y: 1, z: 1 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

<div enable-xr animation={animation} style={{ width: 300, height: 200 }}>
  <h2>Hello Spatial</h2>
</div>
```

The hook declares *what* to animate; playback runs on the native side. `api.play()`, `pause()`, and `cancel()` provide imperative control, while `onError` surfaces asynchronous bridge/native failures.

## What Changes

- Add `SpatialDiv` animation support, following the same family design of `useAnimation(config)` plus an `animation` prop, making `<div enable-xr animation={animation} />` a first-class usage.
- In the `useAnimation` entrypoint, auto-route to the entity path vs the `SpatialDiv` path based on the key set in `config.to`. The two key sets are mutually exclusive; the entity animation core logic remains unchanged.
- Restrict animatable properties to an approved visual-only whitelist that does not change layout or spatial sizing semantics: `transform.translate.x/y/z`, `transform.rotate.x/y/z`, `transform.scale.x/y/z`, and `opacity`.
- Define `transform` animation as accepting only structured numeric `translate`, `rotate`, and `scale` components, aligned with CSS `translateX/Y/Z()`, `rotateX/Y/Z()`, and `scaleX/Y/Z()`. Arbitrary CSS transform strings, `skew`, and matrix interpolation are not supported.
- Explicitly reject layout-affecting, native panel sizing, depth, or spatial-position semantics, including `width`, `height`, `back` / `backOffset`, and `depth`.
- Reuse the same imperative controls and lifecycle semantics as entity animation: `play`, `pause`, `cancel`, `onStart`, `onComplete`, `onCancel`, `onError`, `delay`, `autoStart`, `loop`, `playbackRate`. Reuse the `AnimationError` type defined by the entity animation proposal.
- Extend runtime capabilities with a sub-token capability key `supports('useAnimation', ['element'])` for `SpatialDiv` animation to avoid coupling with the semantics of entity `supports('useAnimation', ['entity'])`.
- Specify how `SpatialDiv` animation interacts with the existing DOM / computed-style sync path so that controlled fields are not overwritten during playback.
- Define end-to-end cross-layer contracts (React SDK → Core SDK → JSBridge → Native), including the `Spatialized2DElement.animateSpatialDiv()` signature, event payloads, listener registration ordering, `animationId` uniqueness, and terminal event mutual exclusion.

## Capabilities

### New Capabilities

- `spatial-div-animation`: Declarative and imperative visual animation for `SpatialDiv`, covering the whitelisted fields `transform.translate.x/y/z`, `transform.rotate.x/y/z`, `transform.scale.x/y/z`, and `opacity`, plus lifecycle callbacks, error handling, and React integration rules.

### Modified Capabilities

- `runtime-capabilities`: Add and document the capability sub-token `supports('useAnimation', ['element'])` for runtime feature detection of `SpatialDiv` animation.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the visionOS native bridge / scene runtime.
- **Public API**: Add `SpatialDiv`-specific `useAnimation` config/value types (`SpatialDivAnimationConfig`, `SpatialDivAnimatedValues`), `animation` prop behavior for spatialized HTML nodes, and an entity-aligned imperative control object. Reuse the entity animation `AnimationError` type.
- **useAnimation Hook**: Add a key-set-based if/else split at the entrypoint; the entity path core logic (validation, Vec3→Float4x4 conversion, bridge commands, suppression, callback dispatch) remains unchanged.
- **SpatialDiv Sync Path**: Update `PortalInstanceObject`'s regular property/transform sync to add field-level suppression and animation session binding.
- **Runtime Capabilities**: Add parsing, docs, and tests for `supports('useAnimation', ['element'])`.
- **Documentation**: Add `SpatialDiv` animation usage, whitelisted fields, known limitations, and capability detection guidance.
- **Breaking changes**: None. This change is additive.
