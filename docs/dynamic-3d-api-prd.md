# Dynamic 3D API — Spec


---

## 1. Three ways to add 3D content

| Approach | Component / API | Use case |
|----------|-----------------|----------|
| **Reality** | `<Reality>` + scene graph | 3D canvas: shapes (primitives) and model instances; like `<canvas>` but for 3D |
| **Model (static)** | `<Model enable-xr src="…">` | Drop-in 3D model file; like `<img>` for 3D |
| **Spatial HTML** | HTML + `enable-xr` | Regular HTML that floats in space |

This doc focuses on **Reality** and the **Dynamic 3D** path (primitives, `ModelAsset` / `ModelEntity`, materials).

---

## 2. Imports

```ts
import {
  Reality,
  SceneGraph,
  Entity,
  BoxEntity,
  SphereEntity,
  PlaneEntity,
  ConeEntity,
  CylinderEntity,
  ModelEntity,
  UnlitMaterial,
  ModelAsset,
} from '@webspatial/react-sdk';
```

---

## 3. Concepts

- **Reality** — A 3D viewport (window into 3D space). One per container. Hosts a **resource registry** (materials, model assets) and a **scene graph** (entities). Rendered as a `div`; size with `style` / CSS.
- **SceneGraph** — Root of the 3D scene tree. All **entities** (primitives, model instances, groups) must be descendants of `<SceneGraph>`.
- **Entity** — Empty transform group; groups children. Has `position`, `rotation`, `scale`. Moving the entity moves all descendants.
- **Primitive entities** — `BoxEntity`, `SphereEntity`, `PlaneEntity`, `ConeEntity`, `CylinderEntity`. Geometry + material(s). Share `EntityProps` and spatial event handlers.
- **ModelAsset** — Loaded 3D model resource (e.g. USDZ). Declared by `id` and `src`. Invisible by itself; referenced by **ModelEntity**.
- **ModelEntity** — Instance of a **ModelAsset** in the scene. Same asset can be instanced many times (e.g. one ship model, many ships).
- **UnlitMaterial** — Material resource (color, optional transparency). Declared by `id`; referenced by `materials={['id']}` on primitives or `ModelEntity`.

**Order inside `<Reality>`:** declare **materials** and **assets** first, then **`<SceneGraph>`** and its content. Resources are resolved by `id` when entities mount.

---

## 4. Basic structure

```tsx
<Reality style={{ width: '500px', height: '500px', '--xr-depth': 100 }}>
  {/* 1. Materials (by id) */}
  <UnlitMaterial id="red" color="#ff0000" />
  <UnlitMaterial id="glass" color="#0000ff" transparent opacity={0.5} />

  {/* 2. Model assets (by id) — optional */}
  <ModelAsset id="teapot" src="https://example.com/model.usdz" />

  {/* 3. Scene: entities only */}
  <SceneGraph>
    <BoxEntity materials={['red']} width={0.2} height={0.2} depth={0.2} />
    <ModelEntity model="teapot" position={{ x: 0, y: 0.2, z: 0 }} />
  </SceneGraph>
</Reality>
```

- **Reality** accepts standard `div` props (e.g. `style`, `className`). Use CSS custom properties for depth: `--xr-depth` (see spatialized container docs).
- **SceneGraph** has no props; it only defines the scene root.

---

## 5. Reality

- **Role:** Creates the 3D canvas and resource registries; children (materials, assets, `<SceneGraph>`) render only after the reality is ready.
- **Layout:** Position and size like any `div` (e.g. `style={{ width, height }}`).
- **Restriction:** Cannot nest `<Reality>` inside `AttachmentAsset`.

---

## 6. Entity (group container)

```tsx
<Entity position={{ x: 0, y: 0, z: 0 }} rotation={{ x: 0, y: Math.PI / 2, z: 0 }}>
  <BoxEntity materials={['red']} width={0.1} height={0.1} depth={0.1} />
  <BoxEntity materials={['blue']} width={0.1} height={0.1} depth={0.1}
    position={{ x: 0.15, y: 0, z: 0 }} />
</Entity>
```

- **Props:** `id?`, `name?`, `position?`, `rotation?`, `scale?`, spatial event handlers (see §11).
- **Children:** Any entity (primitives, `ModelEntity`, nested `Entity`). Transforms are relative to the parent.

---

## 7. Primitive entities

All use **meters** for size/distance. **Rotation** in **radians**.

### 7.1 BoxEntity

- **Props:** `width`, `height`, `depth`, `cornerRadius?`, `splitFaces?`, `materials`, `position?`, `rotation?`, `scale?`, event handlers.
- **splitFaces:** When `true`, `materials` is `[front, back, top, bottom, left, right]` (six material ids).

```tsx
<BoxEntity
  width={0.2} height={0.2} depth={0.2}
  materials={['red']}
  position={{ x: 0, y: 0, z: 0 }}
  rotation={{ x: 0, y: 0, z: 0 }}
  cornerRadius={0.01}
/>
```

### 7.2 SphereEntity

- **Props:** `radius`, `materials`, transform and event props.

```tsx
<SphereEntity radius={0.1} materials={['red']} />
```

### 7.3 PlaneEntity

- **Props:** `width`, `height`, `cornerRadius?`, `materials`, transform and event props.

### 7.4 ConeEntity

- **Props:** `radius`, `height`, `materials`, transform and event props.

### 7.5 CylinderEntity

- **Props:** `radius`, `height`, `materials`, transform and event props.

---

## 8. 3D models

### 8.1 Static model (simple display)

Use `<Model>` when you only need to show a single model, no scene-graph reuse.

```tsx
import { Model } from '@webspatial/react-sdk';

<Model
  {...{ 'enable-xr': true }}
  src={`${__XR_ENV_BASE__}/Sun.usdz`}
  style={{ width: '800px', height: '200px' }}
  onLoad={() => {}}
  onError={() => {}}
>
  <div>Placeholder when load fails</div>
</Model>
```

- **Formats:** e.g. USDZ; see platform docs (e.g. [Apple Quick Look](https://developer.apple.com/augmented-reality/quick-look/)).

### 8.2 Dynamic model (Entity–Component)

**ModelAsset** = resource (load once). **ModelEntity** = instance in the scene (many instances per asset).

```tsx
<Reality style={{ width: '100%', height: '500px' }}>
  <ModelAsset id="ship-blueprint" src="https://example.com/fighter.usdz" />

  <SceneGraph>
    <ModelEntity model="ship-blueprint" position={{ x: 0, y: 0, z: 0 }} scale={{ x: 1, y: 1, z: 1 }} />
    <ModelEntity model="ship-blueprint" position={{ x: -0.5, y: -0.2, z: 0.3 }} scale={{ x: 0.8, y: 0.8, z: 0.8 }} />
    <ModelEntity model="ship-blueprint" position={{ x: 0.5, y: -0.2, z: 0.3 }} scale={{ x: 0.8, y: 0.8, z: 0.8 }} />
  </SceneGraph>
</Reality>
```

- **ModelAsset:** `id`, `src`, `onLoad?`, `onError?`. Relative `src` are resolved to absolute URLs.
- **ModelEntity:** `model` (asset id), optional `materials?` (material override), `position?`, `rotation?`, `scale?`, and entity event handlers. Changing `model` recreates the entity.

---

## 9. Materials

- **UnlitMaterial:** `id`, `color?` (e.g. `#ff0000`), `transparent?`, `opacity?`. Referenced by id: `materials={['id']}`.
- Define once, use on many entities.
- **Transparency:** `transparent={true}` and `opacity={0.5}` (0–1).

```tsx
<UnlitMaterial id="solid" color="#00ff00" />
<UnlitMaterial id="glass" color="#0000ff" transparent opacity={0.5} />
```

**Phase 2:** Material props (`color`, `transparent`, `opacity`) are **dynamic**: updates at runtime are applied to the native material and all entities using it (see §14).

---

## 10. Transforms

- **position:** `{ x, y, z }` in meters. Origin `(0,0,0)` is the center of the Reality canvas.
- **rotation:** `{ x, y, z }` in **radians** (e.g. `Math.PI` = 180°, `Math.PI/2` = 90°).
- **scale:** `{ x, y, z }`; `1` = identity, `2` = double, `0.5` = half.

**Coordinate system:** **+Y** up, **+X** right, **+Z** toward the viewer. Right-handed.

**Cheat sheet:** `0.1` m ≈ 10 cm; 90° = `Math.PI/2` ≈ 1.57; 180° = `Math.PI` ≈ 3.14.

---

## 11. Interaction

- **Spatial events** (on entities and optionally on container): `onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`. Event detail includes 3D location / deltas where applicable.
- **Refs:** Use `useEntityRef` or pass `ref` to entity components to get the underlying entity ref for programmatic transform or other APIs.
- **Visibility:** Toggle by conditional render: `{ show && <BoxEntity … /> }`. Updating React state (e.g. material `color`) re-renders and, where supported (Phase 2), updates the scene at runtime.

Example: tap to change color (material id stays the same; Phase 2 allows updating that material’s `color` at runtime).

```tsx
const [color, setColor] = useState('#ff0000');
<UnlitMaterial id="dynamic" color={color} />
<BoxEntity
  materials={['dynamic']}
  onSpatialTap={(e) => {
    setColor('#00ff00');
    console.log('3D position:', e.detail.location3D);
  }}
/>
```

---

## 12. Animation

Drive transforms (or other state) from `requestAnimationFrame` and pass updated props. Entity transforms are applied each frame from React state.

```tsx
const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

useEffect(() => {
  let id: number;
  function animate() {
    setRotation(prev => ({ ...prev, y: prev.y + 0.02 }));
    id = requestAnimationFrame(animate);
  }
  animate();
  return () => cancelAnimationFrame(id);
}, []);

<BoxEntity materials={['red']} rotation={rotation} />
```

---

## 13. Volumes (opened scenes)

For a **volume** (3D box) instead of a flat window, configure the scene with `initScene` and `type: 'volume'`. Then open the page with `window.open(..., sceneName)`.

```ts
import { initScene } from '@webspatial/react-sdk';

initScene('my3DBox', (config) => ({
  ...config,
  defaultSize: {
    width: 2,   // meters
    height: 1,
    depth: 1,
  },
}), { type: 'volume' });

// Later: open the scene
window.open('/3d-page.html', 'my3DBox');
```

- **type: 'volume'** is required for a 3D volume. Defaults for volume use meters for `defaultSize.width/height/depth`.

---

## 14. Phase 2: Dynamic runtime updates

The following are **already implemented** or specified as Phase 2; they make the API “dynamic” so that prop changes after mount update the native scene.

| Feature | Description |
|--------|-------------|
| **Dynamic material properties** | Changing `UnlitMaterial` props (`color`, `transparent`, `opacity`) at runtime updates the native material and all entities using it. |
| **Dynamic geometry** | Changing primitive props (`width`, `height`, `depth`, `cornerRadius`, `radius`, `splitFaces`, `materials`) rebuilds the geometry/model component on the same entity so size and materials update in place. |
| **ModelEntity** | Changing `model` recreates the entity (new asset). The `materials` prop applies a material override to the model instance; updates to `materials` at runtime are applied to the native model. |

Detailed design, JSB commands, and constraints for Phase 2 are in the sections below.

---

## 15. Phase 2 — Feature 1: Dynamic material properties

**Problem:** Without Phase 2, `<UnlitMaterial>` only applied props on mount.

**Solution:** React `useEffect` watches `color`, `transparent`, `opacity` and calls `SpatialUnlitMaterial.updateProperties()` in core SDK, which sends `UpdateUnlitMaterialProperties` to native; native updates RealityKit material and re-applies to entities.

**Constraints:** No texture changes in this phase. Partial updates supported. All entities referencing the material see the update.

---

## 16. Phase 2 — Feature 2: Dynamic geometry modification

**Problem:** Primitive geometry was fixed after creation.

**Solution:** When geometry (or `materials`) props change, the entity’s model component is removed, new geometry and model component are created with updated dimensions/materials, and re-attached to the same entity. Transform and hierarchy are preserved.

**Constraints:** Heavier than material-only update. Applies to all primitives via `GeometryEntity`.

---

## 17. Phase 2 — Feature 3: ModelEntity model swap + material override

**Model swap:** Changing the `model` prop triggers entity teardown and creation with the new asset (`recreateKey` in `useEntity`).

**Material override:** `ModelEntity` accepts `materials` (array of material ids). Resolved materials are applied via `SetMaterialsOnEntity` JSB command; native walks the model hierarchy and replaces materials on `ModelComponent` instances.

**Constraints:** Model swap resets entity (position/events). Override applies to all model components in the hierarchy; per-mesh targeting is out of scope for this phase.

---

## 18. Phase 2 — Native commands summary

| Command | Direction | Purpose |
|---------|-----------|---------|
| `UpdateUnlitMaterialProperties` | JS → Native | Update material color / opacity / transparency |
| `RemoveComponentFromEntity` | JS → Native | Remove component from entity (used before geometry rebuild) |
| `SetMaterialsOnEntity` | JS → Native | Override materials on a model entity |

---

## 19. References

- **Model (static):** `docs/Model.md`
- **Apple Quick Look / model sources:** [developer.apple.com/augmented-reality/quick-look/](https://developer.apple.com/augmented-reality/quick-look/)
- **Spatial CSS vars:** e.g. `--xr-depth`, `--xr-back` (see spatialized container / types in `@webspatial/react-sdk`)
