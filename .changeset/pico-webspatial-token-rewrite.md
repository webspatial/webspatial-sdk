---
'@webspatial/core-sdk': patch
---

Pico OS: when `webSpatial.genToken()` is present, rewrite `window.open` for **`createSpatialized2DElement`** and **`createAttachment`** to the token URL form (`command=` + optional `rid`). Other `webspatial://` URLs are left unchanged.
