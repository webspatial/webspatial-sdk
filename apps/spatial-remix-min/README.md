# spatial-remix-min

Minimal **[React Router 7](https://reactrouter.com)** framework app (**Remix-style** SSR + Vite) with **`@webspatial/react-sdk`**.

React Router v7 carries forward the Remix data APIs (`loader`, SSR). New upstream
projects use `create-react-router`; this fixture matches product ask for **Remix
SSR** while staying on the maintained stack.

## What it proves

- **SSR + streaming** via React Router’s server build (`react-router build`).
- **Lazy default entry** (`@webspatial/react-sdk`) with **`bootSpatial()` after
  mount** (aligned with spec “boot after hydrate”) on route **`/lazy`**.
- **`jsxImportSource: "@webspatial/react-sdk"`** so `<div enable-xr>` compiles
  through the SDK JSX runtime (see `tsconfig.json`).
- **Loader-based `User-Agent` read** on **`/server-ua`** — integrators should
  follow **official WebSpatial documentation** for UA rules in production (the
  demo only echoes the header + a trivial token check).

Sister demos: `apps/spatial-next-min` (Next.js), `apps/spatial-vite-min` (Vite SPA).

## Quick start

```sh
# From repo root — build published SDK artifacts first
pnpm install
pnpm -r --filter '@webspatial/*' build

pnpm --filter spatial-remix-min dev   # http://localhost:3040
pnpm --filter spatial-remix-min build
pnpm --filter spatial-remix-min start # production server on port 3040
pnpm --filter spatial-remix-min run typecheck
```

This app consumes **`packages/react/dist`** through the workspace symlink (same
contract as `spatial-vite-min` / `spatial-next-min`).

## Static assets

`<Model>` on **`/lazy`** loads **`public/modelasset/cone.usdz`** — the same
small USDZ used by `apps/test-server` demos (served at **`/modelasset/cone.usdz`**).

## Routes

| Path         | Purpose                                                           |
| ------------ | ----------------------------------------------------------------- |
| `/`          | Index with links                                                  |
| `/lazy`      | WebSpatial lazy entry + `useBootSpatial()` + `Model` + `enable-xr` |
| `/lazy-gate` | `<SpatialBoot gate fallback={…}>` — spatial subtree after boot      |
| `/server-ua` | `loader` returns `{ userAgent, hasWebSpatialToken }` for SSR HTML |

## See also

- [`docs/migration/lazy-load-spatial-runtime.md`](../../docs/migration/lazy-load-spatial-runtime.md) — bundler compatibility
- [`packages/react/README.md`](../../packages/react/README.md) — `jsxImportSource`, RSC / UA guidance

### Dev console noise

- **`Failed to resolve dependency: react-router-dom`** — the React Router Vite preset expects **`react-router-dom`** in dependencies (pinned to the same major as `react-router`). Missing it triggers this warning until `pnpm install` finishes.
- **`No route matches URL "/.well-known/appspecific/com.chrome.devtools.json"`** — Chrome DevTools probes that path; **`vite.config.ts`** includes a tiny dev middleware that returns **404** for `/.well-known/*` before the document handler runs.
