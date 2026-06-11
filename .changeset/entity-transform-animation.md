---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
---

Add entity transform animation API (`useAnimation` hook, `animation` prop, and native visionOS playback).

**Core SDK**
- New `AnimationConfig`, `AnimatedProps`, `AnimationApi`, `AnimationError`, and related types.
- `SpatialEntity.animateTransform()` sends a unified `AnimateTransform` JSB command with play/pause/resume/stop actions.
- `composeSRT` and `decomposeTransformMatrix` utilities exported for matrix round-trip.
- `supports('useAnimation')` capability key added (currently disabled; will be enabled when native shell ships support).

**React SDK**
- `useAnimation(config)` hook returns `[AnimatedProps, AnimationApi]` with declarative config validation, `autoStart`, `delay`, `loop` (including reverse), `timingFunction`, and lifecycle callbacks (`onStart`, `onComplete`, `onCancel`, `onError`).
- Entity components (`BoxEntity`, `SphereEntity`, etc.) accept an `animation` prop that binds animated transforms and suppresses competing ordinary transform updates for animated fields.
- Transform suppression logic ensures non-animated fields still update normally during an active animation session.

**visionOS native**
- `EntityAnimationManager` handles play/pause/resume/stop commands, builds `FromToByAnimation<Transform>` for RealityKit playback, and manages per-animation session state (idle/queued/delaying/running/paused).
- Delay timer preserves remaining time across pause/resume cycles.
- Completion, stop, and failure events are emitted back to JS via the SpatialWebEvent bridge.
- Animation sessions are cleaned up on page navigation and scene destruction.