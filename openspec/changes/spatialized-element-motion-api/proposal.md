## Why

Product intent for declarative spatial animation is **not limited to HTML SpatialDiv** (`Spatialized2DElement`). Authors expect the same **timeline + playback API** mental model across:

- **Spatialized2DElement** (2D panels / `enable-xr` divs)
- **SpatializedStatic3DElement** (`<Model>` — root transform + opacity)
- **SpatializedDynamic3DElement** (`<Reality>` container — root transform + opacity)

The shipped **`spatial-div-motion-api`** change delivers **2D only**. This umbrella change defines the **full matrix** contract, capability gates, and delivery while reusing the 2D evaluator as the reference.

**中文摘要:** [API.zh.md](./API.zh.md)  
**能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)  
**2D 实现（已交付）:** `openspec/changes/spatial-div-motion-api/`

## What Changes

- Add normative **`spatialized-element-motion`** umbrella capability with per-kind sub-specs.
- Unified public API: `useSpatializedMotion`, `SpatializedMotionController`, `SpatializedMotionConfig`, `SpatializedPlaybackApi`.
- **Static3D + Dynamic3D** native timelines + React `motion` bindings (native-only, no Web RAF).
- **Implementation consolidation:** one `SpatializedMotionController` + shared React hook internals; per-kind class/hook names kept as deprecated aliases.
- Extend `supports('useAnimation', …)` for `element` | `static3d` | `dynamic3d` sub-tokens.

## Capabilities

### New

- `spatialized-element-motion` — umbrella requirements and matrix.
- `spatialized-2d-motion` — references 2D delivery (see child change).
- `spatialized-static3d-motion` — Model root transform timeline.
- `spatialized-dynamic3d-motion` — Reality container transform timeline.

### Modified

- `runtime-capabilities` — document sub-tokens for motion backends per element kind.

### Deferred (not this umbrella)

- `spatialized-entity-motion` — Entity transform timeline via `useAnimation` (separate from container motion).

## Non-Goals (umbrella)

- Animating layout fields on 2D (`width`, `height`, `back`, `depth`).
- Replacing USD **clip** playback on Model (`ref.play()` / `pause()`) — remains separate from transform timeline (`motion.play()`).
- Material / variant animation on Static3D in v1.
- Full physics / spring simulation (easing + keyframes only).
- Merging native Swift into a single manager in this change (optional follow-up).
