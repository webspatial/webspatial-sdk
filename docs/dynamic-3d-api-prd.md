# Dynamic 3D API — Spec


---

## 1. Three ways to add 3D content

| Approach | Component / API | Use case |
|----------|-----------------|----------|
| **Reality** | `<Reality>` + scene graph | 3D canvas: shapes (primitives) and model instances; like `<canvas>` but for 3D |
| **Model (static)** | `<Model enable-xr src="…">` | Drop-in 3D model file; like `<img>` for 3D — see **`docs/Model.md`** (not covered here) |
| **Spatial HTML** | HTML + `enable-xr` | Regular HTML that floats in space |

**Scope:** This spec is only APIs used **inside `<Reality>`** (scene graph, materials, textures, `ModelAsset` / `ModelEntity`). Standalone `<Model>`, window/volume scene setup (`initScene`, manifest), and other patterns are documented elsewhere; see **§14. References**.

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
  Texture,
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
- **UnlitMaterial** — Material resource (color, optional transparency, optional **texture** via `textureId`). Declared by `id`; referenced by `materials={['id']}` on primitives or `ModelEntity`.
- **Texture** — Image resource loaded from a URL. Declared by `id` and `url`; referenced from **UnlitMaterial** with `textureId` matching that `id`.

**Order inside `<Reality>`:** declare **textures** (if any), **materials**, and **assets** first, then **`<SceneGraph>`** and its content. Resources are resolved by `id` when entities mount.

**Runtime prop changes** (after mount) are supported for the types above: each following section notes what happens when those props change.

---

## 4. Basic structure

```tsx
<Reality style={{ width: '500px', height: '500px', '--xr-depth': 100 }}>
  {/* 1. Textures (optional) then materials (by id) */}
  <Texture id="noise" url="https://example.com/noise.png" />
  <UnlitMaterial id="red" color="#ff0000" />
  <UnlitMaterial id="textured" color="#ffffff" textureId="noise" />
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

- **Props:** `id?`, `name?`, `position?`, `rotation?`, `scale?`, spatial event handlers (see §12).
- **Children:** Any entity (primitives, `ModelEntity`, nested `Entity`). Transforms are relative to the parent.

---

## 7. Primitive entities

All use **meters** for size/distance. **Rotation** in **radians**.

Changing **geometry** props (`width`, `height`, `depth`, `radius`, `cornerRadius`, `splitFaces`) or **`materials`** after mount rebuilds the mesh/model component on the same entity in place; **transform** and **hierarchy** stay put.

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

## 8. 3D models (inside `<Reality>`)

Use **`ModelAsset`** + **`ModelEntity`** under `<Reality>` when models participate in the same scene graph as primitives and shared materials.

For a **standalone** `<Model>` (single file, no `<Reality>` / scene graph), see **`docs/Model.md`**.

### 8.1 Dynamic model (Entity–Component)

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

- **ModelAsset:** `id`, `src`, `onLoad?`, `onError?`. Relative `src` are resolved to absolute URLs. Formats (e.g. USDZ) follow platform support; see [Apple Quick Look](https://developer.apple.com/augmented-reality/quick-look/) and **`docs/Model.md`**.
- **ModelEntity:** `model` (asset id), optional `materials?` (material override), `position?`, `rotation?`, `scale?`, and entity event handlers. Changing **`model`** after mount recreates that instance with the new asset. Changing **`materials`** reapplies overrides on the loaded model.

---

## 9. Materials

- **UnlitMaterial:** `id`, `color?` (e.g. `#ff0000`), `textureId?` (logical id of a `<Texture>` in the same `<Reality>`), `transparent?`, `opacity?`. Referenced by id: `materials={['id']}`.
- Define once, use on many entities.
- **Transparency:** `transparent={true}` and `opacity={0.5}` (0–1).
- **Runtime updates:** Changing `color`, `textureId`, `transparent`, or `opacity` after mount updates the material everywhere it is used—every primitive or `ModelEntity` whose `materials` array includes this **id**.

```tsx
<UnlitMaterial id="solid" color="#00ff00" />
<UnlitMaterial id="glass" color="#0000ff" transparent opacity={0.5} />
```

---

## 10. Textures

Image resources loaded from a URL and sampled by **UnlitMaterial** when you set `textureId` to the same string `id` you pass to `<Texture>`.

### 10.1 `<Texture>`

- **Props:** `id` (string you reuse as `textureId` on `UnlitMaterial`), `url` (image URL), `onLoad?`, `onError?`.
- **URL resolution:** `http://` and `https://` URLs are used as-is; other values are resolved with `new URL(url, window.location.href)` so relative paths work against the page origin.
- **Loading:** Fetching and preparing the image is **asynchronous**. Use `onLoad` / `onError` to know when the texture is ready.
- **Order inside `<Reality>`:** Put `<Texture>` before `<UnlitMaterial>` that references it. If the material is created in the same render cycle as the texture, wait until `onLoad` (or similar) before mounting that material and entities that use it, so the image is available when the material is first built.

```tsx
const [texReady, setTexReady] = useState(false);

<Reality style={{ width: '100%', height: '500px' }}>
  <Texture
    id="brick"
    url="https://example.com/brick.jpg"
    onLoad={() => setTexReady(true)}
    onError={(e) => console.error(e)}
  />
  {texReady && (
    <>
      <UnlitMaterial id="matBrick" color="#ffffff" textureId="brick" />
      <SceneGraph>
        <BoxEntity materials={['matBrick']} width={0.2} height={0.2} depth={0.2} />
      </SceneGraph>
    </>
  )}
</Reality>
```

- **Runtime `url` changes:** After mount, changing `url` reloads the image; any `UnlitMaterial` that references this texture’s `id` updates to show the new image.

### 10.2 UnlitMaterial + texture

- **`textureId`:** Use the same string `id` you passed to `<Texture>`. Both must live under the same `<Reality>`; the SDK wires the material to that texture resource for you.
- **Tint:** `color` multiplies with the texture; use `#ffffff` for an untinted image.
- **Clearing / rebinding:** After mount, `textureId=""` clears the binding; set `textureId` to another texture `id` to switch images, same as updating other material props.

---

## 11. Transforms

- **position:** `{ x, y, z }` in meters. Origin `(0,0,0)` is the center of the Reality canvas.
- **rotation:** `{ x, y, z }` in **radians** (e.g. `Math.PI` = 180°, `Math.PI/2` = 90°).
- **scale:** `{ x, y, z }`; `1` = identity, `2` = double, `0.5` = half.

**Coordinate system:** **+Y** up, **+X** right, **+Z** toward the viewer. Right-handed.

**Cheat sheet:** `0.1` m ≈ 10 cm; 90° = `Math.PI/2` ≈ 1.57; 180° = `Math.PI` ≈ 3.14.

---

## 12. Interaction

- **Spatial events** (on entities and optionally on container): `onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`. Event detail includes 3D location / deltas where applicable.
- **Refs:** Use `useEntityRef` or pass `ref` to entity components to get the underlying entity ref for programmatic transform or other APIs.
- **Visibility:** Toggle by conditional render: `{ show && <BoxEntity … /> }`. Updating React state (e.g. a shared material’s `color`) re-renders and updates the scene for every entity using that material id.

Example: tap to change color — the same `UnlitMaterial` id is reused; all `BoxEntity` instances referencing it update together.

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

## 13. Animation

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

## 14. References

- **Standalone `<Model>` (not part of this spec):** `docs/Model.md`
- **Window / volume scenes (`initScene`, manifest defaults, `type: 'volume'`):** `docs/manifest-api.md` (and scene polyfill / `initScene` in `@webspatial/react-sdk`)
- **Apple Quick Look / model sources:** [developer.apple.com/augmented-reality/quick-look/](https://developer.apple.com/augmented-reality/quick-look/)
- **Spatial CSS vars:** e.g. `--xr-depth`, `--xr-back` (see spatialized container / types in `@webspatial/react-sdk`)
