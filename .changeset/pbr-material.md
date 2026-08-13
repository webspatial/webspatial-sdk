---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': minor
---

Add physically-based materials (`PBRMaterial`) to the Reality material system.

**Core SDK**

- Add `SpatialSession.createPBRMaterial()` and `SpatialPBRMaterial` with `color`, `textureId`, `metalness`, `roughness`, `transparent`, and `opacity` options (same property names and conventions as Three.js `MeshStandardMaterial`).
- Add `CreatePBRMaterial` / `UpdatePBRMaterialProperties` bridge commands, the `'pbr'` material sub-token, and the `PBRMaterial` runtime capability key.

**React SDK**

- Add the `<PBRMaterial>` component (facade + spatial implementation) and route `<Material type="pbr">` through it. All props update reactively after mount.
- Add `MaterialPresets` (`matte`, `glossy`, `plastic`, `metal`, `glass`) — JS-only tuned starting points to spread into `<PBRMaterial>`.
- Refactor `<UnlitMaterial>` / `<PBRMaterial>` onto a shared internal `useSpatialMaterial` lifecycle hook, so both get identical texture resolution, late-texture subscription, and reactive property updates.

**visionOS native**

- Add `SpatialPBRMaterial` wrapping RealityKit's `PhysicallyBasedMaterial` with in-place property mutation, `CreatePBRMaterial` / `UpdatePBRMaterialProperties` handlers, and texture-reload propagation to PBR materials.
