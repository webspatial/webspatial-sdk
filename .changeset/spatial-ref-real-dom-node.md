---
'@webspatial/react-sdk': patch
---

Make spatial container `ref.current` a real DOM node. The standard host element is no longer wrapped in a `Proxy`; spatial behavior (style proxy for `transform` / `visibility`, auto-applied `xr-spatial-default` className, `xrClientDepth` / `xrOffsetBack` accessors, `extraRefProps`) is now installed on the underlying `HTMLElement` via `Object.defineProperty`.

This fixes native DOM API usage on `ref.current` (`instanceof Node`, `parent.contains`, `getComputedStyle`, `MutationObserver`, etc.) and removes the need for the global `getComputedStyle` hijack and the private `__raw` / `__targetProxy` indirection. As a side effect, `el.removeAttribute('id' /* or any non-spatial name */)` now correctly delegates to the native call instead of being silently dropped.
