## Why

The parallel OpenSpec change `spatial-div-animation-api` defines a **session-based** SpatialDiv animation model: one `from`/`to` pair, one `duration`/`delay`, and a separate `animation` prop alongside ordinary `style`. That model is a good fit for simple entrance transitions on visionOS, but it leaves three product gaps uncovered:

1. **Multi-track timelines** — e.g. `translateX` over 0–5s while `opacity` ramps only during 3–5s — cannot be expressed without chaining sessions or splitting hooks.
2. **Dual control channels** — animating via `animation` while layout/visual state also lives in `style` invites suppression edge cases and callback-time flash-back.
3. **Plain Web** — when `supports('useAnimation', ['element'])` is `false`, the session API is specified as **no-op** (`play()` does nothing), so the same component code does not animate in a normal browser.

This change proposes **`useSpatializedMotion`**: a **timeline-first**, **single `style` outlet** API with a **dual backend** (native timeline on capable spatial runtimes, JS keyframe driver on Web). It is an **alternative** to adopting the session API as the long-term public contract; it does **not** modify `openspec/changes/spatial-div-animation-api/`.

**Product / PM (中文 API 摘要):** [API.zh.md](./API.zh.md)

## At a Glance

```jsx
const { style, api } = useSpatializedMotion({ kind: 'spatialized2d', 
  duration: 5,
  tracks: [
    {
      property: 'transform.translate.x',
      keyframes: [
        { at: 0, value: 0 },
        { at: 5, value: 100 },
      ],
      easing: 'linear',
    },
    {
      property: 'opacity',
      keyframes: [
        { at: 3, value: 0 },
        { at: 5, value: 1 },
      ],
      easing: 'easeOut',
    },
  ],
})

<div enable-xr style={{ width: 300, height: 200, ...style }}>...</div>
```

Simple fades remain one-liners via `useSpatializedMotion.simple({ kind: 'spatialized2d', { from, to, duration })`, which desugars to a two-keyframe timeline.

## What Changes

- Add normative capability **`spatial-div-motion`**: timeline config, `useSpatializedMotion` hook, `MotionApi`, Web JS backend, and native timeline bridge payload (evolving existing `AnimateSpatialized2DElement`).
- **Public integration** uses **`style` + `api`** as the authoring contract; no Plan A `animation` prop. Spatial native runtimes also require internal **`motion` binding** (or a future `MotionSpatialDiv` wrapper); see `design.md` § Integration & documentation.
- **Dual backend**: spatial runtimes with `supports('useAnimation', ['element'])` use native timeline playback + existing suppression rules; all other environments use the **Web backend** (RAF keyframes writing `style`) so the same config animates in Chrome/Safari.
- Reuse infrastructure from the session implementation branch: `PortalInstanceObject` suppression, `Spatialized2DElement.animateSpatialDiv`, JSBridge events, `SpatialDivAnimationManager`, SRT compose on native.
- Add **`COMPARISON.md`** documenting session API (plan A) vs motion API (plan B) for design review.
- Add test-server routes under `/spatial-div-motion` for side-by-side demos, including the canonical multi-track acceptance scenario.

## Capabilities

### New Capabilities

- `spatial-div-motion`: Timeline-based SpatialDiv motion with dual backend and single `style` outlet.

### Modified Capabilities

- `runtime-capabilities`: Reuse `supports('useAnimation', ['element'])` as the gate for the **native** motion backend; Web backend does not require it.

## Impact

- **Packages**: `@webspatial/core-sdk` (timeline types), `@webspatial/react-sdk` (hook + backends), visionOS native (timeline evaluator — phased in `tasks.md`).
- **Relationship to session API**: Session code may remain on the branch for plan A demos; motion API is the proposed stable shape for new apps.
- **Breaking changes**: None for consumers of session API until product chooses to deprecate it; this change is additive as a parallel proposal.

## Recommendation

See `COMPARISON.md`. Default recommendation for new SpatialDiv animation work: **plan B (this change)** when apps need Web parity or multi-track timelines; **plan A** only for minimal native-only POCs already in flight.
