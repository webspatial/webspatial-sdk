---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
---

Avoid exporting `global.d.ts` as a runtime module from `@webspatial/core-sdk`, so stricter bundlers and local `file:`/workspace consumers can resolve the built package correctly.
