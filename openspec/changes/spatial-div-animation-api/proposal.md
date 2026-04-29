## Why

Today, `SpatialDiv` in the WebSpatial SDK can only be updated via regular DOM / CSS updates (for example `transform`, `--xr-back`, `--xr-depth`, `opacity`, and sizing), with no built-in declarative animation. Common spatial UI patterns like entrance transitions, smooth depth movement, fade in/out, and panel size transitions require per-frame app-side driving, which is costly and easy to conflict with the existing sync pipeline.

This repo already has an `entity transform animation` proposal that establishes an API direction centered on `useAnimation(config)` and an `animation` prop. Extending that family to `SpatialDiv` lets us keep a consistent surface while locking down the property whitelist, runtime capability detection, and cross-layer contracts up front, so implementation does not fight `SpatialDiv`'s existing DOM sync behavior.

## At a Glance

```jsx
Minimal usage (illustrative):

const [animation, api] = useAnimation({
  from: { back: -50, opacity: 0 },
  to:   { back: 0, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

<div enable-xr animation={animation} style={{ width: 300, height: 200 }}>
  <h2>Hello Spatial</h2>
</div>
```

The hook declares *what* to animate; playback runs on the native side. `api.play()`, `pause()`, `resume()`, and `stop()` provide imperative control, while `onError` surfaces asynchronous bridge/native failures.

## What Changes

- Add `SpatialDiv` animation support, following the same family design of `useAnimation(config)` plus an `animation` prop, making `<div enable-xr animation={animation} />` a first-class usage.
- In the `useAnimation` entrypoint, auto-route to the entity path vs the `SpatialDiv` path based on the key set in `config.to`. The two key sets are mutually exclusive; the entity animation core logic remains unchanged.
- Restrict animatable properties to an approved whitelist: `back`, `transform.translate.x/y/z`, `opacity`, `depth`, `width`, `height`.
- Define `transform` animation as covering only the translation component `transform.translate.x/y/z` in v1 (aligned with CSS `transform: translate3d()`). `SpatialDiv` rotation, scale, and arbitrary CSS transform string interpolation are not supported. Future extensions for rotate/scale can add sub-fields under the `transform` object without breaking changes.
- Define `width` / `height` animation as a native panel-size override for `SpatialDiv`, not a full CSS layout extension; behavior follows native spatial panel sizing.
- Reuse the same imperative controls and lifecycle semantics as entity animation: `play`, `pause`, `resume`, `stop`, `onStart`, `onComplete`, `onStop`, `onError`, `delay`, `autoStart`, `loop`. Reuse the `AnimationError` type defined by the entity animation proposal.
- Extend runtime capabilities with a dedicated capability key for `SpatialDiv` animation to avoid coupling with the semantics of entity `supports('useAnimation')`.
- Specify how `SpatialDiv` animation interacts with the existing DOM / computed-style sync path so that controlled fields are not overwritten during playback.
- Define end-to-end cross-layer contracts (React SDK → Core SDK → JSBridge → Native), including the `Spatialized2DElement.animateSpatialDiv()` signature, event payloads, listener registration ordering, `animationId` uniqueness, and terminal event mutual exclusion.

## Capabilities

### New Capabilities

- `spatial-div-animation`: Declarative and imperative animation for `SpatialDiv`, covering the whitelisted fields `back`, `transform.translate.x/y/z`, `opacity`, `depth`, `width`, and `height`, plus lifecycle callbacks, error handling, and React integration rules.

### Modified Capabilities

- `runtime-capabilities`: Add and document the capability key `supports('spatialDivAnimation')` for runtime feature detection of `SpatialDiv` animation.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the visionOS native bridge / scene runtime.
- **Public API**: Add `SpatialDiv`-specific `useAnimation` config/value types (`SpatialDivAnimationConfig`, `SpatialDivAnimatedValues`), `animation` prop behavior for spatialized HTML nodes, and an entity-aligned imperative control object. Reuse the entity animation `AnimationError` type.
- **useAnimation Hook**: Add a key-set-based if/else split at the entrypoint; the entity path core logic (validation, Vec3→Float4x4 conversion, bridge commands, suppression, callback dispatch) remains unchanged.
- **SpatialDiv Sync Path**: Update `PortalInstanceObject`'s regular property/transform sync to add field-level suppression and animation session binding.
- **Runtime Capabilities**: Add parsing, docs, and tests for `supports('spatialDivAnimation')`.
- **Documentation**: Add `SpatialDiv` animation usage, whitelisted fields, known limitations, and capability detection guidance.
- **Breaking changes**: None. This change is additive.