# SpatializedElement motion — capability matrix

| Element kind | Core type | React surface | Target-state timeline | Web RAF fallback | Native object path | Capability token |
|--------------|-----------|---------------|-----------------------|------------------|--------------------|------------------|
| **2D** | `Spatialized2DElement` | `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation', ['element'])` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation', ['static3d'])` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation={…}>` · `useAnimation(config)` → `[animation, api, style]` | Target | **No** | `AnimationObject` via `SpatializedElement.createAnimation(config)` | `supports('useAnimation', ['dynamic3d'])` |

**Target-state note:** React uses a single opaque `AnimationProxy`; native playback uses `AnimationObject : SpatialObject` created through `SpatializedElement.createAnimation(config)`.

**Capability contract:** `supports('useAnimation')` is family-level only. Concrete runtime availability checks MUST use `supports('useAnimation', [subtoken])`.

**Out of scope (this change):** `SpatialEntity` transform timelines inside Reality — keep the current `useEntityAnimation` / `AnimateTransform` stack for entities. `supports('useAnimation', ['entity'])` remains the real capability sub-token for that path.

## Property whitelists (summary)

| Kind | Animatable paths (v1) |
|------|------------------------|
| 2D | `opacity`, `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` |
| Static3D | `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` applied to `modelTransform`; `opacity` MUST be rejected during validation |
| Dynamic3D | Same as 2D (applied to container `element.transform` + opacity) |

## Separate APIs (do not merge)

| API | Purpose |
|-----|---------|
| Model `ref.play()` / `pause()` | USD embedded animation clips |
| `api.play()` / timeline | Declarative transform / opacity timeline on the spatialized container; Static3D target supports model-root transform only |
