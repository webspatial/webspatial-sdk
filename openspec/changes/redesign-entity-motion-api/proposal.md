## Why

Entity animation already has basic `useEntityAnimation` support, but it still lacks parts of the newer motion story, such as percentage `timeline`, the recommended `xr-animation` binding, and an `entityProps` outlet for React-side terminal-state persistence.

This change does not replace the existing `useEntityAnimation`. It is a non-breaking enhancement on top of the current API. The goal is to add timeline, outlet, binding, and behavior semantics while keeping Entity authoring aligned with Entity props hierarchy.

## What Changes

- Add an enhancement proposal on top of the existing `useEntityAnimation`.
- Define `useEntityAnimation` as an Entity adapter: `useAnimation config + Entity props outlet`.
- Keep public config aligned with Entity props hierarchy by continuing to use `position`, `rotation`, and `scale`.
- Recommend `xr-animation` binding while keeping `animation` as a compatible binding.
- Introduce `entityProps` as the React outlet for committed Entity transform values.
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
  config: SpatializedMotionAuthorConfig
): [
  animation: SpatializedMotionBinding,
  api: SpatializedPlaybackApi,
  entityProps: EntityMotionProps,
]
```

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
    rotation: { x: 0, y: 0, z: 0.8 },
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
      rotation: { x: 0, y: 0, z: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
    },
    '100%': {
      position: { x: 0, y: 0, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0.8 },
      scale: { x: 1, y: 1, z: 1 },
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

### 7. api.set

`api.set(values)` remains an open question.

Open questions:

1. Should it be exposed as a formal public API.
2. If exposed, should it be considered part of the playback API.
3. If exposed, should it update `entityProps` at the same time.

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

### 10. Callback

Support the callbacks already defined by `useAnimation`.

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