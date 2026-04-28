## Context

The reviewed entity transform animation docs split the feature into API design, implementation design, and boundary behavior. The implementation spans React entity components, core SDK command plumbing, runtime capability detection, and the visionOS native scene layer, so a design document is useful before coding.

Current SDK behavior updates entity transform props immediately. There is no built-in contract for native transform playback, animation lifecycle callbacks, or coordination between React re-renders and in-flight native animation.

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

5. **Entity transform synchronization uses per-field animation suppression**
   - While animation controls a specific field, ordinary transform syncing for that field is suppressed so React re-renders do not race the active animation.
   - Untargeted transform fields continue to behave exactly as they do today.
   - Alternative considered: freeze all transform syncing while any animation is active. Rejected because it unnecessarily blocks unrelated transform updates.

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