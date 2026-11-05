---
'@webspatial/core-sdk': patch
---

Coalesce overlapping SpatialObject destroy calls into one native request and one local cleanup, preserving missing-native-object handling and retries after genuine failures.
