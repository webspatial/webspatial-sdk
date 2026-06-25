# Entity Transform Animation

The `useEntityAnimation` hook enables declarative transform animations (position, rotation, scale) on spatial entities within a `Reality`/`SceneGraph` tree.

## Quick Start

```text
import {
  BoxEntity,
  Reality,
  SceneGraph,
  useEntityAnimation,
} from '@webspatial/react-sdk'

function AnimatedBox() {
  const [animation, api] = useEntityAnimation({
    from: { position: { x: 0, y: 0, z: 0 } },
    to: { position: { x: 1, y: 0, z: 0 } },
    duration: 1.0,
    timingFunction: 'easeInOut',
    onComplete: (transform) => console.log('Done!', transform),
  })

  return (
    <Reality>
      <SceneGraph>
        <BoxEntity width={0.1} height={0.1} depth={0.1} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

## API Reference

### `useEntityAnimation(config: AnimationConfig)`

Returns `[AnimatedProps, AnimationApi]`.

### AnimationConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `to` | `TransformTarget` | — | **Required.** Target transform values. |
| `from` | `TransformTarget` | current transform | Start values. If omitted, uses entity's current transform at play time. |
| `duration` | `number` | — | **Required.** Animation duration in seconds. |
| `timingFunction` | `TimingFunction` | `'easeInOut'` | Timing curve. |
| `delay` | `number` | `0` | Delay in seconds before animation starts. |
| `loop` | `boolean \| { reverse?: boolean }` | `false` | Enable looping. `true` for reset loop, `{ reverse: true }` for ping-pong. |
| `playbackRate` | `number` | `1` | Speed multiplier. Negative values reverse playback. Must be non-zero and finite. |
| `autoStart` | `boolean` | `true` | Start automatically when the entity is bound. |
| `onStart` | `() => void` | — | Called when the animation begins playing. |
| `onComplete` | `(transform: TransformValues) => void` | — | Called on natural completion with the final transform. |
| `onCancel` | `(transform: TransformValues) => void` | — | Called when `cancel()` is invoked, receives the restored `from` transform. |
| `onError` | `(error: AnimationError) => void` | — | Called on bridge or validation errors. |

### AnimationApi

| Property/Method | Type | Description |
|----------------|------|-------------|
| `play()` | `void` | Start a new session (from idle/finished), resume (from paused), or no-op (if already running). |
| `pause()` | `void` | Pause the running animation, or freeze a queued pending play request. |
| `cancel()` | `void` | Cancel the animation; restores entity to `from` transform. |
| `isAnimating` | `boolean` | `true` while queued, delaying, or running; `false` while paused, idle, or finished. |
| `isPaused` | `boolean` | `true` when the session is paused. |
| `playState` | `AnimationPlayState` | Current state: `'idle'`, `'queued'`, `'running'`, `'paused'`, or `'finished'`. |
| `finished` | `boolean` | `true` after natural completion; resets to `false` on next `play()`. |

### AnimationPlayState

```typescript
type AnimationPlayState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'
```

**State transitions:**

```
idle ──play()──> queued ──(entity bound)──> running
                 │    │                         │
                 │    └─pause()──> paused ◀────┘
                 │                  │
                 │                  └─play()──> queued/running
                 └─cancel()──> idle
finished ──play()──> running
running ──(completes)──> finished
running ──cancel()──> idle
running ──play()──> running (no-op)
```

- `'idle'` — no active session (either never started, or after `cancel()`).
- `'queued'` — `play()` was called before the entity was bound; will begin when bound unless paused or canceled first.
- `'running'` — actively animating (includes the delay phase). `play()` in this state is a no-op.
- `'paused'` — paused mid-animation, or a queued pending play was frozen; `play()` resumes.
- `'finished'` — completed naturally; entity remains at `to` transform.

## Behavior Details

### cancel() vs completion

- **`cancel()`** — Stops playback and restores the entity to the `from` transform (or the captured start snapshot if `from` was omitted). Triggers `onCancel`.
- **Natural completion** — Entity arrives at `to` transform and stays. Triggers `onComplete`. Sets `finished = true`.

### play() semantics

Follows the Web Animation API contract:

- If the animation is **idle** or **finished**, `play()` starts a **new session**.
- If the animation is **paused**, `play()` resumes the same session. If the native session already exists, this sends a `resume` command to the bridge; if the session was paused while queued, it resumes the pending play request.
- If the animation is **running** or **delaying**, `play()` is a **no-op** — it does not restart or interrupt the current session.

To restart an animation that is already running, explicitly cancel it first:

```text
api.cancel()
api.play()
```

### playbackRate

Controls animation speed. Applied at session start and maps to `AnimationView.speed` on the native AVP layer.

- `playbackRate > 1` — faster playback
- `0 < playbackRate < 1` — slower playback
- `playbackRate < 0` — reverse playback (animates from `to` back to `from`)
- `playbackRate = 0` — **invalid** (throws)

```text
const [animation, api] = useEntityAnimation({
  to: { position: { x: 1, y: 0, z: 0 } },
  duration: 2.0,
  playbackRate: 2.0, // completes in 1 second
})

// Reverse playback
const [reverseAnim, reverseApi] = useEntityAnimation({
  from: { position: { x: 0, y: 0, z: 0 } },
  to: { position: { x: 1, y: 0, z: 0 } },
  duration: 2.0,
  playbackRate: -1, // plays from to → from in 2 seconds
})
```

### Capability Detection

```text
import { supports } from '@webspatial/core-sdk'

if (supports('useAnimation', ['entity'])) {
  // Safe to use useEntityAnimation
}
```

On unsupported runtimes, `useEntityAnimation` logs a console warning and returns a no-op API.

### Transform Suppression

While an animation is active, the animated transform fields (position/rotation/scale) are **suppressed** — ordinary React prop updates for those fields are ignored to prevent conflicts. Non-animated fields continue to work normally.