## Why

Declarative timeline motion for three spatialized containers:

- **Spatialized2DElement** (`enable-xr` div)
- **SpatializedStatic3DElement** (`<Model>`)
- **SpatializedDynamic3DElement** (`<Reality>` container)

Motion is modeled as a **first-class native object** (`AnimationObject : SpatialObject`): created via `SpatializedElement.createAnimation(config)` with a **native-generated uuid**; timeline is locked at creation; playback state is native-owned and broadcast via WebMsg.

## At a Glance

```tsx
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// bind → createAnimation(config) → native AnimationObject
<div enable-xr xr-animation={animation} />
<Model src="robot.usdz" xr-animation={animation} />
<Reality xr-animation={animation}><Entity /></Reality>

api.play()   // ControlSpatializedElementAnimation
api.pause()
api.stop()
```

**Platform constraint:** `useAnimation` works **only** when the native spatial runtime is available. Pure web builds are unsupported; authors use CSS animation, framer-motion, or similar.

## Core Object Model

| Layer | Object | Responsibility |
|-------|--------|----------------|
| Native | `AnimationObject : SpatialObject` | Locked timeline, frame sampling, element writes, state broadcast |
| Core | `AnimationObject extends SpatialObject` | uuid handle, `play/pause/...`, `destroy()` |
| Core | `SpatializedElement.createAnimation(config)` | Normalize config → Create JSB → return handle |
| React | `useAnimation` + `AnimationProxy` | Queue API before bind; create + flush on bind |

## What Changes

- **Timeline locked at create:** `createAnimation(config)` compiles canonical tracks and sends them to native; control commands carry no timeline. To change motion, `destroy()` then `createAnimation` again.
- **Split JSB:** `CreateSpatializedElementAnimation` (create) + `ControlSpatializedElementAnimation` (control); remove unified `AnimateSpatializedElementMotion`.
- **State broadcast:** native → JS `SpatialAnimationStateChanged` (`animationId` + `action` + optional `values`).
- **Element-level suppression:** while playing, native `SpatializedElement` sets an animating mask and ignores conflicting transform/property JSB; **no** `PortalInstanceObject` coupling.
- **Remove Web RAF:** Core has no `WebPlaybackBackend`; without native, `useAnimation` fails fast.
- **Destroy:** `animationObject.destroy()` uses generic `DestroyCommand`.
- **React create timing:** `createAnimation` after `xr-animation` bind and element resolve; pre-bind `api.play()` queued on `AnimationProxy`.

## Capabilities

### New

- `spatialized-element-motion` — umbrella requirements and object model
- `spatialized-2d-motion` — 2D container
- `spatialized-static3d-motion` — Model root `modelTransform`
- `spatialized-dynamic3d-motion` — Reality container transform + opacity

### Modified

- `runtime-capabilities` — `supports('useAnimation', ['element'|'static3d'|'dynamic3d'])` is true only on native runtime

## Non-Goals

- `SpatialEntity` child animation (out of scope)
- Layout field animation (`width`, `height`, `back`, `depth`)
- Merging Model USD clip playback (`ref.play()`) with timeline motion
- Static3D material/variant animation
- `useAnimation` / Core RAF on pure web
- Hot `updateConfig` on a locked timeline (destroy + recreate required)

## Impact

- **Packages:** `@webspatial/react-sdk`, `@webspatial/core-sdk`, visionOS native
- **Breaking:** replaces `SpatializedMotionController` + `AnimateSpatializedElementMotion`; removes Web RAF fallback
