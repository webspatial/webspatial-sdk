# SpatializedElement motion — capability matrix

| Element kind | Core type | React surface | Target-state timeline | Web RAF fallback | Native object path | Capability token |
|--------------|-----------|---------------|-----------------------|------------------|--------------------|------------------|
| **2D** | `Spatialized2DElement` | `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation')` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation')` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation')` |

**Target-state note:** React uses a single opaque `AnimationProxy`; native playback uses `AnimationObject : SpatialObject` created through `SpatializedElement.createAnimation(config)`.

**Capability contract:** `supports('useAnimation')` is the released container-motion capability gate. `useAnimation` does not expose target-specific `element`, `static3d`, or `dynamic3d` sub-tokens; the legacy `entity` sub-token remains reserved for `useEntityAnimation`.

**Out of scope (this change):** `SpatialEntity` transform timelines inside Reality — keep the current `useEntityAnimation` / `AnimateTransform` stack for entities. That path uses the same `supports('useAnimation')` gate.

## Property whitelists (summary)

| Kind | Animatable paths (v1) |
|------|------------------------|
| 2D | `opacity`, `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` |
| Static3D | `opacity`, `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` applied to container-root `transform` + opacity |
| Dynamic3D | Same as 2D (applied to container `element.transform` + opacity) |

## Separate APIs (do not merge)

| API | Purpose |
|-----|---------|
| Model `ref.play()` / `pause()` | USD embedded animation clips |
| `api.play()` / timeline | Declarative transform / opacity timeline on the spatialized container; Static3D target supports container-root transform and opacity, not model-internal `entityTransform` / `modelTransform` |
