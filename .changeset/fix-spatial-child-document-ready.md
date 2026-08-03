---
'@webspatial/core-sdk': patch
---

Fix spatial child window creation so platform handoff resolves only after the child document reaches `complete`. This avoids rare caller-side DOM write failures such as `TypeError: Cannot set properties of null (setting 'innerHTML')` when the returned window proxy still has a loading document.
