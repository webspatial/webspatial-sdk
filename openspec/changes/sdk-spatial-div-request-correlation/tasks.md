# Tasks: SDK SpatialDiv request correlation

- [x] Define an internal helper that generates refresh-safe opaque `rid` values for SpatialDiv and attachment requests.
- [x] Update frontend request builders to emit `rid` and optional `wsepoch` consistently.
- [x] Keep callback correlation, timeout cleanup, and pending-request bookkeeping keyed by `rid`.
- [x] Ensure the scene polyfill and related forwarding paths preserve `rid` and optional `wsepoch` unchanged.
- [x] Add focused tests for `rid` refresh safety, request URL emission, and callback correlation behavior.
