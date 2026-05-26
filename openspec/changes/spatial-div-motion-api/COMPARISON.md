# Plan A (Session API) vs Plan B (Motion API)

This document supports design review on branch `proposal/spatial-div-motion-timeline`. It does **not** modify `openspec/changes/spatial-div-animation-api/`.

**Product / PM (中文 API 摘要):** [API.zh.md](./API.zh.md)

| | **Plan A — Session** (`spatial-div-animation-api`) | **Plan B — Motion** (`spatial-div-motion-api`, this change) |
| --- | --- | --- |
| **OpenSpec** | `openspec/changes/spatial-div-animation-api/` | `openspec/changes/spatial-div-motion-api/` |
| **Hook** | `useAnimation(config)` → `[animation, api]` | `useSpatializedMotion(config)` → `{ style, api }` |
| **Integration** | `<div enable-xr animation={animation} style={...} />` | `<div enable-xr style={{ ...layout, ...style }} />` (spatial native: also `motion={motion}` or `MotionSpatialDiv`) |
| **Config shape** | Single `from` / `to`, one `duration`, one `delay` | `duration` + `tracks[]` with per-property keyframes |
| **Multi-track overlap** | Not supported (chain `play` or multiple hooks) | **First-class** |
| **Plain Web** | `play()` no-op + warning | **Web backend MUST animate** (RAF keyframes) |
| **Native path** | `AnimateSpatialized2DElement` session | Timeline payload (reuse bridge/Manager; evaluator extended) |
| **State channels** | `style` + `animation` (suppression) | **Single `style` outlet** for animated fields |
| **Entity animation** | Same `useAnimation` entry (entity keys) | Unchanged; entity stays on entity path |

### Integration footnote (Plan B)

**Public DX:** `{ style, api }` — enough in plain Web. **Spatial native** also needs an internal runtime binding (`motion` prop from the hook, or a future `MotionSpatialDiv` that passes it internally). This is not the same as `@react-spring/web`, where `animated()` hides binding and the app only spreads spring `style` (see `design.md` § Integration & documentation).

| Binding | Plan A | Plan B |
| --- | --- | --- |
| Portal prop | `animation` | `motion` |
| Animated values | `animation` + `style` | **`style` only** |
| Plain Web | `play()` no-op | Web RAF backend |

## Canonical acceptance scenario (Plan B)

**Given** `duration: 5` and tracks:

- `transform.translate.x`: `0` at `t=0`, `100` at `t=5`, `linear`
- `opacity`: `0` at `t=3`, `1` at `t=5`, `easeOut`

**When** played in Chrome and in visionOS WebSpatial (≥ 1.8, element capability true)

**Then**

- From 0–3s: only translate changes; opacity stays `0`
- From 3–5s: both translate and opacity change
- At 5s: `translate.x === 100` and `opacity === 1`

**Demo route:** `/spatial-div-motion/multi-track` (Plan B). Plan A cannot reproduce overlap without sequential sessions; closest Plan A demo: `/spatial-div-animation/combined-delay` (sequential semantics only).

## Code reuse (implementation strategy)

| Layer | Plan A branch assets | Plan B approach |
| --- | --- | --- |
| Suppression, Portal sync | `PortalInstanceObject.setSuppressedFields` | **Reuse** when native backend active |
| Bridge / `animateSpatialDiv` | Existing command + events | **Extend** `play` payload with `timeline` |
| Native DisplayLink session | `SpatialDivAnimationSession` | **Evolve** evaluator to per-track keyframes |
| React session hook | `useSpatialDivAnimation` | Keep for Plan A demos; **do not** rename to Plan B |
| React motion hook | — | **New** `useSpatializedMotion` + Web backend |
| Tests | Session behavior tests | New motion tests + keep session tests for A |

**Not a full rewrite.** ~70% infrastructure reuse, ~30% new timeline evaluator + 100% new public DX.

## Non-functional

| Topic | Plan A | Plan B |
| --- | --- | --- |
| JSBridge traffic during play | Low (native interpolates) | Low on native backend; Web uses RAF locally |
| Spec / test surface | Smaller | Larger up front, less churn later |
| react-spring interop | Separate `style` spring (see `/animate`) | Motion Web backend similar ergonomics, SDK-owned |

## Recommendation

**Adopt Plan B** for new SpatialDiv animation if any of the following apply:

- Same JSX must run in **desktop/mobile Web** and spatial runtime
- Designers/engineers need **overlapping property timelines**
- Team wants **one source of truth** (`style`) for animated visual state

**Keep Plan A** only when:

- Scope is frozen to **single-segment** native-only POC already merging
- Team explicitly rejects timeline scope for v1

## Phased delivery on this branch

1. **Now:** OpenSpec + `useSpatializedMotion` Web backend + comparison pages (Plan B multi-track in browser)
2. **Next:** Native timeline evaluator + bridge schema; parity tests vs Web backend on spatial
3. **Later:** Product decision to deprecate `animation` prop / session hook or keep both documented
