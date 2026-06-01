---
'@webspatial/core-sdk': major
---

Remove the IIFE bundle (`dist/iife/index.global.js`) and its dedicated `iife-entry.ts` build target. ESM consumers should import `@webspatial/core-sdk/install-polyfills` explicitly when polyfills are needed.
