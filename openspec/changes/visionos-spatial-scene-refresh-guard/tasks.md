# Tasks: VisionOS SpatialScene refresh guard

- [x] Add current page generation tracking to VisionOS `SpatialScene` and advance it before refresh cleanup.
- [x] Parse `rid` and optional `wsepoch` from SpatialDiv and attachment requests.
- [x] Reject stale requests only when `wsepoch` is present and mismatches the current page generation.
- [x] Keep compatibility mode for requests that arrive without `wsepoch`, including warning logs.
- [x] Enhance inspect and logs with generation, request identity, and scene object diagnostics.
