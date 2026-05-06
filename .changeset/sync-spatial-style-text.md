---
'@webspatial/react-sdk': patch
---

Sync CSS-in-JS style text updates into spatial child windows so dynamic class changes keep their matching styles in SpatialDiv and Attachment content.

Also scan the entire MutationObserver batch when deciding sync timing: if any record indicates an inline `<style>` change, the whole batch is scheduled as `immediate`, so a `<link rel=stylesheet>` record earlier in the same batch no longer downgrades co-occurring `<style>` text updates to the delayed path.
