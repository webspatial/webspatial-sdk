# SpatializedElement motion (umbrella)

## ADDED Requirements

### Requirement: Umbrella defines per-kind declarative motion

The platform MUST document and implement declarative timeline motion for these kinds: `spatialized2d`, `static3d`, and `dynamic3d`. Each kind MUST have a sub-spec defining property whitelists, native backend, and React integration. `SpatialEntity` transform timelines are out of scope for this umbrella (use existing `useAnimation`).

#### Scenario: Capability matrix is normative

- **WHEN** a product owner reviews motion support
- **THEN** [CAPABILITY_MATRIX.md](../../CAPABILITY_MATRIX.md) MUST list each kind with shipped vs planned status

### Requirement: Shared playback API shape

All kinds that support declarative motion MUST expose `SpatializedPlaybackApi` (`play`, `pause`, `resume`, `cancel`, `playState`, `isAnimating`, `isPaused`, `finished`). Kinds MAY support selective `pause(keys?)` where the backend allows.

### Requirement: Timeline config shape

All kinds MUST accept a shared timeline structure: global `duration` + `tracks[]` with `property`, `keyframes[{ at, value }]`, optional per-track `easing`. 2D, Static3D, and Dynamic3D MUST use visual transform paths (`transform.translate.*`, `opacity`, etc.).

### Requirement: Single Core controller implementation

The SDK MUST implement container motion with one `SpatializedMotionController` class parameterized by `SpatializedMotionKind`. Per-kind public class names (`SpatialDivMotionController`, `Static3DMotionController`, `Dynamic3DMotionController`) MAY remain as thin aliases for backward compatibility.

#### Scenario: React single hook

- **WHEN** authors call `useSpatializedMotion({ kind, … })`
- **THEN** the SDK MUST route to the same controller implementation with the matching kind policy

### Requirement: Separate clip playback on Model

USD embedded animation on `SpatializedStatic3DElement` (`play`/`pause` on model ref) MUST remain a separate API from transform timeline `motion.play()`.
