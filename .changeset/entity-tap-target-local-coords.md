---
'@webspatial/react-sdk': patch
'@webspatial/platform-visionos': patch
---

Fix Entity `spatialtap` / `spatialdragstart` hit-point coordinates. `offsetX/Y/Z` is now converted into the Web-facing `event.target` SpatialEntity local space (meters) instead of forwarding the Reality view's SwiftUI gesture coordinates, and `clientX/Y/Z` is the same hit in window CSS pixels. Hits on a child mesh are converted into the owning SpatialEntity's space.
