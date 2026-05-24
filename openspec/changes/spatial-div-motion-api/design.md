## Context

SpatialDiv sync uses host + probe DOM with field-level and transform-wide suppression during native animation (see `packages/react/src/spatialized-container/ARCHITECTURE.md`). Plan A (session API) adds `animation` prop binding and a single native segment. Plan B (this design) keeps suppression and bridge infrastructure but replaces the **authoring model** with a **timeline document** and a **single `style` outlet**.

## Goals / Non-Goals

**Goals:**

- Timeline-first config with per-track keyframes and global `duration`.
- `useSpatialDivMotion` returns `{ style, api }` for `<div enable-xr style={...} />`.
- **Dual backend:** native timeline when `supports('useAnimation', ['element'])` and spatial binding exists; otherwise Web RAF backend (must not no-op).
- `useSpatialDivMotion.simple()` sugar for two-keyframe single-segment animations (parity with Plan A minimal case).
- Reuse Plan A bridge, Manager, suppression, SRT compose on native.

**Non-Goals:**

- Full `@react-spring/web` physics simulation in v1 (easing + keyframes only; spring curves may be added later or pre-sampled).
- Animating layout/size fields (`width`, `height`, `back`, `depth`).
- Arbitrary CSS transform strings on the motion path.
- Changing entity `useAnimation` entity branch behavior.

## API Surface

```typescript
function useSpatialDivMotion(
  config: SpatialDivMotionConfig,
): { style: SpatialDivMotionStyle; api: SpatialDivMotionApi }

namespace useSpatialDivMotion {
  function simple(config: SpatialDivMotionSimpleConfig): ReturnType<typeof useSpatialDivMotion>
}
```

### SpatialDivMotionConfig

```typescript
interface SpatialDivMotionConfig {
  /** Global timeline length in seconds. Must be > 0 and finite. */
  duration: number
  tracks: SpatialDivMotionTrack[]
  delay?: number
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  onStart?: () => void
  onComplete?: (values: SpatialDivAnimatedValues) => void
  onCancel?: (values: SpatialDivAnimatedValues) => void
  onError?: (error: AnimationError) => void
}

interface SpatialDivMotionTrack {
  property: SpatialDivMotionProperty
  keyframes: Array<{ at: number; value: number }>
  easing?: TimingFunction
}
```

`SpatialDivMotionProperty` is one of: `opacity`, `transform.translate.x|y|z`, `transform.rotate.x|y|z`, `transform.scale.x|y|z`.

### Style outlet

`SpatialDivMotionStyle` is `React.CSSProperties` restricted to animated fields the hook owns (`opacity`, `transform` as a composed string). Layout fields remain on the caller's static `style` merge: `style={{ width: 300, ...motion.style }}`.

## Dual backend

```mermaid
flowchart TD
  Hook[useSpatialDivMotion]
  Hook --> Pick{native available?}
  Pick -->|yes| Native[NativeMotionBackend]
  Pick -->|no| Web[WebMotionBackend RAF]
  Native --> Bridge[animateSpatialDiv timeline play]
  Native --> Suppress[Portal suppression]
  Web --> DOM[style on host/probe path]
```

**Native available** when: `supports('useAnimation', ['element']) === true` AND implementation has bound `Spatialized2DElement` (future: same binding hook as Plan A, driven by motion controller instead of `animation` prop).

**Web backend** runs for plain browsers and as fallback before spatial bind; it MUST drive the same `style` shape.

## Timeline compilation

- **Validation:** keyframes sorted by `at`; `at` in `[0, duration]`; at least two keyframes per track; no duplicate `property` paths across tracks; numeric ranges match Plan A whitelist rules.
- **Evaluation at time `t`:** for each track, find segment `[k_i, k_{i+1}]`, apply easing, lerp scalar; assemble `SpatialDivAnimatedValues`; compose CSS `transform` translate → rotate → scale.
- **Hold:** before first keyframe, use first value; after last, use last value.

## Native evolution (Plan A reuse)

Extend `AnimateSpatialized2DElement` `play` payload:

```typescript
{
  type: 'play',
  animationId: string,
  elementId: string,
  timeline: {
    duration: number,
    delay?: number,
    playbackRate?: number,
    loop?: ...,
    tracks: Array<{
      property: string,
      keyframes: Array<{ t: number; value: number }>, // t normalized 0..1 or seconds — pick seconds in impl
      easing: string,
    }>,
  },
}
```

`SpatialDivAnimationSession` keeps DisplayLink/pause/cancel; replaces single progress lerp with `TimelineEvaluator`.

## simple() sugar

`simple({ from, to, duration, ... })` → one timeline with tracks inferred from keys present in `from`/`to`, each track keyframes `[{ at: 0, value: from }, { at: duration, value: to }]`.

## Decisions

1. **New hook name** — `useSpatialDivMotion` avoids overloading `useAnimation` semantics.
2. **No `animation` prop on motion path** — reduces dual-channel bugs; Plan A remains for comparison only.
3. **Web backend is normative** — not a dev-only fallback.
4. **Reuse `supports('useAnimation', ['element'])`** for native gate only.
5. **Strangler implementation** — ship Web backend + spec first on proposal branch; native timeline in follow-up tasks.

## Risks

- Web/native visual parity — document allowed easing differences; test canonical multi-track scenario on both.
- Native timeline scope — mitigated by phased tasks.
- Concurrent Mode — same limitation as Plan A (suppression tied to React render); document.
