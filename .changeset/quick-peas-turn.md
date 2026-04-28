---
'@webspatial/core-sdk': patch
---

Refactor spatial host integration by introducing explicit platform capability APIs and a shared `spatial-host` facade. This simplifies scene/div/attachment call paths, removes redundant command wrappers, and improves platform adapter robustness for VisionOS and Pico OS error handling.
