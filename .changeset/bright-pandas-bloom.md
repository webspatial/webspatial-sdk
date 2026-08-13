---
'@webspatial/react-sdk': patch
---

Fix `<UnlitMaterial>` so providing an undeclared `textureId` no longer blocks material creation. It now falls back to color-only rendering (empty native `textureId`) and continues to support binding once the texture resource is later declared.
