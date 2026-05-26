## Why

Product intent for declarative spatial animation is **not limited to HTML SpatialDiv** (`Spatialized2DElement`). Authors expect the same **timeline + playback API** mental model across:

- **Spatialized2DElement** (2D panels / `enable-xr` divs)
- **SpatializedStatic3DElement** (`<Model>` — root transform + opacity)
- **Reality entities** under **SpatializedDynamic3DElement** (ECS transform)

The shipped **`spatial-div-motion-api`** change delivers **2D only**. This umbrella change defines the **full matrix** contract, capability gates, and phased delivery while reusing the 2D implementation as the reference.

**中文摘要:** [API.zh.md](./API.zh.md)  
**能力矩阵:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)  
**2D 实现（已交付）:** `openspec/changes/spatial-div-motion-api/`

## What Changes

- Add normative **`spatialized-element-motion`** umbrella capability with per-kind sub-specs.
- Introduce unified public names: `useSpatializedMotion`, `SpatializedMotionController`, `SpatializedMotionConfig`, `SpatializedPlaybackApi` (2D paths retain `useSpatialDivMotion` as thin aliases during proposal).
- **Phase 1 (this change):** API naming + `useSpatializedMotion({ kind })` router; scope labels on 2D-only shipped code.
- **Phase 2:** Static3D native timeline + `Model` `motion` binding.
- **Phase 3:** Entity `AnimateTransform` timeline payload + `useAnimation` / motion config alignment.
- Extend `supports('useAnimation', …)` documentation for `spatialized2d` | `static3d` | `entity` sub-tokens (implementation incremental).

## Capabilities

### New

- `spatialized-element-motion` — umbrella requirements and matrix.
- `spatialized-2d-motion` — references 2D delivery (see child change).
- `spatialized-static3d-motion` — Model root transform timeline (new).
- `spatialized-entity-motion` — Entity transform timeline (new).

### Modified

- `runtime-capabilities` — document sub-tokens for motion backends per element kind.

## Non-Goals (umbrella)

- Animating layout fields on 2D (`width`, `height`, `back`, `depth`).
- Replacing USD **clip** playback on Model (`ref.play()` / `pause()`) — remains separate from transform timeline (`motion.play()`).
- Material / variant animation on Static3D in v1 of static3d-motion.
- Full physics / spring simulation (easing + keyframes only).
