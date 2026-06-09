# WebSpatial Quirks

This document records abnormal behaviours that normal web developers would not expect when running inside the WebSpatial runtime. Each section describes one quirk, the root cause, and the polyfill/workaround applied.

## Entity names and USD-safe identifiers

WebSpatial entity `name` values must use USD-safe identifiers. Do **not** use hyphens (`-`) or other special characters in names; prefer camelCase (`robotArm`) or underscores (`robot_arm`).

RealityKit may appear to tolerate some unsupported characters in limited cases, but Reality Composer Pro (RCP) does not preserve them and replaces them with underscores. Runtime workflows such as serialization, USD export, and playback also depend on stable names, so hyphenated entity names are not supported by WebSpatial.

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

| Approach | Works for spatial transform |
| --- | --- |
| Class selector (`.panel { transform: … }`) | Yes — `className` is mirrored host → probe |
| Inline `style={{ transform: … }}` | Yes — applied to the probe |
| `ref.current.style.transform = '…'` | Yes — forwarded to the probe |
| Tag selector on matching intrinsic (`h1 {}` with `<h1 enable-xr>`) | Yes (after probe tag mirror) |
| Ancestor + tag (`.page h1 {}`) | Often **no** |

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

Maintainer details: `packages/react/src/spatialized-container/ARCHITECTURE.md` — *Portal head sync (CSS-in-JS)*.

### Dev workflow note

Changing only a CSS file may not update the spatial slab until the host document reloads or the SDK re-samples the probe (see `useSpatialTransformVisibility` — head `childList` changes and `domUpdated` events). The test-server uses esbuild + LiveReload (full page refresh), not Vite-style CSS HMR. Spatial windows on a headset/simulator may need a manual refresh separately from your desktop browser tab.

Maintainer details: `packages/react/src/spatialized-container/ARCHITECTURE.md`.
