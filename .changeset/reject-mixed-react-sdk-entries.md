---
'@webspatial/react-sdk': patch
---

Reject mixing `@webspatial/react-sdk` and `@webspatial/react-sdk/eager` in the same page runtime. Each entry registers its root at module evaluation; loading both throws `WebSpatialMixedEntryError` with a one-shot actionable message (including when a transitive dependency pulls in the other entry). Applications must pick exactly one import root per bundle.
