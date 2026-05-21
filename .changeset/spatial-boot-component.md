---
"@webspatial/react-sdk": minor
---

Add `useBootSpatial()` and `<SpatialBoot>`: default boots after mount and mounts `children` only when ready; boot failure invokes `onError` without mounting children. Optional `fallback` for loading UI. Phase-2 advanced `gate={false}` documented in `docs/design/spatial-boot-component.md`.
