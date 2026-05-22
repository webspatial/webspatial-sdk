---
'@webspatial/react-sdk': patch
---

Add the `@webspatial/react-sdk/eager` entry for spatial-only applications. The
new subpath exposes the same public runtime names as the default entry while
statically linking the spatial implementation, so fixed WebSpatial targets can
avoid the lazy `bootSpatial()` network round-trip.

The default `@webspatial/react-sdk` entry remains the recommended path for
web-first apps and SSR/prerendered spatial UI because it keeps facade fallbacks
lazy and hydration-safe.
