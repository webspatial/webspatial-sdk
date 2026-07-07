## Why

Entity animation already has basic `useEntityAnimation` support, but it still lacks parts of the newer motion story, such as percentage `timeline`, the recommended `xr-animation` binding, and an `entityProps` outlet for React-side terminal-state persistence.

This change does not replace the existing `useEntityAnimation`. It is a non-breaking enhancement on top of the current API. The goal is to add timeline, outlet, binding, and behavior semantics while keeping Entity authoring aligned with Entity props hierarchy.

## What Changes

- Add an enhancement proposal on top of the existing `useEntityAnimation`.
- Define `useEntityAnimation` as an Entity adapter: `useAnimation config + Entity props outlet`.
- Keep public config aligned with Entity props hierarchy by continuing to use `position`, `rotation`, and `scale`.
- Recommend `xr-animation` binding while keeping `animation` as a compatible binding.
- Introduce `entityProps` as the React outlet for committed Entity transform values.
- Add `api.set` (with an updater form) as the imperative write entry for the committed transform state that `entityProps` mirrors, so users can take over after an animation without maintaining their own `useState`.
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
  onStart: () => {
    console.log('Entity animation started')
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

During animation playback, the Entity transform is determined by sampled animation values, and user writes do not take control.

After animation ends, the Entity transform is still determined by the props supplied to the Entity. Users can change state by updating props.

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

`tracks` remains an internal non-public API:

```text
const [animation, api, entityProps] = useEntityAnimation({
  duration: 2,
  tracks: [
    {
      property: 'position.y',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1, value: 0.25 },
        { at: 2, value: 0 },
      ],
    },
    {
      property: 'rotation.y',
      keyframes: [
        { at: 0, value: 0 },
        { at: 2, value: 180 },
      ],
    },
  ],
})
```

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
6. `api.set` (and its updater form).

### 7. api.set

`api.set` is the imperative write entry for the committed Entity transform state that `entityProps` mirrors. Its purpose is to let users take over the transform after an animation ends without maintaining their own `useState`: the SDK already holds the committed state (it must, in order to write terminal values back through `entityProps`), so users should not have to mirror that state a second time.

#### 7.1 Two sources and the compositor

Entity transform is composed from two sources:

- Source A: React props / `entityProps` (the committed state, written declaratively or through `api.set`).
- Source B: the `xr-animation` binding (per-frame sampled animation values).

At any moment only one source is authoritative, decided by whether the animation is active:

```text
animation active (delay / running / paused)   -> Source B wins
animation inactive (idle / terminal)          -> Source A wins
```

This is the same model as CSS: an animation overrides computed style while playing, and style takes over again once the animation is inactive. `api.set` always writes Source A; when it becomes visible is decided by the compositor, not by `api.set` itself.

#### 7.2 Signature

```text
api.set(values: EntityMotionProps): void
api.set(updater: (prev: EntityMotionProps) => EntityMotionProps): void
```

#### 7.3 Behavior

1. Write target: `api.set` updates the SDK-held committed transform state, which updates `entityProps`, which writes back to the native Entity through `<BoxEntity {...entityProps} />`. `entityProps` is the reactive mirror of that state.
2. Sparse merge: only the provided fields are overwritten; omitted fields keep their previous committed values. `api.set({ position: { y: 0.3 } })` does not touch `rotation` or `scale`.
3. Updater form: `prev` is the current committed value (Source A). Read-modify-write is atomic inside the SDK, which is how offsets based on the current value are expressed. There is no bare `api.get`.
4. Calling during an active animation does not throw, but the write does not survive the animation. It does not interrupt or override the active animation, and — consistent with the React-prop write behavior in section 8.2 — it is NOT queued for replay: when the animation reaches its terminal state, the terminal fill (see 7.4) writes the terminal values into the committed state and overrides whatever was written during the animation. To take over the transform, call `api.set` after the animation is inactive (idle / terminal).
5. Not a playback command: `api.set` does not seek, start, or change playback progress.

#### 7.4 Interaction with `play` and terminal fill

- Start point after `api.set` then `play`: if the config declares `from`, playback starts from `from`; if `from` is not declared, playback starts from the current committed value (the pose written by `api.set`).
- Terminal fill: when an animation reaches a terminal state, it fills to its terminal transform and writes that value back to `entityProps` (equivalent to CSS `fill-mode: forwards`); it does NOT snap back to the pre-animation value.

#### 7.5 Reading the current value (no bare api.get)

`api.get` is intentionally not provided, because an imperative getter in React tends to read stale values and invites read-then-write races.

- Read-modify-write: use the updater form `api.set(prev => ...)`.
- Declarative read of the current value: read `entityProps`, which is the reactive mirror of the committed state.

### 8. Conflict Semantics with React Props

#### 8.1 During alive animation

When animation is in:

```text
delay / running / paused
```

the animation owns the full Entity transform.

If the user writes through React props:

```text
<BoxEntity position={position} />
```

it will not override the active animation.

#### 8.2 Props updates during animation

During animation, user writes to `position / rotation / scale`:

1. do not interrupt animation.
2. do not immediately override animation.
3. do not become pending replay.
4. ultimately yield to terminal animation values.

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

- Affected OpenSpec artifacts include the previous `add-entity-transform-animation` change and the in-progress `spatialized-element-motion-api` change where Entity motion is currently deferred or referenced.
- Affected public React SDK surfaces include `useEntityAnimation`, Entity transform props, Entity binding props, and runtime capability guidance.
- Affected implementation areas include React Entity hooks, Core motion and animation types, Entity binding logic, validation, test-server demos, and migration documentation.
- This proposal is currently tracked as a non-breaking enhancement focused on adding `timeline`, `entityProps` outlet, recommended `xr-animation` binding, and unified semantics.