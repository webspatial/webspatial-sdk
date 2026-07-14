# Motion

## Overview

The experimental `useAnimation` hook drives declarative, timeline-based motion on a spatialized element (`<div enable-xr>`, `<Model>`, `<Reality>`). It normalizes an authoring config into per-property tracks, binds them to the element's native container, and returns an imperative playback handle plus a React style outlet. The internal binding kinds (`spatialized2d` / `static3d` / `dynamic3d`) are resolved from the bound element's native type and are never exposed as capability sub-tokens.

## Try it

```jsx
import { useAnimation } from '@webspatial/react-sdk/experimental'

function FadeIn() {
  const [motion, api, style] = useAnimation({
    from: { transform: { translate: { z: 0 } }, opacity: 0 },
    to: { transform: { translate: { z: 100 } }, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <div enable-xr xr-animation={motion} style={{ width: 300, height: 150, ...style }}>
      Hello Spatial
    </div>
  )
}
```

## Return Value

`useAnimation(config)` returns a readonly tuple `[animation, api, style]`.

`animation` An opaque `SpatializedMotionBinding` handle. Pass it to the target element's `xr-animation` prop to bind the motion to that element. Do not read or mutate its internals.

`api` A `SpatializedPlaybackApi` object exposing imperative playback controls and reactive state getters (see [JavaScript API](#javascript-api)).

`style` A `CSSProperties` object reflecting the element's current animated values. Spread it onto the target element's `style` so that the DOM/web fallback stays visually in sync with the native animation.

## Config

`useAnimation` accepts a `SpatializedMotionConfig`, which is a union of two authoring shapes: **segment** and **timeline**. Both share the same playback options and callbacks.

### Segment authoring

A single-segment `from` → `to` interpolation over `duration`.

`from` The start visual values (`SpatializedVisualValues`). Required.

`to` The end visual values (`SpatializedVisualValues`). Required.

### Timeline authoring

Percentage-keyframe authoring for multi-stop motion.

`timeline` A record keyed by percentage strings (`'0%'`, `'50%'`, `'100%'`), each mapping to `SpatializedVisualValues` with an optional per-keyframe `timingFunction`. Required. When `timeline` is present, any `from` / `to` are ignored.

### Shared options

`duration` Total playback time in seconds.

`timingFunction` Default interpolation curve — one of `linear`, `easeIn`, `easeOut`, `easeInOut`.

`delay` Playback delay in seconds before the timeline starts.

`autoStart` A Boolean; if `true`, playback begins automatically once the element is bound.

`loop` `true` for infinite looping, or `{ reverse?: boolean }` to enable ping-pong looping.

`playbackRate` A speed multiplier for playback (e.g. `0.5` plays at half speed).

## Visual Values

`SpatializedVisualValues` is the whitelisted set of animatable visual fields at an instant in time. Layout/size fields (`width`, `height`, `back`, `depth`) are **not** animatable.

`opacity` A unitless number in `[0, 1]`.

`transform.translate` `{ x?, y?, z? }` in CSS pixels.

`transform.rotate` `{ x?, y?, z? }` in degrees, aligning with CSS `rotateX/Y/Z()`.

`transform.scale` `{ x?, y?, z? }` as unitless multipliers, aligning with CSS `scaleX/Y/Z()`.

The transform is composed in the fixed order translate → rotate → scale. Arbitrary CSS transform strings, skew, perspective, and matrix interpolation are not supported. The complete scalar property whitelist is: `opacity`, `transform.translate.{x,y,z}`, `transform.rotate.{x,y,z}`, `transform.scale.{x,y,z}`.

## Events

Motion lifecycle callbacks are passed directly on the config object.

`onStart` Fired when playback starts.

`onComplete` Fired when playback completes naturally. Receives the final `SpatializedVisualValues`.

`onStop` Fired when playback is stopped via `stop()`. Receives the current values.

`onReset` Fired when the animation is reset via `reset()`. Receives the reset values.

`onError` Fired when asynchronous native playback fails. Receives a `SpatializedPlaybackError` (`{ animationId, command, code?, reason }`).

## JavaScript API

The `api` handle (`SpatializedPlaybackApi`) exposes imperative controls and reactive getters.

`play()` Starts or resumes playback.

`pause()` Pauses playback at the current frame.

`stop()` Stops playback and fires `onStop`.

`reset()` Resets the animation to its initial values and fires `onReset`.

`finish()` Fast-forwards to the final frame; both a user-invoked `finish()` and a natural end mark the animation as finished and trigger `onComplete`.

`isAnimating` A read-only Boolean indicating whether playback is currently running.

`isPaused` A read-only Boolean indicating whether playback is paused.

`finished` A read-only Boolean indicating whether the animation has reached its finished state.

`playState` A read-only `SpatializedMotionPlayState` — one of `idle`, `queued`, `running`, `paused`, `finished`.

## Capability Detection

Spatialized motion is gated behind the `useAnimation` runtime capability. Probe support before relying on it:

```jsx
import { WebSpatialRuntime } from '@webspatial/react-sdk'

const supported = WebSpatialRuntime.supports('useAnimation')
```

When `supports('useAnimation')` is `false`, calling `useAnimation` logs a one-time warning and returns a no-op API: `play()` becomes a no-op and `isAnimating` stays `false`. The style outlet still reflects the config's initial values so the web fallback renders correctly.

## Usage Notes

- **Bind via `xr-animation`**: The `animation` tuple element must be assigned to the element's `xr-animation` prop; without binding, playback controls have no target.
- **Spread `style`**: Always spread the returned `style` onto the target so the DOM fallback tracks the native animation.
- **Internal kinds are hidden**: `useAnimation` resolves the internal target kind from the bound element's native type; never pass or expect `spatialized2d` / `static3d` / `dynamic3d` as public tokens.
- **`from`/`to` ignored with timeline**: Supplying `timeline` takes precedence; any `from` / `to` are dropped during normalization.

## Examples

### Fade-in entrance (segment)

```jsx
import { useAnimation } from '@webspatial/react-sdk/experimental'

function FadeInEntrance() {
  const [motion, api, style] = useAnimation({
    from: { transform: { translate: { z: 0 } }, opacity: 0 },
    to: { transform: { translate: { z: 100 } }, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
    autoStart: true,
    onStart: () => console.log('onStart'),
    onComplete: values => console.log('onComplete', values),
  })

  return (
    <div enable-xr xr-animation={motion} style={{ width: 300, height: 150, ...style }}>
      Hello Spatial
    </div>
  )
}
```

### Timeline keyframes

```jsx
import { useAnimation } from '@webspatial/react-sdk/experimental'

const TIMELINE = {
  '0%': {
    opacity: 0.35,
    transform: { translate: { y: 12 }, rotate: { x: 30 }, scale: { x: 0.75, y: 0.75, z: 0.75 } },
  },
  '50%': {
    opacity: 1,
    transform: { translate: { y: -8, z: 55 }, rotate: { z: 80 }, scale: { x: 1.12, y: 1.12, z: 1.12 } },
  },
  '100%': {
    opacity: 0.9,
    transform: { translate: { z: 20 }, rotate: { x: 20 }, scale: { x: 2, y: 1, z: 1 } },
  },
}

function TimelineMotion() {
  const [motion, api, style] = useAnimation({
    duration: 4,
    autoStart: true,
    timeline: TIMELINE,
  })

  return <div enable-xr xr-animation={motion} style={{ ...style }} />
}
```

### Imperative controls

```jsx
function Controlled() {
  const [motion, api, style] = useAnimation({
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 2,
  })

  return (
    <>
      <div enable-xr xr-animation={motion} style={{ ...style }} />
      <button onClick={() => api.play()}>Play</button>
      <button onClick={() => api.pause()}>Pause</button>
      <button onClick={() => api.stop()}>Stop</button>
      <button onClick={() => api.finish()}>Finish</button>
      <button onClick={() => api.reset()}>Reset</button>
      <span>{api.playState}</span>
    </>
  )
}
```

### Looping playback

```jsx
function Pulse() {
  const [motion, , style] = useAnimation({
    from: { transform: { scale: { x: 1, y: 1, z: 1 } } },
    to: { transform: { scale: { x: 1.2, y: 1.2, z: 1.2 } } },
    duration: 1,
    autoStart: true,
    loop: { reverse: true },
  })

  return <div enable-xr xr-animation={motion} style={{ ...style }} />
}
```

## Technical Summary

|                     |                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point         | `useAnimation(config)` from `@webspatial/react-sdk/experimental`.                                                                        |
| Return value        | Readonly tuple `[animation: SpatializedMotionBinding, api: SpatializedPlaybackApi, style: CSSProperties]`.                              |
| Authoring shapes    | Segment (`from`/`to`) or timeline (percentage keyframes); mutually exclusive.                                                            |
| Animatable fields   | `opacity` and `transform.translate/rotate/scale` on x/y/z. No `width`/`height`/`back`/`depth`.                                          |
| Timing functions    | `linear`, `easeIn`, `easeOut`, `easeInOut`.                                                                                              |
| Play states         | `idle`, `queued`, `running`, `paused`, `finished`.                                                                                       |
| Capability gate     | `WebSpatialRuntime.supports('useAnimation')`; internal kinds `spatialized2d`/`static3d`/`dynamic3d` are never exposed as sub-tokens.    |
| Binding             | Assign `animation` to the element's `xr-animation` prop; spread `style` for the web/DOM fallback.                                        |

## Browser Compatibility

### Javascript

| API                                  | visionOS | Pico OS     | WebSpatial SDK |
| ------------------------------------ | -------- | ----------- | -------------- |
| useAnimation                         | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| supports('useAnimation')             | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| play / pause / stop / reset / finish | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| segment (from/to)                    | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| timeline keyframes                   | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| loop / playbackRate / delay          | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |

### Animatable properties

| Property             | visionOS | Pico OS     | WebSpatial SDK |
| -------------------- | -------- | ----------- | -------------- |
| opacity              | ✓<br>26  | ❌          | ✓<br>1.8       |
| transform.translate  | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| transform.rotate     | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |
| transform.scale      | ✓<br>26  | ✓<br>6 OTA0 | ✓<br>1.8       |

## Feature Implementation Details

### Config normalization

Both segment and timeline authoring are desugared into a canonical `NormalizedSpatializedMotionConfig` composed of per-property numeric tracks (`SpatializedMotionTrack`), then serialized into a `SpatializedMotionTimeline` wire payload for the native bridge. Each track carries a resolved `timingFunction`, defaulting to the config-level curve.

### Binding lifecycle

`useAnimation` creates an `AnimationBinding` on first render and keeps it stable across re-renders. Config changes are diffed by a signature and pushed to the binding via `updateConfig`. On unmount the binding is torn down on a deferred timer, so a fast remount reuses the same native animation instead of recreating it.

### Native emit model

The native layer emits element-motion state changes with action values such as `created`, `start`, `play`, `pause`, `resume`, `stop`, `reset`, `finish`, `complete`, `destroy`, and `failed`. Both `finish` (user-invoked fast-forward) and `complete` (natural end) set the finished state and drive `onComplete`.

## Risks

- **Whitelist-only visual model**: Only opacity and translate/rotate/scale are animatable. Requests for skew, perspective, matrix, or size interpolation are out of scope and must be handled outside `useAnimation`.
- **Capability variance**: On runtimes where `supports('useAnimation')` is `false`, motion silently degrades to a no-op with a web-style fallback; consumers relying on `onComplete` timing should feature-detect first.

## References

- `packages/react/src/spatialized-container/motion/useAnimation.ts`
- `packages/core/src/types/motion/spatializedMotion.ts`
- `packages/core/src/types/motion/spatializedVisual.ts`
- `packages/core/src/types/motion/spatializedPlayback.ts`
