---
"@webspatial/react-sdk": patch
---

Fix SpatialDiv transforms when stylesheets use **HTML tag selectors** on the host element (for example `h1 { transform: … }` or `h1.myClass { … }`). The off-screen transform/visibility probe now mirrors the host’s intrinsic tag (`<h1 enable-xr>` → probe `<h1>`); custom React component wrappers still use a `div` probe.

**Limitations:** ancestor selectors tied to the page tree (e.g. `.page h1`) may not match the probe; prefer class selectors or inline `style` for those cases. See `docs/webspatial-quirks.md` and `packages/react/src/spatialized-container/ARCHITECTURE.md`.

Fixes [#1263](https://github.com/webspatial/webspatial-sdk/issues/1263).
