---
'@webspatial/react-sdk': major
---

BREAKING: the React SDK now uses a lazy default entry and adds an eager entry for spatial-only client apps.

To upgrade from v1 to v2:

- Import web-first or SSR-capable apps from `@webspatial/react-sdk`. Spatial implementations load after `bootSpatial()` runs in a WebSpatial runtime.
- Import CSR-only spatial apps from `@webspatial/react-sdk/eager`. Do not mix the default and eager React SDK entries in the same bundle.
- Replace the removed `/web` and `/default` import paths with `@webspatial/react-sdk` or `@webspatial/react-sdk/eager`.
- Mount spatial UI behind `<SpatialBoot>` or wait for `bootSpatial()` / `useSpatialReady()` before using runtime-only APIs or imperative refs that need the real spatial implementation.
- Update code that relied on removed implementation-detail exports such as internal spatial containers, monitors, `SSRProvider`, and `getAbsoluteUrl`.

See the lazy-load spatial runtime migration guide for full upgrade examples.
