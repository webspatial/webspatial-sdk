# WebSpatial Quirks

This document records abnormal behaviours that normal web developers would not expect when running inside the WebSpatial runtime. Each section describes one quirk, the root cause, and the polyfill/workaround applied.

## Anchor Navigation

The scene polyfill installs a document click handler via `hijackWindowATag(...)` to handle navigation for anchor tags in a controlled way.

### What It Does

- It listens to `document.onclick` and walks up the DOM tree from the event target to find the nearest `<a>` element.
- If the anchor has a `target` and `target !== '_self'`, it prevents the default navigation and calls `window.open(url, target)`.
- If no special handling is needed, it lets the browser behavior continue.

### Nested Clicks

Clicks often originate from a nested element inside an anchor, for example:

```html
<a href="https://example.com" target="_blank">
  <img src="..." />
</a>
```

In this case the `event.target` is the `<img>`, not the `<a>`. The polyfill therefore uses the anchor found during event bubbling rather than relying on `event.target` being the anchor itself.

## SpatialDiv / `enable-xr` and CSS

A `<div enable-xr>` (SpatialDiv) is **not** a single DOM node for styling purposes. The SDK keeps a **standard host** in your page tree (`ref.current`) and a separate off-screen **probe** that feeds `transform` / `visibility` into the spatial platform. The visible UI is rendered in a portal; 3D transforms come from the probe's computed style, not from painting CSS transforms on the portal surface.

### Tag selectors (e.g. `h1 { transform: … }`)

**Symptom:** Stylesheets that target an HTML tag work on a plain element but seem ignored in spatial mode (no rotation / depth).

**Root cause (historical):** The probe was always a `<div>`, so rules like `h1 { transform: … }` never applied to the node `getComputedStyle` reads.

**Current behavior:** The probe uses the **same intrinsic tag** as the host when you write `<h1 enable-xr>`, `<section enable-xr>`, etc. Tag selectors should work in that case.

**Still broken or unreliable:**

- Selectors that depend on **page ancestors** (`.sidebar h1`, `#app > h1`) — the probe sits under a hidden parser container, not your layout tree.
- Wrapping a **custom React component** with `enable-xr` — the probe falls back to `div`; use a **class** or **inline `style`** instead of a tag selector on the component type.

### What to use instead

| Approach                                                           | Works for spatial transform                |
| ------------------------------------------------------------------ | ------------------------------------------ |
| Class selector (`.panel { transform: … }`)                         | Yes — `className` is mirrored host → probe |
| Inline `style={{ transform: … }}`                                  | Yes — applied to the probe                 |
| `ref.current.style.transform = '…'`                                | Yes — forwarded to the probe               |
| Tag selector on matching intrinsic (`h1 {}` with `<h1 enable-xr>`) | Yes (after probe tag mirror)               |
| Ancestor + tag (`.page h1 {}`)                                     | Often **no**                               |

### CSS-in-JS in SpatialDiv (styled-components, Emotion, …)

**Symptom:** Prop-driven styled updates (for example an opacity slider) briefly flash unstyled content in the spatial portal on visionOS / PICO.

**Root cause:** Portal UI renders in a separate child webview. Runtime CSS-in-JS libraries inject rules into the host `document.head` (often via `insertRule`, without changing visible `<style>` text). The portal must mirror those rules into its own `<head>` **before** the new class is painted.

**Current behavior:** The SDK mirrors host `document.head` into each active portal webview. This covers typical styled-components / Emotion setups that inject into the host page.

**Works when:**

- Styles are injected into the **host** `document.head` (default for styled-components and Emotion).
- You use SpatialDiv (`enable-xr`) or Attachment portal content with the shared `useSyncHeadStyles` path.

**Does not work / not supported:**

- `StyleSheetManager` (or similar) with a **custom target** outside the host document (for example a portal or shadow-root `document.head`).
- Compile-time CSS only (Tailwind, CSS Modules, Vanilla Extract) — different sync path; issues tend to be missing global `<link>` styles, not CSSOM flicker.

**Manual check:** test-server `#/styledComponentsSpatialTest` (host, child, nested tabs). On device, drag the opacity slider and/or run `window.__runStyledComponentsSpatialOpacitySweep()`; expect `mismatchFrames === 0`.

Maintainer details: `packages/react/src/spatialized-container/ARCHITECTURE.md` — _Portal head sync (CSS-in-JS)_.

### Dev workflow note

Changing only a CSS file may not update the spatial slab until the host document reloads or the SDK re-samples the probe (see `useSpatialTransformVisibility` — head `childList` changes and `domUpdated` events). The test-server uses esbuild + LiveReload (full page refresh), not Vite-style CSS HMR. Spatial windows on a headset/simulator may need a manual refresh separately from your desktop browser tab.

Maintainer details: `packages/react/src/spatialized-container/ARCHITECTURE.md`.

## Nested SpatialDiv / parent overflow

**Symptom:** A child `SpatialDiv` (`enable-xr`) is larger than its parent `SpatialDiv`, or extends past the parent's border. The child is still fully visible in spatial mode. Setting `overflow: hidden` on the parent does not clip the child spatial panel.

**Root cause:** Each `SpatialDiv` renders as its own native webview layer. On the platform side, a parent and its nested child are composited as sibling layers in a `ZStack`, not as a single nested surface. The parent's `overflow` CSS is mapped to scroll behavior (`scrollPageEnabled`), not to clipping child spatial layers.

**Current behavior:**

- Child `width` / `height` come from the child's own DOM layout (`getBoundingClientRect`), not capped by the parent.
- Non-`fixed` nested children are positioned relative to the parent's top-left.
- Parent `overflow: hidden` may clip **plain HTML** inside the parent portal, but does **not** clip a nested child `SpatialDiv`.
- Parent background material / corner radius clip applies only to the parent's own webview, not to child spatial panels.

**What to use instead:**

| Goal                            | Approach                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Keep child inside parent bounds | Constrain child CSS size (`max-width`, `max-height`, flex/grid) so the child layout does not exceed the parent |
| Clip content to a rounded panel | Use a single `SpatialDiv` and put overflow-sensitive UI in **plain HTML** inside that portal                   |
| Layered panels that may overlap | Accept that child spatial panels can extend past the parent; tune `--xr-back` / `z-index` for depth ordering   |

**Manual check:** test-server `#/nested-spatial-overflow`. Open in the visionOS simulator (or target device). Toggle child size and parent `overflow`; the spatial child panel should remain unclipped when larger than the parent. The plain-HTML reference block on the same page shows normal browser clipping for comparison.

Maintainer details: `packages/react/src/spatialized-container/ARCHITECTURE.md` — _Portal lifecycle and local dev (HMR)_.

## Dialog / overlay libraries (Radix-style) inside `enable-xr`

**Symptom:** Radix Dialog (or Headless UI / floating-ui overlays) wrapping a `<div enable-xr>` panel: pressing inside the panel falsely dismisses the dialog, Escape pressed inside the panel does nothing, and dropdown submenus / popovers triggered from inside the panel render on the flat page instead of in the panel.

**Root cause:** `enable-xr` content is React-portaled into a child-webview document; the host page keeps only a hidden placeholder. React synthetic events cross that boundary, but native `document` listeners, focus, and `document.body` portals do not. Dismissal libraries listen on the host `document` (`pointerdown`, `keydown`) and portal floating content to the host `document.body`.

**Current behavior (portal document bridge):**

- Host-document listeners for `pointerdown`, `pointerup`, `click`, `keydown`, and `focusin` are mirrored onto every active spatial portal document. The mirrored event's `target` / `composedPath()` are remapped to the host-side placeholder, so `content.contains(event.target)` style outside-press checks pass and Escape reaches host `keydown` listeners. There is no re-dispatch — the original listener is invoked directly with a proxied event.
- Interception arms when the first spatialized container mounts and stays armed, so listeners a dialog registers before its own panel finishes async portal registration are recorded and replayed. Validated against real `@radix-ui/react-dialog` (its DismissableLayer performs no `event.isTrusted` checks).
- For nested portals (dropdown submenus, popovers, tooltips) triggered from inside a panel, pass the spatial container to each portal part:

  ```tsx
  import { useSpatialPortalContainer } from '@webspatial/react-sdk'

  const container = useSpatialPortalContainer() // null on plain web → Radix default
  <DropdownMenu.Portal container={container}>…</DropdownMenu.Portal>
  // Every nested Portal part (Content AND SubContent) needs the container.
  ```

**Remaining limitations:**

- No native background dim/scrim and no true cross-native-layer modality yet — DOM-side blocking cannot affect sibling native spatial layers (Phase 2).
- Nested-portal content passed a spatial container is clipped to the panel's webview bounds; menus cannot hang outside the panel edge.
- Without the `container` override, Radix secondary portals still land on the host body — the bridge mirrors events, it does not relocate portals.
- Panel enter/exit animations during dialog teardown are not solved by this bridge.
- File inputs must live in the same `enable-xr` subtree as their trigger; cross-document hidden-input `.click()` is not supported.
- Listener types outside the whitelist (e.g. `mousemove`, `keyup`) are not mirrored.

**Manual check:** test-server `#/portal-bridge-dialog` (inline + real Radix dialog) and `#/dropdown-menu-test` (Radix submenu portaled into the panel).

Maintainer details: `packages/react/src/spatialized-container/portal-bridge/` (registry, listener mirror, event proxy) and `packages/react/src/useSpatialPortalContainer.ts`.
