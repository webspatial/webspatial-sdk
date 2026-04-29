## Context

`SpatialDiv` is synced differently from entities today. On the React side, `PortalInstanceObject` reads DOM `computedStyle`, `getBoundingClientRect()`, and a `DOMMatrix`, then updates native via two separate paths:

- `UpdateSpatialized2DElementProperties`: sync properties such as `width`, `height`, `depth`, `opacity`, and `backOffset`
- `UpdateSpatializedElementTransform`: sync the full transform matrix

This means that if we simply reuse the "any prop change immediately syncs native" model, animation playback will compete with regular DOM syncing. At the same time, v1 requirements restrict `SpatialDiv` animation to `back`, `transform.x/y/z`, `opacity`, `depth`, `width`, and `height`, and require a high-level API that follows the existing `entity transform animation` proposal. Therefore, this design is not about supporting arbitrary CSS animations; it is about providing a consistent, minimal-scope animation API on top of the current `SpatialDiv` sync architecture.

## Goals / Non-Goals

**Goals:**

- Keep the same API family: `useAnimation(config)` + `animation` prop + `AnimationApi`, aligned with entity animation usage.
- Restrict `SpatialDiv` animation strictly to a whitelisted property set; avoid arbitrary CSS parsing/interpolation.
- Run playback on the native side; avoid per-frame JS DOM updates or per-frame JSBridge traffic.
- Define suppression rules so regular `SpatialDiv` syncing does not overwrite animation mid-states.
- Provide a dedicated runtime capability key for `SpatialDiv` animation so it can evolve and ship independently from entity animation.

**Non-Goals:**

- Animating arbitrary CSS properties or accepting a full CSS style object as `to` / `from`.
- Supporting `SpatialDiv` rotation/scale/skew, matrix-level transform interpolation, or arbitrary CSS transform string interpolation.
- Auto-writing `width` / `height` animation back into DOM layout or driving browser reflow.
- Unifying entity animation and `SpatialDiv` animation capability keys in this change.
- Multi-step keyframes, async scripts, or timeline orchestration across multiple `SpatialDiv` instances within a single hook.

## API Surface

The public contract centers on the `useAnimation` hook. The types below define the agreed shape; behavioral semantics are specified in the companion spec.

### Hook Signature

```typescript
function useAnimation(config: SpatialDivAnimationConfig): [SpatialDivAnimatedProps, AnimationApi]
```

### SpatialDivAnimatedValues

```typescript
interface SpatialDivAnimatedValues {
  back?: number
  transform?: { x?: number; y?: number; z?: number }
  opacity?: number
  depth?: number
  width?: number
  height?: number
}
```

### SpatialDivAnimationConfig

```typescript
interface SpatialDivAnimationConfig {
  /**
   * Target values (required).
   * Only accepts whitelisted fields: back, transform.x/y/z, opacity, depth, width, height.
   */
  to: SpatialDivAnimatedValues

  /** From values. If omitted, snapshot from current state at play() execution time. */
  from?: SpatialDivAnimatedValues

  /** Duration in seconds. Default: 0.3 */
  duration?: number

  /**
   * Easing curve. Default: 'easeInOut'
   * Only accepts these four values; any other string MUST throw during validation.
   */
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  /** Delay before playback starts, in seconds. Default: 0 */
  delay?: number

  /** Whether to auto-start after binding. Default: true */
  autoStart?: boolean

  /**
   * Loop behavior.
   * - true: reset to `from` and repeat (infinite reset loop)
   * - { reverse: true }: reverse between from and to every iteration (infinite reverse loop)
   * - undefined / false: play once
   */
  loop?: boolean | { reverse?: boolean }

  /** Called when the session is successfully established. First state can be delaying, running, or paused due to queued pause. */
  onStart?: () => void

  /** Called when a non-looping animation finishes naturally. Receives native final values. */
  onComplete?: (finalValues: SpatialDivAnimatedValues) => void

  /** Called when stopped via api.stop(). Receives stop-point values. */
  onStop?: (currentValues: SpatialDivAnimatedValues) => void

  /**
   * Called on asynchronous bridge/native failures.
   * If omitted, the SDK MUST log via console.error.
   */
  onError?: (error: AnimationError) => void
}
```

### AnimationError

```typescript
interface AnimationError {
  /** The session id that failed. */
  animationId: string
  /** The command that failed. */
  command: 'play' | 'pause' | 'resume' | 'stop'
  /** Optional machine-readable code. */
  code?: string
  /** Human-readable reason. */
  reason: string
}
```

### AnimationApi

```typescript
interface AnimationApi {
  /** Start (or restart) playback. */
  play(): void

  /** Pause at current progress. */
  pause(): void

  /** Resume from pause. */
  resume(): void

  /** Stop playback. The SpatialDiv remains at the stop point. */
  stop(): void

  /** True when state is queued, delaying, or running (false when paused). */
  readonly isAnimating: boolean

  /** True when paused. */
  readonly isPaused: boolean
}
```

### SpatialDivAnimatedProps

An opaque object returned as the first tuple element. Pass it directly to the spatialized HTML node's `animation` prop; application code SHOULD NOT read or mutate it.

All whitelisted values use numeric inputs:

- `back`, `depth`, `width`, `height`, `transform.x/y/z`: pixel semantics consistent with existing SpatialDiv behavior
- `opacity`: inclusive range `[0, 1]`

## Usage Examples

### SpatialDiv Entrance Animation

Combine back offset and opacity to fade a card in from behind. `autoStart` defaults to `true`, so playback begins after binding.

```jsx
function FadeInCard() {
  const [animation] = useAnimation({
    from: { back: -50, opacity: 0 },
    to:   { back: 0, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
  })

  return (
    <div enable-xr animation={animation} style={{ width: 300, height: 200 }}>
      <h2>Hello Spatial</h2>
    </div>
  )
}
```

### Manual Play With Stop Size Sync

Set `autoStart: false` and start on interaction. Use `onStop` to sync React state so DOM sizing matches the native final size when desired.

```jsx
function ResizePanel() {
  const [size, setSize] = useState({ width: 200, height: 150 })

  const [animation, api] = useAnimation({
    to: { width: 400, height: 300 },
    duration: 1.0,
    autoStart: false,
    onStop: (current) => {
      if (current.width != null && current.height != null) {
        setSize({ width: current.width, height: current.height })
      }
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Expand</button>
      <button onClick={() => api.stop()}>Stop</button>
      <div
        enable-xr
        animation={animation}
        style={{ width: size.width, height: size.height }}
      >
        <p>Resizable Panel</p>
      </div>
    </>
  )
}
```

### Looping Float Effect

Use `transform.y` and `loop: { reverse: true }` to float up and down infinitely. Tap to toggle pause/resume.

```jsx
function FloatingBadge() {
  const [animation, api] = useAnimation({
    from: { transform: { x: 0, y: 0, z: 0 } },
    to:   { transform: { x: 0, y: 20, z: 0 } },
    duration: 1.5,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
  })

  return (
    <div
      enable-xr
      animation={animation}
      onClick={() => {
        if (api.isPaused) {
          api.resume()
        } else if (api.isAnimating) {
          api.pause()
        } else {
          api.play()
        }
      }}
      style={{ width: 100, height: 100 }}
    >
      <span>Float</span>
    </div>
  )
}
```

## Cross-Layer Contracts

### React SDK → Core SDK

React drives the full lifecycle via a method on `Spatialized2DElement`:

```typescript
interface Spatialized2DElement {
  animateSpatialDiv(command: AnimateSpatialDivCommand): AnimateSpatialDivResult | void
}
```

`animateSpatialDiv()` returns `AnimateSpatialDivResult` when `command.type` is `'play'`. For `'pause'`, `'resume'`, and `'stop'`, it returns `void`.

```typescript
interface AnimateSpatialDivCommand {
  /**
   * Identifies the animation session. Each `play` MUST generate a new globally unique `animationId`.
   * `pause`, `resume`, and `stop` MUST reuse the `animationId` created by the `play` for that session.
   */
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'stop'
  /** Required for 'play'; ignored for other types. */
  elementId?: string
  to?: SpatialDivAnimatedValues
  from?: SpatialDivAnimatedValues
  duration?: number
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  delay?: number
  loop?: boolean | { reverse?: boolean }
}

interface AnimateSpatialDivResult {
  animationId: string
  /** Resolves when a non-looping animation completes naturally. Never resolves for infinite loops. */
  finished: Promise<SpatialDivAnimatedValues>
  /**
   * Resolves when stopped via stop().
   * After stop, `finished` MUST remain pending (MUST NOT reject).
   */
  stopped: Promise<SpatialDivAnimatedValues>
}
```

If the element unmounts during an alive session, the SDK MUST stop/cancel the native session, but MUST NOT resolve `finished` or `stopped`, and MUST NOT call lifecycle callbacks after unmount.

`animateSpatialDiv(...)` MAY reject only when the command cannot be submitted (before native accepts it). Once submitted, asynchronous failures MUST be reported via `{animationId}_failed`, not via `finished` / `stopped`.

### Core SDK ↔ Native (JSBridge)

**JS → Native command:** A single `AnimateSpatialized2DElement` command with a `type` discriminator matching `AnimateSpatialDivCommand`. The Core SDK serializes and sends it via the bridge.

**Native → JS events:**

| Event | When | Payload |
|---|---|---|
| `{animationId}_completed` | Natural completion (after all loops) | `SpatialDivAnimatedValues` — native final values |
| `{animationId}_stopped` | `stop()` is invoked | `SpatialDivAnimatedValues` — stop-point values |
| `{animationId}_failed` | Async failure of `play` / `pause` / `resume` / `stop` | `AnimationError` — includes at least `animationId`, `command`, `reason`, optional `code` |

Listeners for `_completed`, `_stopped`, and `_failed` MUST be registered before sending `play`, to avoid races where terminal/failure events arrive before listeners are ready.

`animationId` MUST be globally unique within the runtime process to avoid event name collisions across elements or sessions.

For a given `animationId`:

- After `play` successfully establishes a session, native MUST emit exactly one terminal event (`_completed` or `_stopped`), and they MUST be mutually exclusive.
- If `play` fails asynchronously, native MUST emit at most one `_failed`, and MUST NOT subsequently emit `_completed` or `_stopped`.
- If `pause`, `resume`, or `stop` fails asynchronously, native MUST emit at most one `_failed` for that failed command; the session remains in the pre-failure state, and `_completed` or `_stopped` MAY still arrive later.

## Decisions

1. **Reuse the `useAnimation` family and split at the entrypoint based on `config.to` key set**

   The public API remains `useAnimation(config)`. Internally, the hook inspects the key set in `config.to` to route to either the entity path or the `SpatialDiv` path. The two key sets are mutually exclusive:

   - Entity keys: `position`, `rotation`, `scale`
   - SpatialDiv keys: `back`, `transform`, `opacity`, `depth`, `width`, `height`

   Rules:

   - If `to` contains keys from both sets, the SDK MUST throw.
   - If `to` contains only entity keys, use the entity path (existing logic, unchanged).
   - If `to` contains only SpatialDiv keys, use the SpatialDiv path (new internal logic).
   - The returned `animation` object carries an internal tag `__kind: 'entity' | 'spatialDiv'` (not exposed as a public API).
   - Entity bindings validate `__kind === 'entity'`; SpatialDiv bindings validate `__kind === 'spatialDiv'`; mismatch MUST throw.

   Impact on entity animation is limited to: (a) one if/else split at the `useAnimation` entrypoint calling existing logic; (b) adding `__kind` on the entity animation object; (c) a single kind check at entity binding time. Entity core logic (validation, Vec3→Float4x4 conversion, bridge commands, suppression, callback dispatch) remains unchanged.

   **Forward compatibility:** the two key sets do not collide today. If future entity animation introduces keys such as `opacity` or `transform` that collide, we MUST introduce an explicit discriminator (for example `target: 'entity' | 'spatialDiv'`) and stop relying on key inference.

   Alternative A: add a separate `useSpatialDivAnimation()`. Pro: zero entity impact. Con: splits the API family and duplicates lifecycle semantics across hooks.

   Alternative B: add a `target` discriminator to config immediately. Rejected because it increases ceremony and is not needed while keys do not collide.

2. **Use a dedicated runtime key `supports('spatialDivAnimation')`**

   Although `SpatialDiv` animation reuses the hook name `useAnimation`, its capability detection does not reuse the entity proposal's `supports('useAnimation')`. Native dependencies, applicable component scope, and shipping timelines may differ; sharing one top-level key would couple the two.

   Therefore:

   - `supports('useAnimation')` remains for entity transform animation
   - `supports('spatialDivAnimation')` indicates `SpatialDiv` whitelisted property animation
   - A runtime MAY support only one of them

   Alternative: introduce sub-tokens such as `supports('useAnimation', ['spatial-div'])`. Rejected for now because the existing entity proposal defines `supports('useAnimation')` as a single key with no sub-token semantics, and changing that contract increases coordination and compatibility risk.

3. **`animation` prop applies only to spatialized HTML nodes created via `enable-xr`**

   `SpatialDiv` animation targets `Spatialized2DElement`, so only nodes on the `Spatialized2DElementContainer` path can play native animations:

   - `animation` may appear on HTML containers that support `enable-xr`
   - If the element is not `enable-xr`, the SDK MUST warn and MUST NOT start native playback
   - One `animation` object MUST NOT bind to multiple elements; the second bind MUST throw immediately

   This matches the entity semantics of one animation object per binding target, and avoids implying that ordinary DOM nodes can use the same capability.

4. **Core / bridge / native use a unified `AnimateSpatialized2DElement` session command**

   `SpatialDiv` animatable fields span both existing sync paths (`transform` and `properties`), so we should not reuse the entity transform-only command as-is. We introduce a unified animation command around `Spatialized2DElement`.

   Alternative: split `transform` vs property animation into two commands. Rejected because a single `SpatialDiv` animation often includes `transform`, `opacity`, and `back`, and splitting significantly increases session alignment and failure recovery complexity.

5. **When `from` is omitted, snapshot at play execution time; `width` / `height` are native-size overrides**

   If `from` is omitted, the SDK snapshots current values when actually issuing `play`, not at hook creation or initial mount. If the element is not yet bound, `play()` enters queued state and the snapshot timing is when binding completes and playback is executed. `delay` only affects when visible motion starts and MUST NOT change snapshot timing. The snapshot MUST cover only fields present in `to`; fields absent from `to` MUST NOT be snapshotted or affected by the session.

   Snapshot sources per field:

   - `back`, `opacity`, `depth`: read from native `Spatialized2DElement` current state
   - `transform.x/y/z`: read translation components from native `Spatialized2DElement` current transform
   - `width` / `height`: read native spatial panel size (not DOM `getBoundingClientRect()`), since a previous animation stop may have made native size differ from DOM layout size

   `width` / `height` are defined as "native spatial size overrides" because regular `SpatialDiv` sizing originates from the DOM layout box, while the animation target is the native spatial panel:

   - `width` / `height` animation updates native `Spatialized2DElement` size
   - It does not automatically mutate DOM CSS `width` / `height`
   - If an app wants DOM state to match the native end state, it should sync React state in `onComplete` / `onStop`

   Alternative: write DOM styles during animation. Rejected because it pulls animation back into the browser layout system (reflow risk) and cannot guarantee strict consistency with native playback.

6. **Competition handling uses property-level suppression plus transform-wide suppression**

   For `back`, `opacity`, `depth`, `width`, and `height`, the SDK uses field-level suppression: when a session controls a field, `PortalInstanceObject.updateSpatializedElementProperties()` MUST stop pushing regular sync updates for that field, while other uncontrolled fields continue to sync normally.

   For `transform`, v1 uses transform-wide suppression rather than splitting into `x/y/z` components. The regular sync path sends a full `DOMMatrix`; suppressing only translation would require matrix decomposition/recomposition on both React and native sides, which is higher risk. Therefore v1 rules are:

   - If the animation config includes `transform`, regular `updateTransform(matrix)` is suppressed for the duration of the alive session
   - After the session ends, regular transform sync resumes on the next React render
   - DOM transform updates during the alive session are cached but do not take effect immediately

   Suppression release timing: field-level suppression is released when the session ends (completion or stop). Suppression flags are cleared before lifecycle callbacks fire, so the next React render after callbacks resumes regular syncing using the latest props, and caches are then discarded.

   This means that if the app changes CSS rotate/scale during a translation animation, those changes are delayed until the session ends. This is an intentional v1 trade-off.

7. **Lifecycle and error semantics match entity animation**

   The semantics of `play`, `pause`, `resume`, `stop`, `isAnimating`, `isPaused`, `onStart`, `onComplete`, `onStop`, and `onError` match the entity animation proposal to minimize behavioral divergence within the SDK.

   - `play()` remains synchronous `void`
   - Asynchronous bridge/native failures surface via `onError`
   - `stop()` keeps the stop point (no snap back to `from`)
   - `loop: true` is reset loop; `loop: { reverse: true }` is reverse loop

   Alternative: define a Promise-based control API for `SpatialDiv`. Rejected because it breaks API consistency with entity animation.

8. **If stop-old fails, MUST block start-new**

   For `play()` re-entry and animation prop replacement, if the stop-old command fails asynchronously, the SDK MUST report via `onError` and keep the old session in its pre-failure state. In that case, the SDK MUST NOT start a new session and the new session's `onStart` MUST NOT fire.

9. **Config updates do not affect alive sessions**

   When an app updates the config passed to `useAnimation(config)` during React re-renders, the current alive session (delaying/running/paused) MUST NOT be affected. The next `api.play()` MUST use the latest config.

## Risks / Trade-offs

- **Transform-wide suppression freezes regular rotate/scale updates during animation** -> Document as a v1 limitation; reserve finer-grained transform composition for later versions.
- **`width` / `height` animation may temporarily diverge native size from DOM layout box** -> Return final values via `onComplete` / `onStop`, and document that apps decide whether to sync React state.
- **A dedicated capability key adds a small mental overhead** -> But enables independent shipping/rollback from entity animation, which reduces overall risk.
- **`SpatialDiv` animation touches multiple layers (React, core, bridge, native)** -> Use a unified session command, a single failure event model, and focused tests to reduce cross-layer drift.
- **Sharing the `useAnimation` entrypoint introduces minor entity-side changes** -> Limited to an entrypoint if/else, a `__kind` field, and binding validation; entity core logic remains unchanged. If keys collide in the future, introduce an explicit discriminator.