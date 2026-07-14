## Why

SpatialDiv, Model, and Reality containers need one declarative animation API with shared timeline and playback concepts across all host types.

This change provides `useAnimation(config)` for container-root transform and opacity animation. It supports simple start-to-end transitions and multi-step percentage keyframes, with shared playback controls and lifecycle callbacks.

`useAnimation` and `useEntityAnimation` are experimental APIs. Import them from `@webspatial/react-sdk/experimental`.

## When to use this API

Use `useAnimation` when the visual container itself should move, rotate, scale, or fade:

| Need | Use |
|---|---|
| Move or fade a SpatialDiv panel | `useAnimation` + `xr-animation` on the `enable-xr` element |
| Move, rotate, scale, or fade a Model container | `useAnimation` + `xr-animation` on `<Model>` |
| Move, rotate, scale, or fade a Reality container and all of its children together | `useAnimation` + `xr-animation` on `<Reality>` |
| Play animation embedded in a USD model | Model ref `play()` / `pause()` |
| Animate an individual Entity inside Reality | `useEntityAnimation` |
| Run one simple start-to-end transition | Top-level `from` and `to` |
| Run three or more stages, or change properties at different times | `timeline` mixing boundaries and percentage keyframes |

## Quick start: top-level from/to

Use the `from`/`to` form for entrance, exit, move, scale, rotate, and fade transitions with one start and one end state.

```tsx
import { useAnimation } from '@webspatial/react-sdk/experimental'

export function EnteringPanel() {
  const [animation, api, style] = useAnimation({
    from: {
      transform: { translate: { y: 24 } },
      opacity: 0,
    },
    to: {
      transform: { translate: { y: 0 } },
      opacity: 1,
    },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <div enable-xr style={{ width: 320, height: 180, ...style }} xr-animation={animation}>
      <button onClick={() => api.reset()}>Reset</button>
      <button onClick={() => api.play()}>Play</button>
    </div>
  )
}
```

Top-level `from` and `to` are both required. Every animated property has an explicit value at both boundaries. From/to-only configurations use a default `duration` of 0.3 seconds.

## Multi-step animation: mixed timeline

Use `timeline` when the animation has intermediate stages or when different properties change at different points. `from` and `to` may be mixed with percentage keyframes.

```tsx
export function PulsingPanel() {
  const [animation, api, style] = useAnimation({
    duration: 2,
    autoStart: false,
    timeline: {
      from: {
        transform: { translate: { y: 20 }, scale: { x: 0.9, y: 0.9 } },
        opacity: 0,
      },
      '40%': {
        transform: { translate: { y: 0 }, scale: { x: 1.05, y: 1.05 } },
        opacity: 1,
        timingFunction: 'easeOut',
      },
      to: {
        transform: { translate: { y: 0 }, scale: { x: 1, y: 1 } },
        opacity: 1,
      },
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Play</button>
      <div enable-xr style={{ width: 320, height: 180, ...style }} xr-animation={animation} />
    </>
  )
}
```

Timeline authoring follows these rules:

- `from` is equivalent to `0%`; `to` is equivalent to `100%`.
- `duration` is required when any percentage key is used and is measured in seconds.
- Keys range from `0%` to `100%`; decimal values such as `30.33%` are supported.
- Each animated property needs at least two values. It may appear only in the frames relevant to it: values are interpolated between those frames, with the first value held before its first frame and the last value held after its last frame.
- A frame-level `timingFunction` controls interpolation from that frame to the next. Otherwise the config-level timing function is used, then `linear`.

For example, this rotates from -20° to 80° during the first half, then holds 80° through the end, while opacity continues across the full timeline:

```tsx
timeline: {
  '0%': { opacity: 0, transform: { rotate: { z: -20 } } },
  '50%': { transform: { rotate: { z: 80 } } },
  '100%': { opacity: 1 },
}
```

Timeline authoring places the animation boundaries inside `timeline`, while the outer config carries duration and playback controls. Top-level `from` and `to` remain the simple authoring form.

## Supported hosts

Create a separate `useAnimation` instance for each host.

### SpatialDiv

```tsx
const [animation, api, style] = useAnimation(panelMotion)

return (
  <div enable-xr style={{ width: 300, height: 180, ...style }} xr-animation={animation}>
    Spatial panel
  </div>
)
```

### Model container

```tsx
const [animation, api, style] = useAnimation(modelMotion)

return (
  <Model
    src="robot.usdz"
    style={{ ...style }}
    xr-animation={animation}
  />
)
```

This animates the Model container's transform and opacity.

### Reality container

```tsx
const [animation, api, style] = useAnimation(realityMotion)

return (
  <Reality style={{ ...style }} xr-animation={animation}>
    <Entity id="robot" />
    <Entity id="label" />
  </Reality>
)
```

This animates the Reality container, so its child entities move with it while retaining their local transforms. To animate one child Entity independently, use `useEntityAnimation`.

## Config reference

| Field | Meaning |
|---|---|
| `from` / `to` | Required boundaries for the simple top-level segment form |
| `timeline` | Optional advanced form mixing `from`, `to`, and percentage keyframes; its content determines the animation |
| `duration` | Seconds. Defaults to 0.3 for from/to-only authoring; required when timeline contains a percentage key |
| `timingFunction` | Default interpolation: `linear`, `easeIn`, `easeOut`, or `easeInOut` |
| `delay` | Delay before playback, in seconds |
| `autoStart` | Starts after binding by default; set to `false` for manual playback |
| `loop` | Repeats playback; reverse looping may be requested through the loop options |
| `playbackRate` | Playback speed multiplier |
| `onStart` | Called when playback starts |
| `onComplete` | Called after natural completion or confirmed `finish()` |
| `onStop` | Called after `stop()` with the current visual values |
| `onReset` | Called after `reset()` with the starting visual values |
| `onError` | Receives asynchronous playback errors |

## Supported visual values

`from`, `to`, and percentage frames accept `opacity` and structured transform values:

```tsx
from: {
  opacity: 0,
  transform: {
    translate: { x: 0, y: 20, z: 0 },
    rotate: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
},
to: {
  opacity: 1,
  transform: {
    translate: { x: 100, y: 0, z: 0 },
    rotate: { x: 0, y: 90, z: 0 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
  },
},
```

## Playback controls

| API | Behavior |
|---|---|
| `play()` | Starts a new session, resumes a paused session, and keeps a running session active |
| `pause()` | Pauses the whole session at the current value |
| `stop()` | Stops an active session and keeps the current value; state returns to `idle` |
| `reset()` | Seeks to the session's starting values and returns to `idle` |
| `finish()` | Seeks to terminal values and enters `finished` after confirmation |

The API also exposes `isAnimating`, `isPaused`, `finished`, and `playState`. `playState` is one of `idle`, `queued`, `running`, `paused`, or `finished`.

Commands may be issued before the host binds. Explicit `play()` and `finish()` are queued and applied after binding. `autoStart: false` selects manual playback, and explicit queued commands continue after binding.

## Keeping terminal values visible

Always merge the returned `style` into the same host that receives `xr-animation`:

```tsx
<Model style={{ ...authoredStyle, ...style }} xr-animation={animation} />
```

This preserves emitted visual values through later React renders and host resynchronization.

## Availability and fallback

Check availability before relying on container motion:

```tsx
import { supports } from '@webspatial/core-sdk'

const presentation = supports('useAnimation')
  ? <AnimatedPresentation />
  : <StaticPresentation />
```

Use `supports('useAnimation')` to choose between the animated and static presentations.

## Capabilities

### Added

- `spatialized-element-motion` — shared container-motion behavior and the SpatialDiv / Model / Reality target matrix.

### Modified

- `runtime-capabilities` — `supports('useAnimation')` reports container-motion availability.

## Impact

- **Packages:** `@webspatial/react-sdk`, `@webspatial/core-sdk`, and the spatial runtime.
- **Experimental API:** `useAnimation`, `useEntityAnimation`, `SpatializedMotionConfig`, and `SpatializedPlaybackApi` are exported from `@webspatial/react-sdk/experimental`; `xr-animation` and `supports('useAnimation')` retain their existing entry points.
- **Migration:** existing top-level `from` / `to` authoring remains supported; multi-stage demos and documentation use public timeline authoring.
