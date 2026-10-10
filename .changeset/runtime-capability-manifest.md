---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/builder': minor
'@webspatial/platform-visionos': minor
---

Add Runtime Capability Manifest v1 so `supports()` uses the exact capability allowlist from visionOS runtimes while preserving legacy shell-version fallback.
This enables accurate feature detection in preview builds without guessing the future stable version.
