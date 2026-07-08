## Why

Entity animation already has basic `useEntityAnimation` support, but it still lacks parts of the newer motion story, such as percentage `timeline`, the recommended `xr-animation` binding, and an `entityProps` outlet for React-side terminal-state persistence.

This change does not replace the existing `useEntityAnimation`. It is a non-breaking enhancement on top of the current API. The goal is to add timeline, outlet, binding, and behavior semantics while keeping Entity authoring aligned with Entity props hierarchy.

This proposal supersedes `add-entity-transform-animation` as the target-state Entity motion proposal. The legacy change remains historical context until this new path is fully validated and the follow-up archive or formal supersede step is completed.

## What Changes

- Add an enhancement proposal on top of the existing `useEntityAnimation`.
- Define `useEntityAnimation` as an Entity adapter: `useAnimation config + Entity props outlet`.
- Keep public config aligned with Entity props hierarchy by continuing to use `position`, `rotation`, and `scale`.
- Recommend `xr-animation` binding while keeping `animation` as a compatible binding.
- Introduce `entityProps` as the React outlet for committed Entity transform values.
- Add `api.set(values)`, accepting only sparse patch objects, as the imperative write entry for the committed transform state that `entityProps` mirrors. The `(prev) => next` updater form is not supported.
- Support `from` / `to` and percentage `timeline` as the public path, while keeping `tracks` as an internal non-public API.
- Align playback, callback, and capability semantics with the broader motion family where applicable, while preserving Entity-specific constraints.
- Restrict Entity motion targets to transform-only fields and require explicit failure for unsupported targets such as `opacity`.

### 1. Background

The current Entity animation API uses the legacy `useEntityAnimation` shape:

```text
const [animation, api] = useEntityAnimation({
  from: {
    position: { x: 0, y: 0, z: 0 },
  },
  to: {
    position: { x: 0.1, y: 0, z: 0 },
  },
})

<BoxEntity animation={animation} />
```

This design still differs from the newer `useAnimation` story:

1. Legacy Entity binds through the `animation` prop.
2. The newer motion API recommends `xr-animation`.
3. Legacy Entity animation does not support percentage `timeline` or `tracks`.
4. Entity has no CSS `style` outlet and therefore cannot directly reuse the spatialized element `style` write-back pattern.

### 2. Goals

Redefine `useEntityAnimation` as an Entity adapter:

```text
useEntityAnimation = useAnimation config + Entity props outlet
```

Target API:

```text
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timingFunction: 'easeInOut',
  timeline: {
    '0%': {
      position: { x: 0, y: 0, z: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '50%': {
      position: { y: 0.25 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
    '100%': {
      position: { y: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
  onStart: values => {
    console.log('Entity animation started', values)
  },
  onComplete: values => {
    console.log('Entity animation completed', values)
  },
  onStop: values => {
    console.log('Entity animation stopped', values)
  },
  onReset: values => {
    console.log('Entity animation reset', values)
  },
  onError: error => {
    console.error('Entity animation failed', error)
  },
})

return (
  <Reality>
    <SceneGraph>
      <BoxEntity {...entityProps} xr-animation={animation} />
    </SceneGraph>
  </Reality>
)
```

During animation playback, the transform components present in the config are determined by sampled animation values and users cannot take control; components not present in the config are still driven normally by React props.

After animation ends, the committed Entity transform is mirrored through `entityProps`. Users who need to take over dynamically after an animation should call `api.set`; ordinary Entity props remain the static/base inputs that `entityProps` intentionally overrides in the recommended composition order.

Ownership granularity is the transform component (`position` / `rotation` / `scale`). A component is owned entirely by the animation during an active animation as soon as any of its fields appear in the config; a component that does not appear in the config at all remains driven normally by React props during the active animation. Therefore "animate only position while rotation stays controlled by React props" is a supported composition.

Core goals:

1. Align Entity animation semantics with `useAnimation` while keeping config hierarchy aligned with Entity props.
2. Recommend `xr-animation` binding while continuing to support `animation`.
3. Use the third tuple value `entityProps` as the Entity props outlet.
4. Define `entityProps` as `{ position, rotation, scale }`.
5. Write terminal animation state back to React through `entityProps`.

### 3. Non-Goals

This proposal does not support:

1. Entity opacity animation.
2. Entity material / color animation.
3. Entity component property animation.
4. Sharing one animation object across multiple Entities.
5. A public seek / scrub / progress API.
6. Writing native animation values back to React state every frame.
7. Replaying user-authored `position / rotation / scale` writes during animation.
8. Introducing a CSS-like `style` prop for Entity.

### 4. API Design

#### 4.1 Hook Signature

```text
function useEntityAnimation(
  config: EntityMotionAuthorConfig
): [
  animation: EntityMotionBinding,
  api: EntityPlaybackApi,
  entityProps: EntityMotionProps,
]
```

`EntityMotionAuthorConfig`, `EntityMotionBinding`, and `EntityPlaybackApi` are the Entity-constrained variants of the shared `useAnimation` config / binding / playback-api types: same shape and playback semantics, but the authoring surface is restricted to Entity transform fields (`position` / `rotation` / `scale`) and does not accept `transform.translate / rotate / scale` or non-transform targets such as `opacity`.

```text
type EntityMotionProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

#### 4.2 Config Unification

Entity public config stays aligned with Entity props:

```text
useEntityAnimation({
  to: {
    position: { x: 0.1, y: 0, z: 0 },
    rotation: { y: 90 },
    scale: { x: 1, y: 1, z: 1 },
  },
})
```

Entity proposal does not use `transform.translate / transform.rotate / transform.scale` as its public authoring shape.

### 5. Supported Config

#### 5.1 from / to

```text
const [animation, api, entityProps] = useEntityAnimation({
  from: {
    position: { x: 0, y: 0, z: 0.8 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
  to: {
    position: { y: 0.25 },
    scale: { x: 1.1, y: 1.1, z: 1.1 },
  },
  duration: 0.8,
  autoStart: true,
})
```

#### 5.2 timeline

```text
const [animation, api, entityProps] = useEntityAnimation({
  duration: 1.2,
  timeline: {
    '0%': {
      position: { x: 0, y: 0, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '100%': {
      position: { x: 0, y: 0.25, z: 0.8 },
      rotation: { x: 0, y: 180, z: 0 },
      scale: { x: 1.1, y: 1.1, z: 1.1 },
    },
  },
})
```

#### 5.3 tracks

`tracks` remains an internal non-public execution shape. Applications author Entity motion with `from` / `to` or percentage `timeline`; the SDK may normalize those public shapes into internal tracks before sending work to the native Entity adapter.

Entity targets only allow:

```text
'position.x'
'position.y'
'position.z'
'rotation.x'
'rotation.y'
'rotation.z'
'scale.x'
'scale.y'
'scale.z'
```

Not allowed:

```text
'opacity'
```

If `opacity` appears in config, the SDK must throw or trigger `onError`. Silent ignore is not allowed.

### 6. entityProps Outlet

The third return value of `useEntityAnimation` is the Entity props outlet:

```text
type EntityMotionProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

It is used to write animation values back into Entity props:

```text
animation values
  -> entityProps
  -> <BoxEntity {...entityProps} />
  -> native Entity transform
```

Example:

```text
const [animation, api, entityProps] = useEntityAnimation({
  to: {
    position: { x: 0.1, y: 0, z: 0 },
    rotation: { y: 90 },
    scale: { x: 1, y: 1, z: 1 },
  },
})

return (
  <BoxEntity
    {...entityProps}
    xr-animation={animation}
  />
)
```

Compatible usage still supports:

```text
<BoxEntity {...entityProps} animation={animation} />
```

After animation completes:

```text
native Entity stays at terminal state
entityProps.position updates to terminal position
entityProps.rotation updates to terminal rotation
entityProps.scale updates to terminal scale
```

`entityProps` does not update every frame. It only updates at key lifecycle points:

1. `play` start.
2. `complete`.
3. `stop`.
4. `reset`.
5. `finish`.
6. Native-accepted `api.set(values)` writes.

> **Pose-mirror semantics:** Before the first native-confirmed state, `entityProps` may be empty; once native returns a confirmed state, `entityProps` mirrors the transform components owned by the animation system (the animated components plus components written via `api.set`). Components that are not owned do not enter `entityProps`, so spreading it does not override components the user is still controlling live through React props.

### 7. api.set

`api.set` is the imperative write entry for the committed Entity transform state that `entityProps` mirrors. Its purpose is to let users take over the transform after an animation ends. The committed state is authoritative in native, and `entityProps` is its confirmed mirror (which the SDK must expose in order to write terminal values back). `api.set` only writes; reading the current confirmed state is done through `entityProps`. The SDK does not keep a separate local committed cache.

#### 7.1 Two sources and the compositor

Entity transform is composed from two sources:

- Source A: static/base React props plus `entityProps` (the committed state mirrored by the SDK; dynamic take-over is written through `api.set`).
- Source B: the `xr-animation` binding (per-frame sampled animation values).

Arbitration is per transform component (`position` / `rotation` / `scale`) and independent:

```text
component present in config AND animation active (delay / running / paused)  -> Source B wins
otherwise (component not in config, or animation inactive idle / terminal)    -> Source A wins
```

This is the same model as CSS: an animation overrides computed style per property while playing, and style takes over for un-animated properties as well as once the animation is inactive. `api.set` always writes Source A; when it becomes visible is decided by the compositor, not by `api.set` itself.

#### 7.2 Signature

```text
api.set(values: EntityMotionPatch): void
```

`api.set` only accepts an `EntityMotionPatch` object. `EntityMotionPatch` is the write-side sparse patch type; it has the same `{ position?, rotation?, scale? }` shape as `EntityMotionProps`, but the two names are kept distinct on purpose: `EntityMotionPatch` is the input to `api.set`, while `EntityMotionProps` is the read-side confirmed mirror exposed through `entityProps` and callback values. The `(prev) => next` updater form is not supported.

#### 7.3 Behavior

1. Write target: `api.set` sends `ControlSpatializedElementAnimation(type: 'set')` to native; native is the single authority that decides whether the write takes effect. When native accepts, it emits confirmed values and `entityProps` updates as the reactive mirror of that confirmed state; when native rejects, `entityProps` does not update. The SDK does not keep a local committed cache.
2. Sparse merge: `api.set(values)` may pass only part of the transform. JS/Core does not merge a full value from `entityProps`; it sends the patch to native. Native merges the patch over the current committed `entity.transform`, overwriting only fields present in the patch. `api.set({ position: { y: 0.3 } })` does not touch `rotation` or `scale`.
3. No updater form: `api.set(prev => next)` is not supported. Application code that needs to compute a patch from the current confirmed value should read `entityProps`, compute the patch itself, and then call `api.set(values)`.
4. Calling during an active animation is not stashed. It does not interrupt or override the active animation, and it is not queued for replay. Native should reject or ignore the write and expose that through the existing command failure / error event mechanism. `entityProps` does not update. To take over the transform, call `api.set` after the animation is inactive (idle / terminal).
5. Calling before binding or native object creation is invalid. It does not create a pending write and is not replayed after binding completes. Failure is exposed through the existing command failure / error event mechanism.
6. Not a playback command: `api.set` does not seek, start, or change playback progress.

#### 7.4 Interaction with `play` and terminal fill

- Start point after `api.set` then `play`: if the config declares `from`, playback starts from `from`; if `from` is not declared, playback starts from the current committed value (the pose written by `api.set`).
- Terminal fill: when an animation reaches a terminal state, it fills to its terminal transform and writes that value back to `entityProps` (equivalent to CSS `fill-mode: forwards`); it does NOT snap back to the pre-animation value.

#### 7.5 Reading the current value (no bare api.get)

`api.get` is intentionally not provided, because an imperative getter in React tends to read stale values and invites read-then-write races.

- Read the current confirmed value through `entityProps`, which is the reactive mirror of the committed state.
- For read-modify-write, application code computes a new patch from `entityProps` and then calls `api.set(values)`.
- `entityProps` MAY be empty before the first native-confirmed state and is not promised readable at mount: `create` / `bind` does NOT emit an extra initial confirmed value. To read the native pose, application code must first trigger a lifecycle that commits a confirmed value (a `play` terminal, or an accepted `api.set`).

### 8. Conflict Semantics with React Props

#### 8.1 During alive animation

When animation is in:

```text
delay / running / paused
```

the animation owns the transform components that appear in the config; components that do not appear in the config are not owned by the animation.

If the user writes an **owned component** through React props (e.g. the config animates `position`):

```text
<BoxEntity position={position} />
```

it will not override the active animation. Writing an **un-owned component** (e.g. the config only animates `position` and the user writes `rotation`) takes effect normally.

#### 8.2 Props updates during animation

During animation, user writes to an **owned component** (a component that appears in the config):

1. do not interrupt animation.
2. do not immediately override animation.
3. do not become pending replay.
4. ultimately yield to terminal animation values.

During animation, user writes to an **un-owned component** (a component that does not appear in the config) take effect normally, driven live by React props, unaffected by the animation.

#### 8.3 After animation ends

When animation enters a terminal state:

```text
complete / stop / reset / finish
```

the native Entity has already stopped at that transform, and `entityProps` updates to that same transform.

Recommended usage:

```text
<BoxEntity
  position={basePosition}
  {...entityProps}
  xr-animation={animation}
/>
```

`entityProps` should appear after static props to avoid stale props pulling terminal state back to old values.

### 9. Playback API

Align with `useAnimation`:

```text
api.play()
api.pause()
api.resume()
api.stop()
api.reset()
api.finish()
```

`api.set` is a state setter (see section 7), not a playback command, and is intentionally not listed among the playback methods above.

### 10. Callback

Support the callbacks already defined by `useAnimation`.

Callbacks are notifications only. `onComplete`, `onStop`, `onReset`, `onStart`, and `onError` report that a lifecycle event happened and pass the relevant transform values; their return values are ignored and MUST NOT be used to drive the terminal transform. To decide where the Entity ends up, either declare the terminal state in the config (for example `to`) before playback, or take over after playback through the terminal `entityProps` value or an explicit `api.set` call.

Callback values only include transform fields supported by Entity:

```text
type EntityMotionCallbackValues = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

### 11. Capability Requirement

Use capability detection to indicate runtime support for `useAnimation`:

```text
supports('useAnimation')
```

Semantics:

```text
The current runtime supports Reality Entity components binding useAnimation motion through xr-animation or animation.
```

This capability is detected through the top-level `useAnimation` key and does not require a separate sub-token.

Documentation must state clearly:

```text
Entity target currently supports transform only and does not support opacity.
```

### 12. One-Line Summary

Add percentage `timeline`, `entityProps` outlet, and recommended `xr-animation` binding on top of the existing `useEntityAnimation`, while keeping Entity authoring in `position / rotation / scale` form and limiting v1 to transform only.

## Capabilities

### New Capabilities
- `entity-motion`: Add timeline, Entity props outlet, binding guidance, and behavior requirements on top of the existing `useEntityAnimation`.

### Modified Capabilities
- `runtime-capabilities`: Update documented motion capability requirements to reflect the new Entity motion proposal and its supported detection contract.

## Impact

- Affected OpenSpec artifacts include the completed `add-entity-transform-animation` change and the in-progress `spatialized-element-motion-api` change where Entity motion is currently deferred or referenced.
- Affected public React SDK surfaces include `useEntityAnimation`, Entity transform props, Entity binding props, and runtime capability guidance.
- Affected implementation areas include React Entity hooks, Core motion and animation types, Entity binding logic, validation, test-server demos, and migration documentation.
- This proposal is currently tracked as a non-breaking enhancement focused on adding `timeline`, `entityProps` outlet, recommended `xr-animation` binding, and unified semantics.
