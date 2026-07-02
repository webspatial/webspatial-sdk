# Spatialized Motion

This document describes the current container-motion API shipped by
`@webspatial/react-sdk`.

The historical filename is retained, but the current public surface is the
unified spatialized motion proposal:

- Use `useAnimation(config)` for container motion
- Bind with `xr-animation={animation}`
- Read the tuple as `[animation, api, style]`
- Use `play`, `pause`, `resume`, `stop`, `reset`, and `finish` for playback
- Keep entity transform animation on `useEntityAnimation(config)`

## Quick Start

```text
import { useAnimation } from '@webspatial/react-sdk'

function FadeInCard() {
  const [animation, api, style] = useAnimation({
    from: {
      opacity: 0,
      transform: { translate: { y: 24, z: -50 } },
    },
    to: {
      opacity: 1,
      transform: { translate: { y: 0, z: 0 } },
    },
    duration: 0.6,
    timingFunction: 'easeOut',
    onComplete: values => console.log('Entrance complete', values),
  })

  return (
    <div enable-xr style={{ ...style }} xr-animation={animation}>
      <button onClick={() => api.finish()}>Finish</button>
      <h1>Hello Spatial World</h1>
    </div>
  )
}
```

## Target Model

`useAnimation(config)` is target-agnostic. The SDK resolves the target when the
returned binding is attached through `xr-animation`.

| Binding target | Resolved kind | `style` behavior |
|----------------|---------------|------------------|
| `<div enable-xr>` | `spatialized2d` | Merge and snapshot outlet for current visual values |
| `<Model>` | `static3d` | Always `{}`; playback is native-driven |
| `<Reality>` | `dynamic3d` | Always `{}`; playback is native-driven |

Entity transform animation is not part of this container-motion path. Continue
to use `useEntityAnimation(config)` for `Entity` animation inside `Reality`.

## Recommended Config Shapes

The recommended v1 authoring paths are `from` and `to`, or a percentage-based
`timeline` object.

```text
const [animation, api, style] = useAnimation({
  from: { opacity: 0, transform: { translate: { y: 24 } } },
  to: { opacity: 1, transform: { translate: { y: 0 } } },
  duration: 0.6,
  timingFunction: 'easeOut',
})

const [timelineAnimation, timelineApi, timelineStyle] = useAnimation({
  duration: 2,
  timeline: {
    '0%': {
      opacity: 0,
      transform: { translate: { y: 24 } },
      timingFunction: 'easeOut',
    },
    '50%': { opacity: 1 },
    '100%': {
      opacity: 1,
      transform: { translate: { y: 0 } },
    },
  },
  timingFunction: 'easeInOut',
})
```

Current implementation and types still accept `tracks` as a compatibility or
advanced input, but `from` and `to` plus `timeline` remain the primary public
authoring path.

## Animatable Fields

Only visual fields that do not change layout or container geometry are
animatable.

| Field | Type | Notes |
|-------|------|-------|
| `transform.translate.x/y/z` | `number` | CSS pixel units on 2D targets |
| `transform.rotate.x/y/z` | `number` | Degrees |
| `transform.scale.x/y/z` | `number` | Unitless |
| `opacity` | `number` | Supported on `spatialized2d` on visionOS only, and on `static3d` and `dynamic3d` on both runtimes |

Validation rejects layout-affecting or unsupported fields such as `width`,
`height`, `back`, `backOffset`, `depth`, and unknown properties. `opacity`
playback is available on `spatialized2d` on visionOS only, and on `static3d`
and `dynamic3d` on both runtimes.

Transform composition order is fixed: `translate`, then `rotate`, then `scale`.

## API Reference

### `useAnimation(config)`

Returns `[animation, api, style]`.

- `animation` is the opaque binding passed to `xr-animation`
- `api` is the playback controller
- `style` is the style outlet for 2D merge and snapshot behavior

### Config Surface

| Property | Type | Description |
|----------|------|-------------|
| `from` | `SpatializedVisualValues` | Start values for segment motion |
| `to` | `SpatializedVisualValues` | End values for segment motion |
| `timeline` | percentage keyframe object | CSS `@keyframes` style authoring path |
| `duration` | `number` | Required total duration in seconds |
| `timingFunction` | `TimingFunction` | Config-level default easing |
| `delay` | `number` | Optional start delay in seconds |
| `loop` | `boolean \| { reverse?: boolean }` | Loop or ping-pong playback |
| `playbackRate` | `number` | Positive playback speed multiplier |
| `autoStart` | `boolean` | Defaults to auto-play on bind |
| `onStart` | `() => void` | Fires when playback begins |
| `onComplete` | `(values) => void` | Fires on natural completion or native-confirmed `finish()` |
| `onStop` | `(values) => void` | Fires when `stop()` terminates at current values |
| `onReset` | `(values) => void` | Fires when `reset()` restores start values |
| `onError` | `(error) => void` | Fires on asynchronous native failures |

### Playback API

| Method or field | Description |
|-----------------|-------------|
| `play()` | Starts a new session from `idle` or `finished` |
| `pause()` | Pauses the current session |
| `resume()` | Resumes a paused session |
| `stop()` | Freezes current values, then moves to `idle` |
| `reset()` | Seeks to `from` values, then moves to `idle` |
| `finish()` | Seeks to final values through the native `AnimationObject` path |
| `isAnimating` | `true` while queued or running |
| `isPaused` | `true` while paused |
| `playState` | `'idle' | 'queued' | 'running' | 'paused' | 'finished'` |
| `finished` | `true` only after native confirms the finished terminal state |

`pause()` and `resume()` are whole-session operations only. They do not accept
track-level or key-level arguments.

## Playback Semantics

### `play()` Re-entry

| Current state | `play()` behavior |
|--------------|-------------------|
| `idle` or `finished` | Starts a new session |
| `paused` | Resumes the current session |
| `running` or `queued` | No-op |

### Terminal Commands

| Command | Result |
|---------|--------|
| `stop()` | Emits current values, sets `playState` to `idle`, keeps `finished=false`, fires `onStop(values)` |
| `reset()` | Emits `from` values, sets `playState` to `idle`, keeps `finished=false`, fires `onReset(values)` |
| `finish()` | Emits `to` values only after native confirmation, sets `playState` to `finished`, sets `finished=true`, fires `onComplete(values)` |

### Pre-bind `finish()` Semantics

When `api.finish()` is called before the binding has a concrete target or before
the native `AnimationObject` exists, the command is queued instead of forcing a
locally synthesized terminal state.

1. Before bind and create, the explicit `finish` command is queued.
2. The visible `api.playState` remains `queued`.
3. The visible `api.finished` remains `false`.
4. After bind and native object creation, the queued `finish` command is
   flushed to native.
5. Only after native confirms the terminal state does the API transition to
   `playState='finished'`, `finished=true`, and invoke `onComplete(values)`.

### Callback Semantics

- `onComplete` fires on natural completion and on native-confirmed `finish()`
- `onStop` fires on `stop()`
- `onReset` fires on `reset()`
- `onComplete`, `onStop`, and `onReset` are mutually exclusive for a given
  session termination
- `onError` remains independent

## Examples

### 2D Container Motion

```text
function FloatingCard() {
  const [animation, api, style] = useAnimation({
    from: { transform: { translate: { y: 0 } } },
    to: { transform: { translate: { y: -20 } } },
    duration: 1.5,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
  })

  return (
    <div enable-xr style={{ ...style }} xr-animation={animation}>
      <button onClick={() => api.pause()}>Pause</button>
      <button onClick={() => api.resume()}>Resume</button>
      <p>I float forever</p>
    </div>
  )
}
```

### Static3D Container Motion

```text
import { Model, useAnimation } from '@webspatial/react-sdk'

function AnimatedModel() {
  const [animation] = useAnimation({
    from: { transform: { rotate: { y: 0 } } },
    to: { transform: { rotate: { y: 180 } } },
    duration: 1.2,
    timingFunction: 'easeInOut',
  })

  return <Model src="robot.usdz" xr-animation={animation} />
}
```

### Dynamic3D Container Motion

```text
import { Entity, Reality, useAnimation } from '@webspatial/react-sdk'

function AnimatedRealityContainer() {
  const [animation] = useAnimation({
    from: { transform: { translate: { y: 20 } }, opacity: 0 },
    to: { transform: { translate: { y: 0 } }, opacity: 1 },
    duration: 0.8,
    timingFunction: 'easeOut',
  })

  return (
    <Reality xr-animation={animation}>
      <Entity />
    </Reality>
  )
}
```

## Capability Detection

Use the single released motion capability gate before relying on the motion API.

```text
import { supports } from '@webspatial/core-sdk'

const canAnimate = supports('useAnimation')
```

For container motion, pure Web runtime does not start a playback fallback.
Capability-negative runtimes remain unavailable until the runtime reports
`supports('useAnimation')`.

`opacity` support also depends on the resolved target kind and runtime:
`spatialized2d` supports `opacity` on visionOS only, while `static3d` and
`dynamic3d` support `opacity` on both runtimes.

## Known Limits

1. Layout-affecting properties are out of scope.
2. Arbitrary CSS transform strings, matrices, skew, and perspective are out of
   scope.
3. A single `animation` binding can target only one component at a time.
4. `timeline` is a single CSS `@keyframes` style object, not an orchestration
   array.
5. Static3D ships root `opacity` playback alongside model-root transform playback.
6. Entity transform animation remains on `useEntityAnimation(config)`.