## Context

See the proposal for full motivation. In short: entity transform updates are currently instantaneous with no native transition support. This design covers the transform-only animation API, cross-layer contracts, and behavior rules needed to close that gap.

## Goals / Non-Goals

**Goals:**

- Define a stable public API for transform animation around `useAnimation(config)`, an entity `animation` prop, and `AnimationApi.play/pause/resume/stop`.
- Keep playback native-driven so transform animation does not depend on per-frame JS updates.
- Prevent React prop synchronization from fighting active animation for the same transform field.
- Document runtime capability detection with `supports('useAnimation')`.
- Keep the design testable across React, core command flow, and native completion / stop behavior.

**Non-Goals:**

- Animating non-transform properties such as material, opacity, or color.
- Adding spring physics or arbitrary easing beyond the documented timing functions in this change.
- Solving large-angle rotation limitations beyond documenting current behavior.
- Adding a reactive runtime capability subscription model.

## API Surface

The public contract centers on the `useAnimation` hook. The types below define the agreed shape; behavioral semantics are specified in the companion spec.

### Hook Signature

```typescript
function useAnimation(config: AnimationConfig): [AnimatedProps, AnimationApi]
```

### AnimationConfig

```typescript
interface AnimationConfig {
  /** Target transform values (required). */
  to: {
    position?: Vec3
    rotation?: Vec3
    scale?: Vec3
  }

  /** Starting transform values. Omit to animate from the entity's current state. */
  from?: {
    position?: Vec3
    rotation?: Vec3
    scale?: Vec3
  }

  /** Duration in seconds. Default: 0.3 */
  duration?: number

  /** Easing curve. Default: 'easeInOut' */
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  /** Delay before playback starts, in seconds. Default: 0 */
  delay?: number

  /** Start automatically when the entity mounts. Default: true */
  autoStart?: boolean

  /**
   * Loop behavior.
   * - true: reset to `from` and replay (infinite reset loop)
   * - { reverse: true }: alternate direction each cycle (infinite reverse loop)
   * - undefined / false: play once
   */
  loop?: boolean | { reverse?: boolean }

  /** Called when playback starts. */
  onStart?: () => void

  /** Called when a non-looping animation finishes naturally. Receives the final native transform. */
  onComplete?: (finalValues: TransformValues) => void

  /** Called when playback is stopped via api.stop(). Receives the transform at the stop point. */
  onStop?: (currentValues: TransformValues) => void
}
```

### AnimationApi

```typescript
interface AnimationApi {
  /** Start (or restart) the animation. */
  play(): void

  /** Pause the animation at the current progress. */
  pause(): void

  /** Resume a paused animation from where it left off. */
  resume(): void

  /** Stop the animation. The entity stays at the stop-point transform. */
  stop(): void

  /** Whether an animation session is currently active. */
  readonly isAnimating: boolean
}
```

### AnimatedProps

Opaque object returned as the first tuple element. Pass it directly to the entity's `animation` prop — application code should not read or modify its contents.

### TransformValues

```typescript
interface TransformValues {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
```

## Usage Examples

### Entrance animation on mount

Animate position and scale together with a delay. `autoStart` defaults to `true`, so playback begins when the entity mounts.

```tsx
function FloatingBox() {
  const [animation] = useAnimation({
    from: { position: { x: 0, y: -1, z: -2 }, scale: { x: 0.1, y: 0.1, z: 0.1 } },
    to:   { position: { x: 0, y: 1, z: -2 },  scale: { x: 1, y: 1, z: 1 } },
    duration: 0.6,
    delay: 1.5,
    timingFunction: 'easeOut',
  })

  return (
    <Reality>
      <SceneGraph>
        <BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### Manual trigger with play()

Set `autoStart: false` and call `api.play()` on interaction.

```tsx
function TapToMove() {
  const [animation, api] = useAnimation({
    from: { position: { x: -1, y: 0, z: -2 } },
    to:   { position: { x: 1, y: 0, z: -2 } },
    duration: 0.8,
    autoStart: false,
  })

  return (
    <Reality onSpatialTap={() => api.play()}>
      <SceneGraph>
        <BoxEntity width={0.3} height={0.3} depth={0.3} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### Continuous reverse loop with pause / resume

Infinite back-and-forth rotation. Tap toggles pause and resume.

```tsx
function SpinningModel() {
  const [animation, api] = useAnimation({
    from: { rotation: { x: 0, y: 0, z: 0 } },
    to:   { rotation: { x: 0, y: 170, z: 0 } },
    duration: 2.0,
    timingFunction: 'linear',
    loop: { reverse: true },
  })

  return (
    <Reality onSpatialTap={() => api.isAnimating ? api.pause() : api.play()}>
      <SceneGraph>
        <ModelEntity model="robot" scale={{ x: 0.2, y: 0.2, z: 0.2 }} animation={animation} />
      </SceneGraph>
    </Reality>
  )
}
```

### Stop and sync state

During playback, the animation takes over `position` and ordinary prop updates are suppressed. After `stop()`, control returns to the `position` prop. `onStop` syncs the stop-point transform back into React state so the entity does not jump.

```tsx
function StopAndSync() {
  const [pos, setPos] = useState<Vec3>({ x: 0, y: 0, z: -2 })

  const [animation, api] = useAnimation({
    to: { position: { x: 2, y: 2, z: -2 } },
    duration: 3.0,
    autoStart: false,
    onStop: (current) => {
      if (current.position) setPos(current.position)
    },
  })

  return (
    <>
      <button onClick={() => api.play()}>Play</button>
      <button onClick={() => api.stop()}>Stop</button>
      <Reality>
        <SceneGraph>
          <BoxEntity
            width={0.3} height={0.3} depth={0.3}
            position={pos}
            animation={animation}
          />
        </SceneGraph>
      </Reality>
    </>
  )
}
```

## Cross-Layer Contracts

### React SDK → Core SDK

React calls one method on `SpatialEntity` to drive the full animation lifecycle:

```typescript
interface SpatialEntity {
  animateTransform(command: AnimateTransformCommand): Promise<AnimateTransformResult>
}

interface AnimateTransformCommand {
  animationId: string
  type: 'play' | 'pause' | 'resume' | 'stop'
  /** Required when type is 'play'; ignored otherwise. */
  entityId?: string
  toTransform?: Float4x4
  fromTransform?: Float4x4
  duration?: number
  timingFunction?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  delay?: number
  loop?: boolean | { reverse?: boolean }
}

interface AnimateTransformResult {
  animationId: string
  /** Resolves when the animation completes naturally. */
  finished: Promise<TransformValues>
  /** Resolves when the animation is stopped via stop(). */
  stopped: Promise<TransformValues>
}
```

### Core SDK ↔ Native (JSBridge)

**JS → Native command:** a single `AnimateTransform` command with `type` discriminator, matching the `AnimateTransformCommand` shape above. Core SDK serializes and sends it over the bridge.

**Native → JS events:**

| Event name | Trigger | Payload |
|---|---|---|
| `{animationId}_completed` | Animation finishes naturally (all loops done) | `TransformValues` — final native transform |
| `{animationId}_stopped` | `stop()` called | `TransformValues` — transform at stop point |

Both event listeners are registered at `play` time to avoid race conditions where `stop()` is called before listeners are ready.

## Decisions

1. **Public API uses `useAnimation` plus an entity `animation` prop**
   - The reviewed docs prefer an explicit `animation` prop over spreading animation data into normal entity props.
   - `AnimationApi.play()` replaces `start()` so the imperative verbs align better with existing media-style control surfaces.
   - Alternative considered: spread returned animated props directly onto the entity. Rejected because it mixes hidden animation metadata with normal entity props and makes collisions harder to reason about.

2. **React stores config separately from the render-facing animation object**
   - Hook configuration such as `from`, `to`, callbacks, timing, and loop settings stays in hook-owned state or refs.
   - The render-facing `animation` object only carries transform targets and internal binding metadata needed by the entity component.
   - Alternative considered: put the full config on the entity prop. Rejected because it couples render payload and control payload, and it increases accidental re-render churn.

3. **Core and native layers use a unified animation command contract**
   - The latest reviewed design consolidates play, pause, resume, and stop into one animation command with a `type` discriminator instead of four separate commands.
   - This reduces JSBridge registration overhead, keeps control flow centralized, and matches the fact that all operations address one animation session identified by `animationId`.
   - Alternative considered: separate command types per action. Rejected because it duplicates registration and parsing without improving the public contract.
4. **Playback runs on the native side and reports terminal transform state back to JS**
   - Native playback owns the animation session, timing, delay, loop behavior, and pause / resume state.
   - JS receives completion and stop results so callbacks can observe the actual final or current transform from native state.
   - Alternative considered: emulate motion in JS and stream transform updates over the bridge. Rejected because it adds bridge traffic, risks jitter, and weakens parity with the reviewed RealityKit-based design.
   - **Stop semantics:** when `stop()` is called, the entity freezes at its current in-flight transform (the stop point), not at `from` or `to`. The native side reads `entity.transform` at that instant, reports it back via the stopped event, and the `onStop` callback delivers that value so JS state can be synced.

5. **Entity transform synchronization uses per-field animation suppression**
   - While animation controls a specific field, ordinary transform syncing for that field is suppressed so React re-renders do not race the active animation.
   - Untargeted transform fields continue to behave exactly as they do today.
   - Alternative considered: freeze all transform syncing while any animation is active. Rejected because it unnecessarily blocks unrelated transform updates.
   - **Suppression release timing:** field-level suppression is lifted when the animation session ends (via completion or stop). The `__animating` flags are cleared before the lifecycle callback fires, so the next React render cycle after the callback will resume ordinary transform synchronization for the previously animated fields.

6. **Capability detection is explicit and top-level**
   - `supports('useAnimation')` documents whether the end-to-end animation feature is available in the current runtime.
   - Applications can branch on capability before depending on the animation API in environments that do not yet implement the native bridge path.
   - Alternative considered: no dedicated capability key. Rejected because the review explicitly calls out feature detection as part of the external contract.

7. **Unsupported runtimes surface a warning**
   - When `useAnimation` is used in a runtime where `supports('useAnimation')` is `false`, the SDK should surface a warning instead of failing silently.
   - This keeps capability misuse visible during integration without changing the capability contract itself.

8. **Invalid animation config is treated as a programmer error**
   - Invalid config such as unsupported loop shape, missing animation targets, or nonsensical timing values should throw rather than be ignored.
   - This keeps failures close to the call site and avoids debugging ambiguous partial playback behavior.

9. **Entity integration should land in the shared abstraction first**
   - The new `animation` prop should be wired through the common entity abstraction layer before touching leaf entity components.
   - This minimizes duplicated logic and keeps transform synchronization behavior consistent across entity types.

## Risks / Trade-offs

- **Risk:** API drift between reviewed docs and implementation -> **Mitigation:** lock the OpenSpec contract around `play`, `animation` prop, `loop`, and lifecycle callbacks before editing code.
- **Risk:** React re-renders still leak competing transform updates -> **Mitigation:** add targeted tests for mixed animated and non-animated fields and wire suppression at the entity transform sync boundary.
- **Risk:** Native playback edge cases around delay, stop, and completion ordering -> **Mitigation:** keep a single animation session record keyed by `animationId` and verify callback ordering in tests.
- **Risk:** Runtime support differs across environments -> **Mitigation:** gate the feature with `supports('useAnimation')` and document conservative false behavior.
- **Risk:** Bridge overhead could accumulate for complex animation orchestration -> **Mitigation:** a single play command equals 1 bridge call; during playback there are zero per-frame bridge calls; terminal events add at most 1 callback per session (completion or stop). Total bridge traffic per animation lifecycle is bounded at 2–3 calls regardless of duration or frame count.
- **Risk:** Rotation behavior surprises developers for large angles -> **Mitigation:** document the limitation and keep the first version scoped to the reviewed transform behavior.

## Migration Plan

- Ship as an additive API in React and core SDK layers.
- Update capability tables and public docs in the same change so applications can safely branch on support.
- Validate the feature in test-server examples before relying on it in broader samples.
- If rollout needs to pause, disable the capability key and avoid exposing the feature in public exports until native support is complete.

## Resolved Follow-ups

- Unsupported runtimes should emit a warning when `useAnimation` is used without a successful capability check.
- Invalid animation config should throw instead of being silently ignored.
- Entity integration should go through the shared abstraction layer first to avoid duplicated component changes.