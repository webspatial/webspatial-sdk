---
'@webspatial/react-sdk': patch
---

**BREAKING:** `convertCoordinate` now throws `WebSpatialRuntimeError` in non-WebSpatial browsers, before `bootSpatial()` resolves, or when `from` / `to` refs are invalid — instead of silently returning the input position unchanged.

**Migration:** Gate calls with `WebSpatialRuntime.supports('convertCoordinate')`, or wrap in try/catch if you need cross-environment fallbacks.

**Spec:** `openspec/changes/convert-coordinate-fail-fast/`
