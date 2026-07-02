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
   - Remains as historical context only; the legacy public entrypoints and backend path are removed from the target-state API

2. **Plan B — Motion Timeline API** (`spatial-div-motion-api`, archived)
   - Introduced `useAnimation(config)` with multi-track timeline + `style` outlet
   - Dual backend: Web RAF fallback + native timeline playback
   - Renamed `animation` binding to `xr-animation` binding, and started returning `style` with defined `style` sync semantics

This **umbrella change** merges both into a single normative surface:
- The **timeline data model** from Plan B is the canonical config shape
- The **session semantics** from Plan A remain as historical reference material in the archived spec; the target-state API is the unified `xr-animation` motion path
- Coverage extends to Static3D and Dynamic3D (native-only, no Web RAF)
- The v1 recommended public authoring paths are `from`/`to` and `timeline`
- `tracks` remains the canonical internal execution model; current implementation and types still accept `tracks` as a compatibility / advanced escape hatch, but it is not the primary user-review path
- The legacy Plan A public path (`useAnimation` + `animation` prop) is removed from the target-state API

## At a Glance

```
// Unified spatialized animation API — hook is target-agnostic; target resolved at bind time
// Returned style is part of the host-state closure contract and must be merged back to the bound host
<div enable-xr style={{ width: 300, height: 200, ...style }} xr-animation={animation}>
  <h2>Hello Spatial</h2>
</div>

// Static3D — target auto-resolved to static3d when bound to <Model>
<Model src="robot.usdz" style={{ ...style }} xr-animation={animation} />

// Dynamic3D — target auto-resolved to dynamic3d when bound to <Reality>
<Reality style={{ ...style }} xr-animation={animation}>
  <Entity position={{ x: 0, y: 1, z: -2 }} />
</Reality>

// from/to config (recommended default, equivalent to Plan A from/to)
const [animation, api, style] = useAnimation({
  from: { transform: { translate: { y: 24 } }, opacity: 0 },
  to:   { transform: { translate: { y: 0 } }, opacity: 1 },
  duration: 0.6,
  timingFunction: 'easeOut',
})

// Entity transform animation keeps its own name and stack
const [animation, api] = useEntityAnimation({
  from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5,
})
// Entity remains outside this container-motion change. The current entry is
// useEntityAnimation(); long-term convergence back into the useAnimation
// family is possible, but not part of this PR.
```

## Target Resolution

The hook is **target-agnostic** — it does not accept a `kind` parameter. The returned `animation` binding carries a **deferred target slot**. When React reconciles and the component accepting `xr-animation={animation}` mounts, the SDK resolves the target automatically:

| Component | Resolved target | `style` behavior |
|-----------|-----------------|------------------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` | Merge/snapshot outlet; authors MUST merge it back to the bound host |
| `<Model>` | `static3d` | Host style-closure outlet; authors MUST merge it back to the bound host |
| `<Reality>` | `dynamic3d` | Host style-closure outlet; authors MUST merge it back to the bound host |

**Constraints:**
- A single `animation` binding MUST NOT be shared across multiple components simultaneously (1:1 binding).
- `api.play()` called before bind MAY queue; playback starts once the binding is resolved.
- Applications MUST merge the returned `style` onto the same host element or component that receives `xr-animation`. Omitting that merge MAY still allow playback to start, but terminal visual persistence after `stop()`, `reset()`, `finish()`, natural completion, or later resync is not guaranteed.

## What Changes

- **Unified public API**: v1 user-facing examples and guidance center on `useAnimation(config)` with `from/to` (recommended) or `timeline` (CSS `@keyframes` style). Internally both normalize into the canonical tracks model.
- **Timeline data model**: per-property tracks with absolute-time keyframes and per-track timingFunction remain the canonical internal config model. The current implementation and types still accept `tracks` input as a compatibility / advanced escape hatch.
- **Native-first runtime path**: all spatialized container kinds create a native `AnimationObject` through `SpatializedElement.createAnimation(config)`; pure Web runtime is capability-negative and does not start a RAF playback fallback.
- **Create-time timeline payload**: Core sends the compiled canonical `timeline` document through `CreateSpatializedElementAnimation`; timing controls such as `duration`, `timingFunction`, `delay`, `loop`, and `playbackRate` live inside that compiled payload rather than as top-level JSB fields.
- **2D style behavior**: 2D keeps a `style` outlet as the author-facing merge/snapshot outlet; applications MUST merge it back to the bound host to keep visual state closed across rerender and resync. It is not a pure-Web playback backend.
- **3D style behavior**: Static3D and Dynamic3D also treat the returned `style` as part of the host-state closure contract. Playback is still driven by the bound `xr-animation` handle, but applications MUST merge `style` back to the bound host to preserve terminal visual state across later rerender and resync.
- **One Core object path**: React `AnimationBinding` binds to at most one target and creates one Core `AnimationObject`; per-target controller aliases are not part of the target-state API.
- **Entity-specific API**: entity transform animation is named `useEntityAnimation(config)` and remains on the separate `AnimateTransform` stack.
- **Animating mask ownership**: native `SpatializedElement` runtime / write adapter owns animated fields during playback (property-level for opacity, transform-wide for transform), not React Portal suppression.
- **Session semantics**: state machine, lifecycle callbacks, error handling unified across all paths.
- **Controller surface**: `pause()` / `resume()` are whole-session operations only; selective pause/resume is intentionally out of scope for this change. If local control is needed later, it must be designed as a separate track/action-level API in a new proposal.
- **Legacy removal target**: the old `animation` prop path, legacy SpatialDiv session hook path, and the visionOS-specific legacy 2D backend path are removed from the target state; only the unified `xr-animation` motion path remains.
- **Capability detection**: runtime capability probes use the single `supports('useAnimation')` key for the released motion API. Target names such as `spatialized2d`, `static3d`, and `dynamic3d` remain internal binding-resolution kinds, not capability sub-tokens.
- **Timeline naming**: `timeline` is a single CSS `@keyframes`-style percentage-key object. It is not a sequential choreography primitive; v1 does not support `timeline: []`, multiple actions, or multi-stage orchestration semantics.

## PR 1236 Follow-up

PR 1236 exposed several module-design issues in the React motion surface after the
`useAnimation` rename landed:

- `useAnimation` and `useEntityAnimation` entrypoints still route through confusing file names and mixed export paths.
- React still duplicates some responsibilities that belong to Core, especially `autoStart` triggering and motion-kind bookkeeping.
- Binding lifecycle logic is repeated across SpatialDiv, Model, and Reality containers.
- The binding protocol still carries duplicated suppression accessors.

This follow-up keeps the public API unchanged but tightens the implementation
boundaries:

- `useAnimation` remains the default container-motion hook for SpatialDiv, Model, and Reality.
- `useEntityAnimation` remains entity-only.
- `useSpatializedMotion` is no longer treated as a primary concept or public routing name.
- React stays responsible for lifecycle wiring, target binding, tuple-shape-consistent `style` outlet, and container adaptation only.
- Core remains responsible for config normalization, validation, canonical timeline compilation, `AnimationObject` lifecycle, and bind-time auto-start behavior.

## Two-Phase Naming Migration

- **Phase 1**: rename the current public `useAnimation` export to `useEntityAnimation` and refactor entity-focused `test-server` pages first, so the `useAnimation` symbol is freed without breaking the in-repo demos.
- **Phase 2**: rename the spatialized motion hook to `useAnimation`, keep the target-agnostic timeline semantics unchanged, and refactor spatialized motion `test-server` pages to the new import and capability names.
- **Validation scope**: both phases require updating the relevant `test-server` pages and verifying the refactored pages still render and control playback correctly after the rename.

## Capabilities

### New

- `spatialized-element-motion` — umbrella requirements and per-kind matrix.
- `spatialized-2d-motion` — 2D timeline + native-first `AnimationObject` path.
- `spatialized-static3d-motion` — Model root transform timeline (native-only).
- `spatialized-dynamic3d-motion` — Reality container transform timeline (native-only).

### Modified

- `runtime-capabilities` — document `supports('useAnimation')` as the single motion API capability gate.

### Deferred

- `spatialized-entity-motion` — Entity transform timeline via `useEntityAnimation` (separate stack, outside the container `AnimationObject` path).

## Non-Goals

- Animating layout fields (`width`, `height`, `back`, `depth`) on any kind.
- Replacing USD clip playback on Model (`ref.play()` / `pause()`).
- Material / variant animation on Static3D in v1.
- Full physics / spring simulation (timingFunction + keyframes only).
- Arbitrary CSS transform string interpolation or matrix/skew/perspective.

## Impact

- **Packages**: `@webspatial/react-sdk`, `@webspatial/core-sdk`, visionOS native bridge/runtime.
- **Public API**: `useAnimation` for spatialized motion, `useEntityAnimation` for entity transforms, `SpatializedMotionConfig`, `SpatializedPlaybackApi`, and the `xr-animation` binding prop on `<Model>` and `<Reality>`.
- **Migration shape**: the rename lands in two phases so entity demos move first and spatialized motion demos move second; the legacy `animation` prop path is removed rather than preserved as a compatibility layer.
- **Capability contract**: `supports('useAnimation')` is the public capability gate for released container motion. `useAnimation` does not expose `element`, `static3d`, or `dynamic3d` target sub-tokens; the legacy `entity` sub-token remains reserved for `useEntityAnimation`.
- **Breaking changes**: yes; the current public `useAnimation` name moves to `useEntityAnimation`, and the current spatialized motion hook name moves to `useAnimation`.