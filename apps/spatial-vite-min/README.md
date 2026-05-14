# spatial-vite-min

Minimal **Vite + React 18 + `@webspatial/react-sdk`** example. Demonstrates
the lazy-load v1 architecture **without** `@webspatial/vite-plugin`, and
ships a **second page** that imports `@webspatial/react-sdk/eager` so the
same consumer pipeline exercises the eager distribution form.

## What this fixture verifies

- The SDK's JSX runtime (resolved via `tsconfig "jsxImportSource"`) strips
  the `enable-xr` marker and wraps the host element with
  `withSpatialized2DElementContainer('div')` — no build plugin needed.
- **Lazy page (`index.html` → `src/main.tsx`):** `bootSpatial()` is the
  primary runtime hook. In plain web browsers it resolves on the next
  microtask; in WebSpatial-capable runtimes it dynamically loads
  `@webspatial/react-sdk/spatial`.
- **Lazy production graph:** Vite's default code-splitting emits the spatial
  chunk as a separate `dist/assets/spatial-*.js` file that is fetched on
  demand by the bridge — confirming the published-bundle shape works
  end-to-end through a standard consumer build pipeline.
- **Eager page (`eager.html` → `src/main-eager.tsx`):** imports
  `@webspatial/react-sdk/eager` so spatial is **statically linked** with the
  app graph. `bootSpatial()` is still awaited for parity with the lazy page;
  on the eager entry it is a documented no-op (optional dev-only warning).
  Inspect `dist/assets/` after `vite build`: the eager entry bundle should
  **not** rely on the same lazy `import()` bridge pattern as the default
  entry page.

## How it imports the SDK (read this first)

This fixture **does NOT** use a Vite alias to bypass `dist/`. It
intentionally consumes the published `exports` in
`packages/react/package.json`, so Vite resolves
`@webspatial/react-sdk` through the workspace symlink and reads from
`packages/react/dist/`. The **eager** page resolves
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

# Then open either page (cross-links exist in the UI):
#   Lazy (default entry):  http://localhost:5173/
#   Eager entry:           http://localhost:5173/eager.html

pnpm --filter spatial-vite-min build    # production build (both HTML inputs)
pnpm --filter spatial-vite-min preview  # serve the built artifact
```

## Browser smoke checklist

- Plain Chrome (`http://localhost:5173/` or `/eager.html`): spatial-div cells render as
  flat boxes; the `<Model>` shows a poster `<model>` element with no
  spatial behavior; no `console.error` from the SDK.
- AVP simulator / PICO emulator: spatial-div cells float as slabs;
  `<Model>` mounts the real spatial 3D primitive after `bootSpatial()`
  resolves.
- Puppeteer harness (UA contains `Puppeteer`): same as AVP — the SDK
  classifies `Puppeteer` as a spatial-equivalent runtime. On the **lazy**
  page the spatial chunk is dynamically imported; on the **eager** page
  spatial is already in the static graph.
