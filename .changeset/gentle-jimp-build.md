---
'@webspatial/builder': patch
---

Fix the builder TypeScript compile failure with Jimp 1.x by reading the Jimp class from the module namespace under Node16/CommonJS resolution.
