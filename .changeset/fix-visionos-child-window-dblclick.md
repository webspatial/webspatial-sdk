---
'@webspatial/core-sdk': patch
'@webspatial/platform-visionos': patch
---

Fix visionOS child windows created through `window.open` so DOM double-click events continue to be synthesized.

Core now rewrites tokenless visionOS spatial child-window commands to `about:blank` URLs with query parameters. The visionOS runtime accepts and parses those opaque `about:` URLs while preserving legacy `webspatial://` command support.
