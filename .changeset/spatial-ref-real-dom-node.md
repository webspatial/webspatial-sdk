---
'@webspatial/react-sdk': patch
---

`ref.current` on spatial containers (`SpatialDiv`, `Model`, `Spatialized2DElementContainer`, `Reality` entities) is now the real underlying `HTMLElement` instead of a `Proxy` wrapper. As a result:

- `ref.current instanceof HTMLElement` (and `instanceof Node`) is `true`.
- Native APIs that brand-check `Element` now accept `ref.current` directly — `ResizeObserver.observe(ref.current)` (#1067), `IntersectionObserver.observe(ref.current)`, `MutationObserver.observe(ref.current, …)`, `parent.contains(ref.current)`, `document.querySelector(...) === ref.current`, and `getComputedStyle(ref.current)` all work without any polyfill.
- `ref.current.removeAttribute('id' /* or any name other than 'style' / 'class' */)` now correctly removes the attribute — previously it was silently dropped.
- `ref.current.style.setProperty('transform', value, 'important')` now preserves the `priority` argument when forwarding to the spatial transform layer.

Spatial behavior (auto `xr-spatial-default` className, `style.transform` / `style.visibility` proxying, `xrClientDepth` / `xrOffsetBack` accessors, `extraRefProps`) is unchanged.

Internally, the standard host's hidden-placeholder appearance (`visibility: hidden`, `transition: none`, `transform: none | translateZ(0)`) is no longer written as inline style — it is now applied via CSS rules keyed on the new `data-xr-host` and `data-xr-transform-active` attributes. This is required so that React commits do not write through the spatial style proxy and clobber the user's `style.transform` value on the probe. Visual behavior is unchanged.

The architectural invariants behind the standard-host / probe split, the spatial style proxy, and the `xr-spatial-default` / `data-xr-host` contracts are documented in `packages/react/src/spatialized-container/ARCHITECTURE.md` for future maintainers.

Note: the previously undocumented `ref.current.__raw` field is removed; use `ref.current` directly.
