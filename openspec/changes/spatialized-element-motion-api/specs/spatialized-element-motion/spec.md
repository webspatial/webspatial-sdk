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

### Requirement: Unified config accepts from/to or tracks (mutually exclusive)

The hook MUST accept a config that is one of two mutually exclusive shapes:

1. **Segment config** (recommended default): `{ from, to, duration, timingFunction? }`
2. **Timeline config** (advanced): `{ duration, tracks: [{ property, keyframes: [{ at, value }], easing? }] }`

Passing both `from`/`to` and `tracks` in the same config object MUST be a type error (discriminated union). Internally, segment config MUST compile to tracks (one track per animated scalar, keyframes at `at: 0` and `at: duration`).

All kinds MUST use visual transform paths (`transform.translate.*`, `opacity`, etc.) in both config shapes.

#### Scenario: from/to compiles to tracks

- **WHEN** authors pass `{ from: { opacity: 0 }, to: { opacity: 1 }, duration: 0.5 }`
- **THEN** the SDK MUST internally compile this to a single track `{ property: 'opacity', keyframes: [{ at: 0, value: 0 }, { at: 0.5, value: 1 }] }` before execution

#### Scenario: tracks config executes directly

- **WHEN** authors pass `{ duration, tracks: [...] }`
- **THEN** the SDK MUST execute the tracks directly without transformation

#### Scenario: Shared config shape is target-agnostic

- **WHEN** authors submit the same config (either from/to or tracks) and the resulting `animation` is bound to any of `<div enable-xr>`, `<Model>`, or `<Reality>`
- **THEN** validation MUST accept the same config structure before target-specific playback begins

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
