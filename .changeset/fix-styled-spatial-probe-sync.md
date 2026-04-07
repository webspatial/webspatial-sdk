---
'@webspatial/react-sdk': patch
---

Keep the transform/visibility probe in sync with the Standard spatial host when class updates do not flow through React props (e.g. styled-components). Mirrors Standard `className` onto the probe via MutationObserver and `SpatializedContainer` state, coalesces sync with microtasks, and skips redundant DOM/state updates.
