---
'@webspatial/react-sdk': minor
'@webspatial/platform-visionos': patch
---

**ResourceRegistry:** add `subscribe(id, listener)` and `notify(id)`. Subscribers run when a resource promise settles after `add()` (success or failure), and on `remove`, `removeAndDestroy`, and `destroy()`.

**React `<Texture>`:** call `notify(id)` after in-place `updateProperties({ url })` so materials refresh when the URL changes without a new `add()` for the same logical texture id.

**React `<UnlitMaterial>`:** subscribe to the bound `textureId` and bump an internal revision so the update path re-runs when the texture settles or is replaced; remove `surfaceSyncRev`. Material init still creates a tint-only material when the texture promise rejects so entities keep a valid material id until a later successful load.

**visionOS `Dynamic3DManager`:** coalesce remote downloads per URL string and write cache files under `Documents` using a SHA256-prefix plus basename so concurrent loads no longer `removeItem` the same path another reader is using.
