---
'@webspatial/platform-visionos': patch
---

Remove URL coalescing (in-flight deduplication) from Dynamic3DManager's RemoteResourceLoadCache. Each resource load now downloads independently to a unique hash-based filename, with atomic temp-file promotion. Concurrent same-URL loads race safely (last writer wins) without shared mutable state.
