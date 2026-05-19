# SpatialDiv Animation

The `useAnimation` hook provides native-driven animation for spatialized HTML elements (`SpatialDiv`). Animations run via `CADisplayLink` at 90Hz on visionOS, bypassing CSS transitions to deliver smooth frame-driven interpolation with property-level suppression that prevents DOM sync from interfering with animation mid-states.

## Quick Start

```tsx
import { useAnimation } from '@webspatial/react-sdk'

function FadeInCard() {
  const [animation, api] = useAnimation({
    from: { opacity: 0, transform: { translate: { z: -50 } } },
    to: { opacity: 1, transform: { translate: { z: 0 } } },
    duration: 0.6,
    timingFunction: 'easeOut',
    onComplete: (values) => console.log('Entrance complete', values),
  })

  return (
    <div enable-xr animation={animation}>
      <h1>Hello Spatial World</h1>
    </div>
  )
}
```

## Visual Whitelist

Only visual fields that do **not** change the DOM layout box, native spatial panel size, depth, or spatial-position semantics are animatable:

| Field | Type | Units | Notes |
|-------|------|-------|-------|
| `transform.translate.x/y/z` | `number` | CSS pixels | — |
| `transform.rotate.x/y/z` | `number` | degrees | Aligns with CSS `rotateX/Y/Z()` |
| `transform.scale.x/y/z` | `number` | unitless | Aligns with CSS `scaleX/Y/Z()` |
| `opacity` | `number` | — | Inclusive `[0, 1]` |

**Rejected fields** (will throw at validation): `width`, `height`, `back`, `backOffset`, `depth`, `backgroundMaterial`, `cornerRadius`, or any unknown field.

Transform is composed in fixed order: **translate → rotate → scale**.

## API Reference

### `useAnimation(config: SpatialDivAnimationConfig)`

Returns `[SpatialDivAnimatedProps, SpatialDivAnimationApi]`.

The hook auto-detects SpatialDiv mode based on the `to` key set. If `to` contains `transform` or `opacity`, the SpatialDiv path is selected. Entity keys (`position`, `rotation`, `scale`) select the entity path. Mixing both throws.

### SpatialDivAnimationConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `to` | `SpatialDivAnimatedValues` | — | **Required.** Target animation values (whitelist fields only). |
| `from` | `SpatialDivAnimatedValues` | current native state | Start values. If omitted, snapshots current state at play time. |
| `duration` | `number` | `0.3` | Duration in seconds. Must be `> 0` and finite. |
| `timingFunction` | `TimingFunction` | `'easeInOut'` | `'linear'` \| `'easeIn'` \| `'easeOut'` \| `'easeInOut'` |
| `delay` | `number` | `0` | Delay in seconds before visible motion begins. Must be `>= 0`. |
| `loop` | `boolean \| { reverse?: boolean }` | `false` | `true` = reset loop; `{ reverse: true }` = ping-pong. |
| `playbackRate` | `number` | `1` | Speed multiplier. Must be `> 0` and finite. |
| `autoStart` | `boolean` | `true` | Start automatically when element is bound. |
| `onStart` | `() => void` | — | Called once when the native session is established. |
| `onComplete` | `(values: SpatialDivAnimatedValues) => void` | — | Called on natural completion with final values. |
| `onCancel` | `(values: SpatialDivAnimatedValues) => void` | — | Called when `cancel()` is invoked; receives restored values. |
| `onError` | `(error: AnimationError) => void` | — | Called on async native/bridge failures. |

### SpatialDivAnimationApi

| Property/Method | Type | Description |
|----------------|------|-------------|
| `play()` | `void` | Start new session (from idle/finished), resume (from paused), or no-op (if running/queued). |
| `pause()` | `void` | Pause the running animation. Can be called while queued (pauses on bind). |
| `cancel()` | `void` | Cancel the session; native restores to `from` values. |
| `isAnimating` | `boolean` | `true` while queued or running; `false` otherwise. |
| `isPaused` | `boolean` | `true` when the session is paused. |
| `playState` | `string` | `'idle'` \| `'queued'` \| `'running'` \| `'paused'` \| `'finished'` |
| `finished` | `boolean` | `true` after natural completion; resets on next `play()` or `cancel()`. |

## Playback Semantics

### State Machine

```
idle → [play] → queued (if element not bound) → running → finished
                                               ↕ pause/play
                                              paused
                       running/queued → [cancel] → idle
```

### Play Re-entry

| Current state | `play()` behavior |
|--------------|-------------------|
| `idle` / `finished` | Start new session |
| `paused` | Resume existing session (same `animationId`) |
| `running` / `queued` | **No-op** (must `cancel()` first to restart) |

### Lifecycle Callbacks

- `onStart` fires once when the native session is established (not when queued).
- `onComplete` and `onCancel` are **mutually exclusive** — exactly one fires per session.
- `onError` fires independently on async bridge/native failures.
- After unmount, **no callbacks fire** and Promises do not resolve.

## Examples

### Manual Rotation

```tsx
function RotateBox() {
  const [animation, api] = useAnimation({
    from: { transform: { rotate: { y: 0 } } },
    to: { transform: { rotate: { y: 180 } } },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
  })

  return (
    <div enable-xr animation={animation}>
      <button onClick={() => api.play()}>Rotate</button>
      <button onClick={() => api.pause()}>Pause</button>
      <button onClick={() => api.cancel()}>Cancel</button>
    </div>
  )
}
```

### Looping Float

```tsx
function FloatingCard() {
  const [animation] = useAnimation({
    from: { transform: { translate: { y: 0 } } },
    to: { transform: { translate: { y: -20 } } },
    duration: 1.5,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
  })

  return (
    <div enable-xr animation={animation}>
      <p>I float forever</p>
    </div>
  )
}
```

### Entrance Fade + Scale

```tsx
function EntranceCard() {
  const [animation] = useAnimation({
    from: { opacity: 0, transform: { scale: { x: 0.8, y: 0.8, z: 0.8 } } },
    to: { opacity: 1, transform: { scale: { x: 1, y: 1, z: 1 } } },
    duration: 0.5,
    timingFunction: 'easeOut',
    onComplete: () => console.log('Card visible'),
  })

  return (
    <div enable-xr animation={animation}>
      <h2>Welcome</h2>
    </div>
  )
}
```

## Capability Detection

```tsx
import { supports } from '@webspatial/core-sdk'

if (supports('useAnimation', ['element'])) {
  // SpatialDiv animation is available
}
```

In unsupported runtimes:
- `play()` is a no-op
- A warning is emitted (once per hook instance)
- No callbacks fire, `isAnimating` remains `false`

## Known Limitations

1. **No layout-affecting animations** — `width`, `height`, `depth`, `backOffset` cannot be animated.
2. **No arbitrary CSS transforms** — only structured SRT (translate/rotate/scale). No `skew`, `perspective`, or matrix interpolation.
3. **Single binding** — one `animation` object can bind to only one element at a time. Reusing across elements throws.
4. **Play re-entry is no-op** — calling `play()` while already running does nothing. Call `cancel()` first to restart.
5. **Config updates don't affect alive sessions** — a running/paused session uses the config from its `play()` call. The next `play()` will use the latest config.
6. **No negative playbackRate** — must be `> 0`.
