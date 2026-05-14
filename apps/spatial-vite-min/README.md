# spatial-vite-min

Minimal **Vite + React 18 + `@webspatial/react-sdk`** example. Demonstrates
the lazy-load v1 architecture **without** `@webspatial/vite-plugin`.

## What this fixture verifies

- The SDK's JSX runtime (resolved via `tsconfig "jsxImportSource"`) strips
  the `enable-xr` marker and wraps the host element with
  `withSpatialized2DElementContainer('div')` — no build plugin needed.
- `bootSpatial()` is the only required runtime hook in the application
  entry. In plain web browsers it resolves on the next microtask; in
  WebSpatial-capable runtimes it dynamically loads
  `@webspatial/react-sdk/spatial`.
- Vite's default code-splitting emits the spatial chunk as a separate
  `dist/assets/spatial-*.js` file that is fetched on demand by the
  bridge — confirming the published-bundle shape works end-to-end
  through a standard consumer build pipeline.
- The default-entry bundle stays lean (the spatial chunk is fetched
  on demand). Verify by running `vite build` and inspecting
  `dist/assets/`: both the main entry chunk and a separate
  `spatial-*.js` chunk should be present.

## How it imports the SDK (read this first)

This fixture **does NOT** use a Vite alias to bypass `dist/`. It
intentionally consumes the published `exports` in
`packages/react/package.json`, so Vite resolves
`@webspatial/react-sdk` through the workspace symlink and reads from
`packages/react/dist/`. Compare to `apps/test-server/esbuild.mjs`,
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
pnpm --filter spatial-vite-min dev      # http://localhost:5173/
pnpm --filter spatial-vite-min build    # production build
pnpm --filter spatial-vite-min preview  # serve the built artifact
```

## Browser smoke checklist

- Plain Chrome (`http://localhost:5173/`): spatial-div cells render as
  flat boxes; the `<Model>` shows a poster `<model>` element with no
  spatial behavior; no `console.error` from the SDK.
- AVP simulator / PICO emulator: spatial-div cells float as slabs;
  `<Model>` mounts the real spatial 3D primitive after `bootSpatial()`
  resolves.
- Puppeteer harness (UA contains `Puppeteer`): same as AVP — the SDK
  classifies `Puppeteer` as a spatial-equivalent runtime, so the
  spatial chunk is dynamically imported.
