---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
---

Add built-in animation clip playback for `ModelEntity` (clip discovery, per-instance play/pause/seek/rate control, and runtime state).

**Core SDK**

- New `ModelAnimationClipData`, `PlayModelAnimationOptions`, `ModelAnimationControlType`, `ModelAnimationController`, and `CreateModelAssetReplyData` types.
- `SpatialModelAsset` stores the `animations` clip catalog reported by the native `CreateModelAsset` reply (empty on old runtimes).
- `SpatialModelEntity` implements `ModelAnimationController`: `play(clip?, { loop, playbackRate })`, `pause()`, `seek(time)`, `setPlaybackRate(rate)`, plus `currentClip` / `currentTime` / `duration` / `paused` / `playbackRate` state with local extrapolation between native samples.
- New `ControlModelEntityAnimation` JSB command; `animationstatechange` events now route to model entities and carry an optional `clipId`.

**React SDK**

- `<ModelAsset onLoad>` now receives `{ animations: ModelAnimationClip[] }` (no-argument callbacks remain assignable).
- `<ModelEntity>` refs are typed `ModelEntityRef` and expose a `modelAnimation` controller delegating to the core entity.
- New public types: `ModelAnimationClip`, `PlayModelAnimationOptions`, `ModelAnimationController`, `ModelAssetLoadEvent`, `ModelEntityRef`.

**visionOS native**

- `SpatialModelResource` extracts embedded animation clips (stable `clip_N` ids, name, duration) after load and returns them in the `CreateModelAsset` reply.
- `SpatialModelEntity` drives one `AnimationPlaybackController` per cloned instance (play/resume/pause/seek/speed, infinite repeat for looping) and streams `animationstatechange` samples at 10 Hz.
- New `ControlModelEntityAnimation` JSB command handler registered on `SpatialScene`.
