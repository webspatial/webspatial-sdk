# SpatializedElement motion — capability matrix

| Element kind | Core type | React surface | Shipped timeline | Web RAF fallback | Native backend | Capability token |
|--------------|-----------|---------------|------------------|------------------|----------------|------------------|
| **2D** | `Spatialized2DElement` | `useSpatializedMotion({ kind: 'spatialized2d' })` · alias `useSpatialDivMotion` | Yes | Yes | `SpatialDivAnimationManager` | `supports('useAnimation', ['element'])` |
| **Static3D** | `SpatializedStatic3DElement` | `<Model motion={…}>` · `useSpatializedMotion({ kind: 'static3d' })` | Yes | **No** | `Static3DMotionAnimationManager` | `supports('useAnimation', ['static3d'])` |
| **Dynamic3D** | `SpatializedDynamic3DElement` | `<Reality motion={…}>` · `useSpatializedMotion({ kind: 'dynamic3d' })` | Yes | **No** | `Dynamic3DMotionAnimationManager` | `supports('useAnimation', ['dynamic3d'])` |

**Implementation note:** TypeScript uses a **single** `SpatializedMotionController` for all three kinds; native remains three managers until a future Swift consolidation.

**Out of scope (this change):** `SpatialEntity` transform timelines inside Reality — keep existing `useAnimation` / `AnimateTransform` for entities.

## Property whitelists (summary)

| Kind | Animatable paths (v1) |
|------|------------------------|
| 2D | `opacity`, `transform.translate.*`, `transform.rotate.*`, `transform.scale.*` |
| Static3D | Same as 2D (applied to `modelTransform`) |
| Dynamic3D | Same as 2D (applied to container `element.transform` + opacity) |

## Separate APIs (do not merge)

| API | Purpose |
|-----|---------|
| Model `ref.play()` / `pause()` | USD embedded animation clips |
| `motion.play()` / timeline | Declarative transform / opacity timeline on the spatialized container |
