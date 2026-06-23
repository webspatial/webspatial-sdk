# Spatialized element motion

## ADDED Requirements

### Requirement: Declarative motion with bind-time target resolution

The platform MUST provide declarative timeline motion for `spatialized2d`, `static3d`, and `dynamic3d`. The hook MUST NOT require `config.kind`; target resolves via `xr-animation`:

| Component | Target | Native write |
|-----------|--------|--------------|
| `<div enable-xr>` | `spatialized2d` | `element.transform` + `opacity` |
| `<Model>` | `static3d` | `modelTransform` (no opacity sink) |
| `<Reality>` | `dynamic3d` | container `element.transform` + `opacity` |

Capability: `supports('useAnimation', ['element'|'static3d'|'dynamic3d'])` — native runtime only. Pure web MUST NOT support `useAnimation`.

### Requirement: AnimationObject created by SpatializedElement

`createAnimation(config)` → `CreateSpatializedElementAnimation` → native `AnimationObject : SpatialObject` → Core handle with native uuid.

Timeline locked at create as canonical `tracks`; control commands carry no timeline. Config change: `destroy()` then `createAnimation`.

### Requirement: AnimationObject lifecycle

`destroy()` via `DestroyCommand`. Whole-session `play` / `pause` / `resume` / `stop` / `reset` / `finish`. Terminal callbacks mutually exclusive.

### Requirement: Native state and WebMsg

`SpatialAnimationStateChanged` is sole playState source. JSB: Create + Control; not `AnimateSpatializedElementMotion`.

### Requirement: Element animating mask

Ignore conflicting transform JSB while animating; no `PortalInstanceObject` coupling.

### Requirement: React bind and Proxy

`useAnimation` → `[animation, api, style]`; `AnimationProxy` queues pre-bind API; destroy + recreate on config change.

### Requirement: Authoring and validation

Mutually exclusive `from/to`, `timeline`, or `tracks`. Whitelist transform + opacity only; reject layout fields; Static3D rejects opacity tracks.

### Requirement: Model clip stays separate

USD `ref.play()` independent from `AnimationObject` timeline.
