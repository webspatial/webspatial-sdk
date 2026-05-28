# SpatializedElement motion (umbrella)

## ADDED Requirements

### Requirement: Umbrella defines declarative motion with bind-time target resolution

The platform MUST document and implement declarative timeline motion for these targets: `spatialized2d`, `static3d`, and `dynamic3d`. Each target MUST have a sub-spec defining property whitelists, native backend, and React integration. The public hook MUST NOT require `config.kind`; the target is resolved automatically when the returned `animation` binding is passed as `motion` prop to a component (`<div enable-xr>` → spatialized2d, `<Model>` → static3d, `<Reality>` → dynamic3d). `SpatialEntity` transform timelines are out of scope for this umbrella (use existing `useAnimation`).

#### Scenario: Capability matrix is normative

- **WHEN** a product owner reviews motion support
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST list each kind with shipped vs planned status

### Requirement: Shared playback API shape

All kinds that support declarative motion MUST expose `SpatializedPlaybackApi` (`play`, `pause`, `resume`, `cancel`, `playState`, `isAnimating`, `isPaused`, `finished`). Kinds MAY support selective `pause(keys?)` where the backend allows.

#### Scenario: Playback API is available regardless of binding target

- **WHEN** authors obtain a motion tuple from `useSpatializedMotion(config)`
- **THEN** the returned `api` MUST expose `play`, `pause`, `resume`, `cancel`, `playState`, `isAnimating`, `isPaused`, and `finished` regardless of which component the `animation` is later bound to

### Requirement: Timeline config shape

All kinds MUST accept a shared timeline structure: global `duration` + `tracks[]` with `property`, `keyframes[{ at, value }]`, optional per-track `easing`. 2D, Static3D, and Dynamic3D MUST use visual transform paths (`transform.translate.*`, `opacity`, etc.).

#### Scenario: Shared timeline shape is target-agnostic

- **WHEN** authors submit the same `tracks[]` payload and the resulting `animation` is bound to any of `<div enable-xr>`, `<Model>`, or `<Reality>`
- **THEN** validation MUST accept the same timeline structure before target-specific playback begins

### Requirement: Single Core controller implementation

The SDK MUST implement container motion with one `SpatializedMotionController` class parameterized by the binding target (resolved when `animation` is mounted on a component). Per-target controller class aliases MUST NOT be part of the public API.

#### Scenario: React single hook with bind-time resolution

- **WHEN** authors call `useSpatializedMotion(config)` and pass `animation` to a component via `motion` prop
- **THEN** the SDK MUST resolve the target from the component type and route to the same controller implementation with the matching target policy

### Requirement: Separate clip playback on Model

USD embedded animation on `SpatializedStatic3DElement` (`play`/`pause` on model ref) MUST remain a separate API from transform timeline `motion.play()`.

#### Scenario: Model clip playback does not consume motion api

- **WHEN** authors call `ref.play()` on a `<Model>`
- **THEN** the motion tuple API MUST remain independent and MUST NOT be implied by the clip playback call

### Requirement: Target resolved at bind time

The public hook `useSpatializedMotion(config)` MUST NOT require a `kind` field in config. The returned `animation` binding MUST carry a deferred target. Target resolution MUST occur when the binding is passed as `motion` prop to a component:

| Component | Resolved target |
|-----------|-----------------|
| `<div enable-xr>` / `<SpatialDiv>` | `spatialized2d` |
| `<Model>` | `static3d` |
| `<Reality>` | `dynamic3d` |

#### Scenario: Binding to enable-xr resolves 2D

- **WHEN** `animation` from `useSpatializedMotion(config)` is passed as `motion` to `<div enable-xr>`
- **THEN** the SDK MUST resolve target to `spatialized2d` and activate the 2D policy (Web RAF + native)

#### Scenario: Binding to Model resolves static3d

- **WHEN** `animation` is passed as `motion` to `<Model>`
- **THEN** the SDK MUST resolve target to `static3d` and activate native-only policy

#### Scenario: Binding to Reality resolves dynamic3d

- **WHEN** `animation` is passed as `motion` to `<Reality>`
- **THEN** the SDK MUST resolve target to `dynamic3d` and activate native-only policy

#### Scenario: Single binding constraint

- **WHEN** the same `animation` binding is passed to more than one component simultaneously
- **THEN** the SDK MUST throw or warn and only the first bind MUST take effect

#### Scenario: Pre-bind playback queuing

- **WHEN** `api.play()` is called before `animation` is bound to any component
- **THEN** the play command MUST be queued and executed once the target is resolved
