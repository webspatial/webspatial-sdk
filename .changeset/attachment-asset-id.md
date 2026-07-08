---
'@webspatial/react-sdk': major
'@webspatial/core-sdk': major
---

BREAKING: align the attachment API with entity-style transforms and meter-based sizing.

- Rename `<AttachmentAsset>`'s `name` prop to `id` (same pattern as `<ModelAsset id="...">`).
- Replace tuple `position={[x, y, z]}` with Vec3 objects `position={{ x, y, z }}`.
- Replace `size={{ width, height }}` (points) with optional `width` / `height` props in world-space meters.
- Add optional `rotation` and `scale` Vec3 props (Euler degrees for rotation), matching regular entity transform semantics.

Migration:

```tsx
// Before
<AttachmentAsset name="hud">
  <Hud />
</AttachmentAsset>
<AttachmentEntity
  attachment="hud"
  position={[0, 0.1, 0]}
  size={{ width: 200, height: 100 }}
/>

// After
<AttachmentAsset id="hud">
  <Hud />
</AttachmentAsset>
<AttachmentEntity
  attachment="hud"
  position={{ x: 0, y: 0.1, z: 0 }}
  rotation={{ x: 0, y: 0, z: 0 }}
  scale={{ x: 1, y: 1, z: 1 }}
  width={0.2}
  height={0.1}
/>
```
