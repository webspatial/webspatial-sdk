---
'@webspatial/core-sdk': patch
---

Fix anchor click interception in the scene polyfill when users click nested elements inside an anchor tag, such as images wrapped by links. The polyfill now uses the anchor found during event bubbling so target-based navigation handling still works for `_blank` and other non-`_self` links.