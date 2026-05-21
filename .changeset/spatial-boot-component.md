---
"@webspatial/react-sdk": minor
---

Add `<SpatialBoot>`: boots after mount and mounts `children` only when ready; boot failure invokes `onError` without mounting children. Optional `fallback` for loading UI. `useBootSpatial` remains internal (not exported). Phase-2 may add public boot-progress hooks and `gate={false}`.
