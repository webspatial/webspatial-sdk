# Spatialized Container Architecture

> Internal architecture notes for `@webspatial/react-sdk`'s spatialized container layer (`SpatialDiv`, `Model`, `Reality` entities, `Spatialized2DElementContainer`). Audience: SDK maintainers. Users of the SDK should never need to read this — see the package README and [openspec specs](../../../../openspec/specs/) instead.

## Two-DOM split: standard host + probe

A spatial container is rendered as **two** cooperating DOM elements:

```
┌──────────────────────────────────────────────────────────────────────┐
│  StandardSpatializedContainer  →  the standard host                  │
│    visible 2D placeholder (always visually hidden via CSS)            │
│    real HTMLElement, exposed as `ref.current`                         │
│    has spatialized style proxy installed via Object.defineProperty    │
│    has SDK-controlled `data-xr-host` (always) and                    │
│    `data-xr-transform-active` (when transform != 'none')             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  TransformVisibilityTaskContainer  →  the probe                      │
│    portal'd into a hidden `cssParserDivContainer` in <body>          │
│    not part of the spatial host's tree                               │
│    has user's `transform` / `visibility` written to its inline style  │
│    `useSpatialTransformVisibility` reads `getComputedStyle(probe)`    │
│    and broadcasts (transform, visibility) to platform subscribers    │
└──────────────────────────────────────────────────────────────────────┘
```

**Why split?** The standard host is what the user can see/measure in the page (layout, sibling order, scroll context, etc.), and the probe is the source of truth for what the spatial layer renders. Decoupling them lets the host stay invisible (so the page doesn't render duplicate 2D placeholders) while the probe carries the user's spatial transform/visibility through the CSS engine to the platform side.

## What `ref.current` is

`ref.current` is **the real standard-host `HTMLElement`** (`instanceof Node === true`, `parent.contains(ref.current) === true`, `getComputedStyle(ref.current)` works, `ResizeObserver.observe(ref.current)` works, etc.).

`SpatialContainerRefProxy.installSpatialRefBehavior` (in [`hooks/useDomProxy.ts`](./hooks/useDomProxy.ts)) installs a few spec-correct property descriptors on top of that element:

| Property | Behavior on the host |
| --- | --- |
| `style` (getter) | Returns a `Proxy<CSSStyleDeclaration>` over the raw style. |
| `style.transform` / `style.visibility` (set/get) | **Forwarded to the probe.** Reads return the probe's value; writes are applied to the probe. |
| `style.setProperty` / `removeProperty` / `getPropertyValue` | Same forwarding for `'transform'` / `'visibility'`; preserves the `priority` argument; falls through to native for everything else. |
| `style.cssText` (set) | Spatial properties (`transform`, `visibility`) extracted and applied to the probe; remainder applied to the host raw style alongside `transform: none; visibility: hidden;`. |
| `style[SpatialCustomStyleVars.*]` (set) | Applied directly to the host's raw style (CSS custom properties). |
| `className` (set) | Always preserves the `xr-spatial-default` class **token** (see invariants). |
| `removeAttribute('style')` | Resets the host inline style to `'visibility: hidden; transition: none; transform: none;'` and clears `transform`/`visibility` on the probe. |
| `removeAttribute('class')` | Resets className to `'xr-spatial-default'`. |
| `removeAttribute(otherName)` | Falls through to native `removeAttribute`. |
| `xrClientDepth` / `xrOffsetBack` (getter) | Reads `--xr-depth` / `--xr-back` from the host's raw style. Installed only when `supports(...)` is true at mount time. |
| `extraRefProps` keys | Installed as own properties with get/set delegating to the user-supplied factory. |

These descriptors are removed (`Object.defineProperty` with `configurable: true`) when the standard host is swapped or the component unmounts (`clearInstalledProperties`).

## Invariants on the standard host

These are the contracts the rest of the architecture **depends on**. Future code in this directory MUST preserve them.

### I1. The host always carries `xr-spatial-default` as a class token

- **Why:** The hidden-placeholder CSS rule is keyed on `.xr-spatial-default[data-xr-host]`. Losing the token un-hides the 2D placeholder and drops the spatial CSS variables (`--xr-back`, `--xr-depth`, `--xr-z-index`, `--xr-background-material`).
- **Enforced at three layers:**
  1. **JSX render** in [`StandardSpatializedContainer.tsx`](./StandardSpatializedContainer.tsx) always merges `xr-spatial-default` into the className prop.
  2. **`className` descriptor** in [`hooks/useDomProxy.ts`](./hooks/useDomProxy.ts) re-appends the token via `classList.add` after applying the user's value.
  3. **MutationObserver self-heal** (`SpatialContainerRefProxy.ensureSpatialDefaultClass`) re-appends if any native path (`setAttribute('class', …)`, `classList.remove(...)`, `classList.replace(...)`, third-party DOM helpers) strips it. Asynchronous (one microtask) but bounded — no paint occurs in between.
- **Token vs substring:** the check **MUST** use `classList.contains` / `classList.add`, never `indexOf`, otherwise values like `foo-xr-spatial-default-theme` would falsely satisfy the invariant. The CSS selector keys on the token, not the substring.

### I2. The host always carries `data-xr-host=""`

- **Why:** Same hidden-placeholder rule depends on this attribute. CSS rules in [`injectSpatialDefaultStyle`](./StandardSpatializedContainer.tsx) are scoped to `.xr-spatial-default[data-xr-host]` — class+attribute pair — so unrelated DOM in the host application that happens to use either marker alone is unaffected.
- **Enforced by JSX prop ordering:** the SDK-controlled attribute is placed **after** `{...restProps}` so user-supplied `data-xr-host={undefined}` / `=…` cannot override it. See `StandardSpatializedContainerBase`.

### I3. `data-xr-transform-active` reflects the spatial transform watcher exclusively

- The attribute is added to the host iff `useSpatialTransformVisibilityWatcher` reports a non-`'none'` transform. The CSS rule `.xr-spatial-default[data-xr-host][data-xr-transform-active] { transform: translateZ(0) !important; }` then promotes the host into its own stacking context.
- **Why it must not be user-overridable:** a user-forced value would diverge the host's stacking-context state from the spatial transform watcher, leading to incorrect compositing.
- Enforced by the same JSX prop ordering as I2.

### I4. The probe never carries `data-xr-host` / `data-xr-transform-active`

- The class observer mirrors `class` only (`attributeFilter: ['class']`), so SDK-controlled `data-*` attributes do not bleed onto the probe.
- This is what lets the hidden-host CSS rules apply only to the host while the probe is left to render its own (user-driven) spatial style.

### I5. Host CSS appearance is driven by class rules, NOT inline style

- `StandardSpatializedContainer` MUST NOT write `transform`, `visibility`, or `transition` as inline style on the host. Doing so triggers the host's spatialized style proxy and forwards the React-internal value to the probe, clobbering the user's spatial transform.
- Mechanism: `data-xr-host` / `data-xr-transform-active` data attributes (set via `setAttribute`, which bypasses the style proxy) gate CSS rules with `!important` to preserve the legacy "user inline style cannot un-hide the host" contract.

### I6. styleProxy on the host MUST be a `CSSStyleDeclaration` proxy, not a wrapper around a different node

- The proxy is over `dom.style` itself; reads of non-spatial properties pass through with `Reflect.get`. This guarantees that `getComputedStyle`, layout, and CSS variable resolution remain identical to a vanilla `HTMLElement`.

## Anti-patterns (do **not** do these)

These are the patterns Codex review on [PR #1194](https://github.com/webspatial/webspatial-sdk/pull/1194) explicitly caught. Each maps to one or more of the invariants above.

| ❌ Anti-pattern | What it breaks | Caught in |
| --- | --- | --- |
| Write `host.style.transform = 'translateZ(0)'` (or `visibility`/`transition`) inline from React | I5 — forwards to probe, clobbers user's transform | PR #1194 P1 |
| Use unscoped CSS like `[data-xr-host] { … !important }` | I2 — would hide unrelated DOM in the host application | PR #1194 P2 |
| Place SDK-controlled attributes **before** `{...restProps}` | I2/I3 — user can override and un-hide the host | PR #1194 P2 |
| Use `indexOf('xr-spatial-default')` to test class presence | I1 — false positive on `foo-xr-spatial-default-theme` | PR #1194 P2 |
| Trust `el.className =` to be the only class write path | I1 — `setAttribute('class', …)` / `classList.remove(...)` / `classList.replace(...)` bypass it | PR #1194 P2 |
| Drop `xr-spatial-default` when `className = ''` | I1 — un-hides the host | PR #1194 P2 |

## Test coverage map

Each invariant has at least one regression test pinned in this directory:

| Invariant / behavior | Test |
| --- | --- |
| `ref.current instanceof Element` (no Proxy wrapper) | `useDomProxy.coverage.test.ts` — *"writes the native dom element as ref only when both doms exist"* |
| `ResizeObserver.observe(ref.current)` brand check | `useDomProxy.coverage.test.ts` — *"ref.current passes Element brand checks"* |
| Host data-attr writes do not perturb probe (I5) | `useDomProxy.coverage.test.ts` — *"host data-\* attribute writes do not clobber probe transform"* |
| Host has no inline `transform`/`visibility`/`transition` (I5) | `coverage-boost.test.ts` — *"applies default class + data attributes and toggles data-xr-transform-active"* |
| `data-xr-transform-active` toggles with watcher (I3) | same as above |
| SDK attributes are not overridable (I2/I3) | `coverage-boost.test.ts` — *"SDK data attributes are not overridable via spatial element props"* |
| Class invariant: `className = ''` keeps token (I1) | `useDomProxy.coverage.test.ts` — *"preserves xr-spatial-default when className is cleared"* |
| Class invariant: native paths self-heal (I1) | `useDomProxy.coverage.test.ts` — *"restores xr-spatial-default after native class mutations strip it"* |
| Class invariant: token, not substring (I1) | `useDomProxy.coverage.test.ts` — *"treats xr-spatial-default as a class token, not a substring"* |
| CSS rule is class-scoped, not global (I2) | `coverage-boost.test.ts` — *"injectSpatialDefaultStyle adds style tag with class-scoped data-xr-host rules"* |

## Quick reference for new contributors

If you are adding behavior to the standard host:

1. **Read this doc first.** Identify which invariants your change touches.
2. **Don't write `transform` / `visibility` / `transition` inline on the host.** Use a class or a `data-*` attribute that gates a CSS rule.
3. **Don't trust user-supplied props for SDK-controlled attributes.** Place them after `{...restProps}` in JSX.
4. **For class-token tests, use `classList.contains` / `classList.add`.** Never `indexOf`.
5. **For class-attribute mutations from any source, assume someone bypasses the descriptor.** Rely on the `MutationObserver` self-heal in `SpatialContainerRefProxy.attachStandardClassObserver`.
6. **For new SDK-controlled CSS rules**, scope them via `.xr-spatial-default[data-xr-host]` (or stricter) so unrelated DOM is unaffected. Add `!important` only when the contract truly requires "user CSS cannot override us".
7. **Add at least one regression test per new invariant**, and update the table above.
