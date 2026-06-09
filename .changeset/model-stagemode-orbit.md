---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
---

Add a `stagemode` prop to `<Model>` for built-in orbit interaction. When set to `"orbit"`, the native layer drives the model's rotation via drag gestures, the `onSpatial*` handlers are disabled, and `entityTransform` becomes read-only (updated from native `entitytransformchange` events). The previous `modelTransform` property is renamed to `entityTransform`.
