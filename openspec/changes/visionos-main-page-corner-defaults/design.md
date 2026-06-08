## Context

The visionOS host currently stores the main-page scene corner radius directly on `SpatialScene.cornerRadius`, with the model defaulting to zero unless the frontend explicitly sends `UpdateSpatialSceneProperties.cornerRadius`. Product behavior, however, expects the host window to start with rounded corners when the main page uses a non-transparent material and to remain square when the page is transparent.

This creates the same kind of gap that the Android Runtime/Template bridge recently addressed: the SDK needs a host-owned initial effective corner rule that exists before explicit page-corner updates arrive.

## Goals / Non-Goals

**Goals:**

- Derive the main-page host window's initial effective corner radius from background material.
- Use `44` for non-transparent main-page material and `0` for transparent material.
- Preserve explicit `cornerRadius` updates as higher priority than derived defaults.
- Keep the change scoped to visionOS main-page scene behavior.

**Non-Goals:**

- Changing `Spatialized2DElement` / SpatialDiv corner-radius defaults.
- Introducing a cross-platform shared host-corner abstraction across visionOS and Android in this change.
- Reworking `MaterialWithBorderCornerModifier` rendering semantics beyond feeding it the correct main-page corner radius.

## Decisions

### Derive an effective main-page corner radius inside `SpatialScene`

- Decision: Track whether the main page has received an explicit scene `cornerRadius`, and otherwise derive the scene corner from the current background material.
- Why: `SpatialScene` already sees both `UpdateSpatialSceneProperties.material` and `UpdateSpatialSceneProperties.cornerRadius`, so it is the narrowest layer that can resolve priority without adding another bridge or host object.
- Alternative considered: hardcoding `cornerRadius = 44` at initialization only. Rejected because later material changes would leave the scene in a stale default state until a separate explicit corner update arrives.

### Treat transparent material as the only zero-corner default case

- Decision: Use `0` only when the effective scene material is transparent; all other main-page materials use `44`.
- Why: This matches the native behavior you confirmed and keeps the rule simple enough to reason about during load, reset, and later material changes.
- Alternative considered: special-casing only `.None`. Rejected because the product rule is transparent vs non-transparent, not one specific material enum value.

### Reset explicit-corner ownership on page reload

- Decision: Clear explicit scene-corner override state when a new page load starts, then re-derive the default corner for the fresh page.
- Why: Page reload should return the host window to its native initial state until the new page explicitly sets a corner radius again.
- Alternative considered: preserving the previous page's explicit corner across reloads. Rejected because it leaks stale host styling across page generations.

## Risks / Trade-offs

- [Risk] Material updates may arrive before or after explicit corner updates in different orders. → Mitigation: keep a dedicated explicit-corner override state and recompute only when no explicit override is present.
- [Risk] Volume scenes already normalize background transparency differently from window scenes. → Mitigation: derive the default using the effective scene material semantics rather than only the raw stored enum.
- [Risk] Existing preview/probe code in `SpatialSceneContentView.swift` could distract from the host-corner behavior under test. → Mitigation: keep implementation changes inside `SpatialScene` and leave view-layer instrumentation as optional debugging aid.

## Migration Plan

1. Add the material-derived default-corner logic to `SpatialScene`.
2. Reset explicit-corner ownership during page-start reload.
3. Verify that main-page scenes default to `44` for non-transparent material and `0` for transparent material before explicit overrides.
4. Verify that explicit `cornerRadius` updates still win after initialization.

## Open Questions

- Whether the `44` default should remain a visionOS-local constant or be surfaced later through shared configuration is deferred.
- Whether we want a dedicated visionOS regression page for main-page material/corner combinations is deferred; this change only needs the runtime behavior to be correct.
