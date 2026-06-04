---
"@webspatial/react-sdk": patch
---

Mirror the spatial host intrinsic HTML tag on the transform/visibility probe so tag selectors (for example `h1 { transform: ... }`) apply when reading computed styles for spatial transforms. Non-string component types still use a `div` probe.
