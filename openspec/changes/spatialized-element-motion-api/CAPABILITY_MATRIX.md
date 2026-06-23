# Spatialized element motion — capability matrix

| Element kind | Core type | React surface | Timeline | Web support | Native backend | Capability token |
|--------------|-----------|---------------|----------|-------------|----------------|------------------|
| **2D** | `Spatialized2DElement` | `useAnimation` → `[animation, api, style]` + `xr-animation` | Yes | **No** | `AnimationObject` + `SpatializedElementMotionManager` | `supports('useAnimation', ['element'])` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model xr-animation>` + `useAnimation` | Yes | **No** | same | `supports('useAnimation', ['static3d'])` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality xr-animation>` + `useAnimation` | Yes | **No** | same | `supports('useAnimation', ['dynamic3d'])` |

**Object model:** `SpatializedElement.createAnimation(config)` → native `AnimationObject : SpatialObject` (uuid from native). Timeline locked at create. Control via `ControlSpatializedElementAnimation`. State via `SpatialAnimationStateChanged` WebMsg.

**Capability:** `supports('useAnimation', [subtoken])` is true only on native spatial runtime.

## Property whitelist (v1)

| Kind | Animatable paths |
|------|------------------|
| 2D | `opacity`, `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` |
| Static3D | `transform.*` → `modelTransform`; no opacity sink |
| Dynamic3D | same as 2D on container `element.transform` + opacity |

## Separate APIs

| API | Purpose |
|-----|---------|
| Model `ref.play()` / `pause()` | USD embedded clips |
| `AnimationObject.play()` | Declarative container timeline |
