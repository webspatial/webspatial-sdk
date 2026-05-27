## Why

Product intent for declarative spatial animation is **not limited to HTML SpatialDiv** (`Spatialized2DElement`). Authors expect the same **timeline + playback API** mental model across:

- **Spatialized2DElement** (2D panels / `enable-xr` divs)
- **SpatializedStatic3DElement** (`<Model>` — root transform + opacity)
- **SpatializedDynamic3DElement** (`<Reality>` container — root transform + opacity)

### Historical Context

This proposal unifies two prior efforts:

1. **Plan A — Session Animation API** (`spatial-div-animation-api`, archived)
   - Introduced `useAnimation(config)` + `animation` prop for SpatialDiv
   - Single `from`/`to` segment, native-only playback
   - Established: property whitelist, session state machine, Portal suppression, lifecycle callbacks
   - Retained as a backward-compatible sub-path (see `specs/legacy-session-animation/`)

2. **Plan B — Motion Timeline API** (`spatial-div-motion-api`, archived)
   - Introduced `useSpatializedMotion(config)` with multi-track timeline + `style` outlet
   - Dual backend: Web RAF fallback + native timeline playback
   - Decoupled from `animation` prop via `motion` binding

This **umbrella change** merges both into a single normative surface:
- The **timeline data model** from Plan B is the canonical config shape
- The **session semantics** (state machine, suppression, lifecycle) from Plan A remain normative
- Coverage extends to Static3D and Dynamic3D (native-only, no Web RAF)

## At a Glance

```tsx
// Unified API (recommended)
const { style, api, motion } = useSpatializedMotion({
  kind: 'spatialized2d',
  duration: 5,
  tracks: [
    { property: 'transform.translate.x', keyframes: [{ at: 0, value: 0 }, { at: 5, value: 100 }], easing: 'linear' },
    { property: 'opacity', keyframes: [{ at: 3, value: 0 }, { at: 5, value: 1 }], easing: 'easeOut' },
  ],
})

<div enable-xr style={{ width: 300, height: 200, ...style }} motion={motion}>
  <h2>Hello Spatial</h2>
</div>

// Simple sugar (single segment, equivalent to Plan A from/to)
const { style, api, motion } = useSpatializedMotion.simple({
  kind: 'spatialized2d',
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// Legacy Plan A (still functional, deprecated for new code)
const [animation, api] = useAnimation({
  from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5,
})
<div enable-xr animation={animation} />
```

## What Changes

- **Unified public API**: `useSpatializedMotion({ kind, duration, tracks })` and `.simple()` sugar for all three container kinds.
- **Timeline data model**: per-property tracks with absolute-time keyframes, per-track easing — the canonical config shape.
- **Dual backend for 2D**: Web RAF when native unavailable; native timeline/segment when in WebSpatial runtime.
- **Native-only for 3D**: Static3D and Dynamic3D use native `animateMotion` exclusively (no Web RAF fallback).
- **One Core controller**: `SpatializedMotionController` with `MOTION_KIND_POLICIES` per kind.
- **Legacy compatibility**: Plan A `useAnimation` + `animation` prop retained for SpatialDiv; segment downgrade path for simple timelines.
- **Portal suppression**: animated fields suppressed during native playback (property-level for opacity, transform-wide for transform).
- **Session semantics**: state machine, lifecycle callbacks, error handling unified across all paths.
- **Capability detection**: `supports('useSpatializedMotion', [kind])` for `spatialized2d` | `static3d` | `dynamic3d`.

## Capabilities

### New

- `spatialized-element-motion` — umbrella requirements and per-kind matrix.
- `spatialized-2d-motion` — 2D timeline + dual backend (reference implementation).
- `spatialized-static3d-motion` — Model root transform timeline (native-only).
- `spatialized-dynamic3d-motion` — Reality container transform timeline (native-only).

### Modified

- `runtime-capabilities` — document sub-tokens for motion backends per element kind.

### Retained (legacy)

- `spatial-div-animation` — Plan A session API for SpatialDiv (backward compatible, deprecated for new code).

### Deferred

- `spatialized-entity-motion` — Entity transform timeline via `useAnimation` (separate stack, not `SpatializedMotionController`).

## Non-Goals

- Animating layout fields (`width`, `height`, `back`, `depth`) on any kind.
- Replacing USD clip playback on Model (`ref.play()` / `pause()`).
- Material / variant animation on Static3D in v1.
- Full physics / spring simulation (easing + keyframes only).
- Arbitrary CSS transform string interpolation or matrix/skew/perspective.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, visionOS native bridge/runtime.
- **Public API**: `useSpatializedMotion` hook, `SpatializedMotionConfig`, `SpatializedPlaybackApi`, `motion` binding prop on `<Model>` and `<Reality>`.
- **Legacy API**: `useAnimation` for SpatialDiv remains functional (no breaking change).
- **Breaking changes**: None. This change is additive.
