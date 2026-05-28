# Legacy Session Animation (Plan A compatibility)

## ADDED Requirements

### Requirement: Legacy session animation remains compatible

The legacy `useAnimation(config)` + `animation` prop path MUST remain compatible for existing `Spatialized2DElement` integrations while the unified motion API is adopted.

#### Scenario: Existing SpatialDiv animation stays valid

- **WHEN** an application continues using `useAnimation` with an `animation` prop on `enable-xr`
- **THEN** the legacy session semantics and portal suppression MUST continue to work as before

## Status

**Superseded** by `useSpatializedMotion` (timeline API). Retained for backward compatibility with existing `useAnimation` + `animation` prop integrations on `Spatialized2DElement`.

## Scope

This sub-spec documents the **Plan A session-based animation API** (`useAnimation(config)` + `animation` prop) as a compatibility layer within the unified spatialized element motion system. New integrations SHOULD use `useSpatializedMotion`.

## Relationship to Current Architecture

| Aspect | Legacy (Plan A) | Current (Plan B / unified) |
|--------|-----------------|---------------------------|
| Hook | `useAnimation(config)` | `useSpatializedMotion(config)` |
| Binding | `animation` prop on `enable-xr` node | `style` merge + optional `motion` binding |
| Config shape | `from` / `to` single segment | `tracks[]` with keyframes (or `.simple()` sugar) |
| Playback backend | Native only | Web RAF + native (dual backend) |
| Supported kinds | `spatialized2d` only | `spatialized2d`, `static3d`, `dynamic3d` |
| Capability token | `supports('useAnimation', ['element'])` | `supports('useSpatializedMotion', [kind])` |

## RETAINED Requirements

The following requirements from the original `spatial-div-animation-api` spec remain normative for the legacy path:

### Requirement: Legacy useAnimation hook returns [animation, api]

When application code calls `useAnimation(config)` for SpatialDiv, the hook MUST return `[animation, api]` where `api` exposes `play`, `pause`, `cancel`, `isAnimating`, `isPaused`, `finished`, and `playState`.

### Requirement: animation prop binds to SpatialDiv only

The `animation` object MUST be passed to an `enable-xr` HTML node. Binding to a non-spatialized node MUST emit a warning and `play()` MUST be a no-op. The same `animation` object MUST NOT be reused across elements.

### Requirement: Whitelisted properties (same as unified)

Legacy animation supports the same visual-only whitelist: `transform.translate.x/y/z`, `transform.rotate.x/y/z`, `transform.scale.x/y/z`, and `opacity`. Layout-affecting fields MUST be rejected.

### Requirement: Session state machine

Session states (`idle`, `queued`, `delaying`, `running`, `paused`, `finished`) and `isAnimating`/`isPaused`/`finished`/`playState` semantics MUST match the unified spec. See the archived `spatial-div-animation/spec.md` for complete scenario coverage.

### Requirement: Imperative playback and lifecycle

`play`, `pause`, `cancel`, and lifecycle callbacks (`onStart`, `onComplete`, `onCancel`, `onError`) MUST follow the same semantics documented in the archived spec.

### Requirement: Portal suppression during playback

Property-level suppression for `opacity` and transform-wide suppression MUST prevent regular DOM sync from overwriting animation mid-states. Suppression release timing and `cancel` restoring to `from` are unchanged.

### Requirement: Unmount cleanup

Alive sessions MUST be stopped/canceled on unmount without firing lifecycle callbacks.

## Segment Downgrade (interop with timeline API)

When a `useSpatializedMotion.simple()` config has exactly two keyframes per property at `at: 0` and `at: duration` with one shared easing, the SDK MAY compile it to a legacy segment `play` command (`from`/`to`) for native playback. This is an internal optimization; the public API is `useSpatializedMotion`.

## Deprecation Path

- `useAnimation` for SpatialDiv remains functional but documentation SHOULD direct authors to `useSpatializedMotion`.
- The `animation` prop on `enable-xr` nodes remains recognized but is not required for the motion path.
- Future major versions MAY remove the legacy path entirely.

## Cross-references

- Full archived spec: `openspec/changes/archive/spatial-div-animation-api/specs/spatial-div-animation/spec.md`
- Feasibility study: `references/feasibility-visionOS.md`
- Feasibility analysis: `references/feasibility-visionOS-analysis.md`
