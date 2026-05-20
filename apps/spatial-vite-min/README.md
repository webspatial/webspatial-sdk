# spatial-vite-min

Minimal **Vite + React 18 + `@webspatial/react-sdk`** example. Demonstrates
the lazy-load v1 architecture **without** `@webspatial/vite-plugin`, and
ships **two extra HTML pages** that import `@webspatial/react-sdk/eager` so
the same consumer pipeline exercises the eager distribution form (with and
without calling `bootSpatial()`).

## What this fixture verifies

- The SDK's JSX runtime (resolved via `tsconfig "jsxImportSource"`) strips
  the `enable-xr` marker and wraps the host element with
  `withSpatialized2DElementContainer('div')` — no build plugin needed.
- **Lazy page (`index.html` → `src/main.tsx`):** `bootSpatial()` is the
  primary runtime hook. In plain web browsers it resolves on the next
  microtask; in WebSpatial-capable runtimes it dynamically loads
  `@webspatial/react-sdk/spatial`.
- **Lazy + gate (`lazy-gate.html` → `src/main-lazy-gate.tsx`):** wraps the
  app in `<SpatialBoot gate fallback={…}>` so the spatial subtree mounts only
  after boot (see `docs/design/spatial-boot-component.md`).
- **Lazy production graph:** Vite's default code-splitting emits the spatial
  chunk as a separate `dist/assets/spatial-*.js` file that is fetched on
  demand by the bridge — confirming the published-bundle shape works
  end-to-end through a standard consumer build pipeline.
- **Eager + boot (`eager.html` → `src/main-eager.tsx`):** imports
  `@webspatial/react-sdk/eager` (spatial **statically linked**). Still
  `await bootSpatial()` so the file mirrors `main.tsx` during migration; on
  the eager entry `bootSpatial()` is a documented no-op (optional dev-only
  warning).
- **Eager, no boot (`eager-lean.html` → `src/main-eager-lean.tsx`):** imports
  only what the UI needs from `@webspatial/react-sdk/eager` and mounts React
  immediately — the usual **spatial-only** shape when you are not sharing a
  bootstrap module with lazy apps.
- **enable-xr-monitor (`xr-monitor.html` → `src/main-xr-monitor.tsx`):** lazy
  entry demo for `<div enable-xr-monitor>` with nested `<div enable-xr>` cells;
  insert/remove or resize a layout block inside the monitor (box-size changes, not
  visibility-only) so the nested `enable-xr` grid and `Reality` placeholder shift;
  slabs re-sync in WebSpatial runtimes.
- Inspect `dist/assets/` after `vite build`: the eager entry graphs should
  **not** rely on the same lazy `import()` bridge pattern as the default lazy
  page.

## How it imports the SDK (read this first)

This fixture **does NOT** use a Vite alias to bypass `dist/`. It
intentionally consumes the published `exports` in
`packages/react/package.json`, so Vite resolves
`@webspatial/react-sdk` through the workspace symlink and reads from
`packages/react/dist/`. The **eager** pages resolve
`@webspatial/react-sdk/eager` the same way (subpath `exports`). Compare to `apps/test-server/esbuild.mjs`,
which DOES alias to `packages/react/src/` for fast SDK dev-loop —
the test-server choice is fine for daily SDK development, but it
hides whether the published `dist/` shape works in a real consumer
build.

This fixture closes that gap. The cost is that the SDK MUST be built
before this app can resolve any imports.

## First-time setup

```sh
# 1. Resolve workspace dependencies + symlinks
pnpm install

# 2. Build the SDK packages (core → react in dependency order)
npm run setup
# or, if `setup` is too coarse:
pnpm -r --filter '@webspatial/*' run build

# 3. Run this app
pnpm --filter spatial-vite-min dev
```

## Recommended dev-loop

If you are iterating on both this app AND the SDK:

```sh
# terminal 1 — SDK watch (rebuilds dist/ on every src change)
npm run watchNPM
# = concurrently "cd packages/core/ && npm run start" "cd packages/react/ && npm run start"

# terminal 2 — vite dev server
pnpm --filter spatial-vite-min dev
```

Round trip from "save SDK src file" to "Vite HMR" is typically 3–5
seconds.

## Run

```sh
pnpm --filter spatial-vite-min dev      # dev server

# Then open any page (nav links exist in the UI):
#   Lazy default:          http://localhost:5173/
#   Lazy + SpatialBoot gate: http://localhost:5173/lazy-gate.html
#   enable-xr-monitor:     http://localhost:5173/xr-monitor.html
#   Eager + bootSpatial:   http://localhost:5173/eager.html
#   Eager, no bootSpatial: http://localhost:5173/eager-lean.html

pnpm --filter spatial-vite-min build    # production build (all HTML inputs)
pnpm --filter spatial-vite-min preview  # serve the built artifact
```

## Static assets

The `<Model>` sample uses **`public/modelasset/cone.usdz`** — the same file as
`apps/test-server/public/modelasset/cone.usdz`, served at **`/modelasset/cone.usdz`**.

## Browser smoke checklist

- Plain Chrome (`/` or `/lazy-gate.html` or eager pages): spatial-div cells render as
  flat boxes; `<Model>` shows a poster `<model>` element; **`/` and `/lazy-gate`**
  also show a **Reality** scene-graph block as a single `aria-hidden` placeholder
  (no `BoxEntity` / `SceneGraph` children in the DOM until boot). **`/xr-monitor.html`**
  renders the monitor host with an insert/remove layout block plus a 3×2
  `enable-xr` grid (grid jumps when the block toggles). No
  `console.error` from the SDK.
- AVP simulator / PICO emulator: spatial-div cells float as slabs;
  `<Model>` mounts the real spatial 3D primitive. On the **lazy** page,
  `bootSpatial()` gates the dynamic spatial chunk; on **eager** pages spatial
  is already in the static graph (no dynamic boot on `eager-lean`).
- Puppeteer harness (UA contains `Puppeteer`): same as AVP — the SDK
  classifies `Puppeteer` as a spatial-equivalent runtime. On the **lazy**
  page the spatial chunk is dynamically imported; on **eager** pages spatial
  is already linked at build time.
