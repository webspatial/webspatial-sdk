# Entity Motion

`useEntityAnimation` animates an Entity's `position`, `rotation`, and `scale`.
It is experimental and is exported from `@webspatial/react-sdk/experimental`.

## Quick Start

```text
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'

function AnimatedBox() {
  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: 0, y: 0, z: 0 } },
    to: { position: { x: 1, y: 0, z: 0 } },
    duration: 1,
    onComplete: values => console.log(values),
  })

  return (
    <Reality>
      <SceneGraph>
        <BoxEntity
          width={0.1}
          height={0.1}
          depth={0.1}
          {...entityProps}
          animation={animation}
        />
      </SceneGraph>
    </Reality>
  )
}
```

The Hook returns:

| Value | Purpose |
|---|---|
| `animation` | Pass to the Entity's `animation` prop. |
| `api` | Controls playback and committed transform writes. |
| `entityProps` | Contains the latest complete Native-confirmed transform. Spread it after base transform props. |

## Config

Every animation declares both boundaries:

- Top-level `from` and `to` define a simple animation. Its default `duration` is `0.3`.
- `timeline.from` and `timeline.to` are equivalent to `0%` and `100%`.
- Percentage frames add intermediate keyframes.
- A config containing `timeline` requires `duration`.
- If top-level boundaries and `timeline` are both present, `timeline` wins.

Boundary frames may contain sparse axes. Native fills omitted axes from the
Entity transform captured when a fresh play starts.

```text
const [animation] = useEntityAnimation({
  duration: 1.2,
  timingFunction: 'easeInOut',
  timeline: {
    from: { position: { x: 0 } },
    '50%': {
      position: { x: 0.5 },
      timingFunction: 'easeOut',
    },
    to: { position: { x: 1 } },
  },
  delay: 0,
  playbackRate: 1,
  loop: false,
  autoStart: true,
})
```

`timingFunction` accepts `linear`, `easeIn`, `easeOut`, or `easeInOut`.
A frame timing function applies from that frame to the next frame.
`playbackRate` must be finite and greater than zero.
`loop` accepts `false`, `true`, or `{ reverse: true }`.

The following callbacks receive complete confirmed values where applicable:
`onStart`, `onComplete`, `onStop`, `onReset`, and `onError`.

## Playback API

| API | Behavior |
|---|---|
| `play()` | Starts a fresh run from `idle` or `finished`; resumes from `paused`; does nothing while `running`. |
| `pause()` | Pauses a running animation. |
| `stop()` | Commits the current pose and enters `idle`. |
| `reset()` | Commits the configured start pose and enters `idle`. |
| `finish()` | Commits the configured end pose and enters `finished`. |
| `set(update)` | Merges a sparse transform update while playback is inactive. |

`playState` is `queued`, `idle`, `running`, `paused`, or `finished`.
`running` includes the configured delay. `queued` exists only while a playback
command waits for Native animation-object creation.

## Confirmed Values

`entityProps` updates after start, completion, stop, reset, finish, a successful
config update, or a successful `api.set`. It may be empty before the first
confirmation.

```text
api.set({ position: { y: 0.3 } })
```

`api.set` accepts at least one `position`, `rotation`, or `scale` scalar. It is
serialized with playback and config-update commands. During active playback,
Native rejects it and the SDK reports one warning without changing state.

## Config Updates

Changing config on the same bound Entity updates the existing Core and Native
animation objects. Their ids remain stable.

| Current state | Update behavior |
|---|---|
| `running` | Retargets from the current Native pose and starts the new delay and full duration. |
| `paused` | Saves the current pose and new definition, stays paused, and starts the new execution on the next `play`. |
| `idle` or `finished` | Installs the new definition without compiling it; the next fresh command reads the latest Native baseline. |

Callback-only changes do not restart playback. `autoStart` applies only after
initial creation. A failed update preserves the previous config, execution,
state, write protection, and `entityProps`.

## Transform Ownership

During delay, running, and pause, Native owns the complete transform and blocks
ordinary React transform writes. Configured axes animate; omitted axes retain
the run baseline. Stop, reset, finish, natural completion, unbind, and destroy
release this protection.

While playback is inactive, combined React props control the transform. Spread
`entityProps` after base transform props to preserve the latest committed pose.

## Capability

```text
import { WebSpatialRuntime } from '@webspatial/react-sdk'

if (WebSpatialRuntime.supports('useEntityAnimation')) {
  // Render the animated Entity.
}
```

Render a static fallback when the capability is unavailable.