---
'@webspatial/react-sdk': patch
---

`ref.current` on spatial containers (`SpatialDiv`, `Model`, `Spatialized2DElementContainer`, `Reality` entities) is now the real underlying `HTMLElement` instead of a `Proxy` wrapper. As a result:

- `ref.current instanceof HTMLElement` (and `instanceof Node`) is `true`.
- `parent.contains(ref.current)`, `document.querySelector(...) === ref.current`, `MutationObserver.observe(ref.current)`, and `getComputedStyle(ref.current)` work without any polyfill.
- `ref.current.removeAttribute('id' /* or any name other than 'style' / 'class' */)` now correctly removes the attribute — previously it was silently dropped.
- `ref.current.style.setProperty('transform', value, 'important')` now preserves the `priority` argument when forwarding to the spatial transform layer.

Spatial behavior (auto `xr-spatial-default` className, `style.transform` / `style.visibility` proxying, `xrClientDepth` / `xrOffsetBack` accessors, `extraRefProps`) is unchanged.

Note: the previously undocumented `ref.current.__raw` field is removed; use `ref.current` directly.
