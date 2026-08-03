---
'@webspatial/core-sdk': patch
---

Fix html background material updates written through bracket syntax so CSS custom
properties are stored in CSSOM before later html style mutations recompute scene
material.
