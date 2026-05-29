---
'@webspatial/core-sdk': patch
'@webspatial/react-sdk': patch
---

Split **picoOS** capability rows from visionOS in `CAPABILITY_TABLE`: `supports('xrInnerDepth')` and `supports('xrOuterDepth')` are **false** for PicoWebApp **0.1.1** and **0.1.2**; visionOS shell rows are unchanged.
