---
'@webspatial/core-sdk': minor
'@webspatial/react-sdk': minor
'@webspatial/builder': minor
'@webspatial/platform-visionos': minor
---

Add the platform-neutral Runtime Capability Manifest v1 protocol and make
`supports()` prefer a valid runtime-provided complete capability allowlist
before legacy shell-version inference.

The visionOS runtime now injects its checked-in capability set at document start
for every WebSpatial WKWebView. Preview builds can therefore test accurate
feature detection without guessing the future stable Changesets version.
