# Spatial Div behavior lab

Side-by-side fixtures for `<div enable-xr>` (SpatialDiv) vs plain DOM.

Each scenario is a route under `#/spatial-div/...` and appears in the test-server
sidebar section **Spatial Div**.

Assumptions

- `jsxImportSource` is already `@webspatial/react-sdk`, so `enable-xr` as a JSX
  prop is handled by the runtime (matches other test-server pages).
- `--xr-back` / `--xr-depth` / `--xr-z-index` are passed unitless inline, same
  as the rest of this app. If a future SDK version expects `px`, change `Panel`
  in `shared.tsx` — one place.
- Tailwind is available for chrome. All _fixture_ rules are in `lab.css` on
  purpose: ancestor selectors, sticky, keyframes and `@property`-free depth
  transitions must come from a real stylesheet to test what the table asks.

Method

- Every scenario renders the same fixture twice: plain DOM (CSS reference) on
  the left, `enable-xr` on the right. Any visual or logged difference is a
  finding.
- Readouts sample the _host_ DOM (`getBoundingClientRect`, `elementFromPoint`,
  observers, mount counts). Compare against where the native surface actually
  draws.

Scenario → table row
01 layout · 02 styles · 1b dynamic-stylesheets · 1c environment-queries ·
03 transforms · 04 clipping · 05 scroll · 06 stacking · 07 visibility ·
08 animation · 09 input · 12 gestures · 13 focus · 10 dom-apis ·
14 lifecycle · 11 overlays · 5b document-listeners · 5c modality ·
6b anchored-portals

Known deliberate provocations

- 02 / 1b: runtime `<style>`, CSSOM `insertRule` (no DOM mutation), and
  `adoptedStyleSheets` are the CSS-in-JS "copied stylesheet" test.
- 08: `CSS.registerProperty('--xr-back')` may fight the SDK's own parsing.
  That is a result, not a bug in the lab. WAAPI and `animation-timeline:
scroll()` are additional timelines the spatial surface must own.
- 11: raw `enable-xr` inside a shadow root / `srcdoc` iframe vs JSX
  `createPortal` into those trees. Raw attributes are expected to do nothing
  unless the SDK observes plain DOM.
- 6b: the float is portaled to `document.body` and positioned from the host
  trigger rect. A raised trigger (`--xr-back`) is the "stay flat vs inherit
  plane" provocation; autoUpdate listens only to host scrollers.
- 12: spatial tap/drag handlers only log; they do not move the panel.
- 14: `onSpatialContentReady` is expected on a spatial runtime only, not the
  plain-web fallback. StrictMode may replay effects in development.
