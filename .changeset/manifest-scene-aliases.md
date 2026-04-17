---
"@webspatial/core-sdk": patch
---

Add snake_case/camelCase alias support for `manifest.json` `xr_spatial_scene` config.

- Same-object alias resolution prefers snake_case when both are present
- Override priority remains unchanged (overrides > top-level)
- Support snake_case keys for `resizability` and `overrides` scene selectors