# spatial-next-min

Minimal **Next.js 15 App Router + React 18 + `@webspatial/react-sdk`** demo.

Validates the `lazy-load-spatial-runtime` spec under a real Server
Components / streaming SSR framework — the canonical framework target
named in `openspec/changes/lazy-load-spatial-runtime/REVIEW.md`.

Sister demo to `apps/spatial-vite-min/` (Vite SPA, same SDK). This one
goes further by exercising:

- **Server-side rendering** of facade fallback HTML
- **Hydration round-trip** (boot AFTER hydrate — the recommended pattern)
- **`'use client'` boundary** enforcement on facades + hooks
- **RSC import path** (a Server Component using a Group B/C utility
  without crossing the client boundary)
- **Migration parity** between `@webspatial/react-sdk` (lazy) and
  `@webspatial/react-sdk/eager` (eager) entries — same source, two
  import roots

## Quick start

```sh
# From the repo root (one-time)
pnpm install
pnpm -r --filter '@webspatial/*' build

# Then in this app
pnpm --filter spatial-next-min dev      # http://localhost:3030
pnpm --filter spatial-next-min build    # next build
pnpm --filter spatial-next-min start    # next start (after build)
pnpm --filter spatial-next-min test     # tsc --noEmit
```

> Note: the SDK MUST be built before this app can resolve any imports.
> This app deliberately consumes the published `dist/` exports of
> `@webspatial/react-sdk`, not the `src/` aliasing that
> `apps/test-server/` uses. Same trade-off as `spatial-vite-min`.

## Pages

| Route | Component file | Demonstrates |
|---|---|---|
| `/` | `app/page.tsx` | Pure RSC home with links. Zero SDK bytes — the page&apos;s server bundle does not import the SDK at all. |
| `/lazy` | `components/LazyDemo.tsx` | **Recommended pattern.** `<SpatialBoot>` — boot after mount; spatial `children` mount only when ready. Plain web: microtask boot. WebSpatial: dynamic spatial chunk. |
| `/lazy-gate` | `components/LazyGateDemo.tsx` | Same contract with optional `<SpatialBoot fallback={…}>` while boot is in flight. Boot failure: `onError`; children stay unmounted. |
| `/eager` | `components/EagerDemo.tsx` | Eager entry (`@webspatial/react-sdk/eager`). Pure client route — spatial statically linked; no `bootSpatial()` required. |
| `/eager-ssr` | `app/eager-ssr/page.tsx` + `components/EagerSpatialIsland.tsx` | **SSR + eager:** RSC page reads `User-Agent`; spatial via `dynamic(..., { ssr: false })`. View-source should show loader JSON + loading placeholder, not server `<Model>`. |
| `/capability-wrapper` | `components/CapabilityDemo.tsx` | Application-side custom degraded UI. Uses `useSpatialReady()` directly to branch between a flat poster card (plain web) and a real `<Model>` (WebSpatial). The pattern to reach for when the SDK&apos;s documented facade fallback is not aesthetic enough for your product. |
| `/server-only-util` | `app/server-only-util/page.tsx` | **Engineering demo:** pure RSC reads **`User-Agent` only** (no SDK import). Shows the supported request-time branching pattern — official WebSpatial UA docs, not `detectSpatialRuntime` or other server helpers. |

## The `'use client'` boundary rule (read this!)

Next.js App Router renders **everything as a Server Component by
default**. To use a spatial primitive (facade) or a public SDK hook,
the consuming file MUST be a Client Component:

```tsx
'use client'                            // ← required at top of file
import { Model, useSpatialReady } from '@webspatial/react-sdk'
```

The SDK itself already puts `'use client'` on every facade and every
hook file (spec tasks.md §4.6 and §5.2, verified in
`packages/react/src/__tests__/use-client-directive.test.ts`). What that
gives you is: **importing a facade auto-pushes the client boundary
upward**. You still need the directive on YOUR component file, otherwise
Next.js will reject your code with:

> Error: You&apos;re importing a component that needs `useState`. It only
> works in a Client Component, but none of its parents are marked with
> `'use client'`.

### Recommended file layout

- **`app/*/page.tsx`** — Server Component (no directive). Imports a
  single `<MyClientComponent />` and renders it.
- **`components/MyClientComponent.tsx`** — `'use client'` at top.
  Imports facades / hooks / `bootSpatial`. All spatial UI lives here.

This is exactly what `app/lazy/page.tsx` + `components/LazyDemo.tsx`
demonstrate, on purpose, so you can copy the pair into your own project.

### Counter-example

If you import `Model` directly inside `app/lazy/page.tsx` (no `'use
client'`), the build will fail. Try it once to feel the error — it&apos;s
the standard Next.js App Router learning curve, not a WebSpatial
gotcha.

## Boot timing (boot-after-hydrate)

The spec covers two SSR timings (`tasks.md §13.5` and §13.6):

- **boot AFTER hydrate** (this demo): server renders facade fallback
  HTML → client hydrates with `useSpatialReady() === false` → the
  hydration matches the server output → `useEffect` calls
  `bootSpatial()` → bridge flips → next commit swaps to real
  implementations.
- **boot BEFORE hydrate**: server renders facade fallback → client
  awaits `bootSpatial()` before calling `hydrateRoot` → hydration also
  runs with `useSpatialReady() === false` (the spec pins
  `getServerSnapshot` to a stable `false` constant) → post-hydrate
  commit swaps to real implementations.

**Next.js App Router does NOT expose `hydrateRoot` to the consumer**,
so the boot-before-hydrate timing is not a clean pattern here. This
demo therefore uses the recommended boot-after-hydrate flow. The unit
tests under `packages/react/src/__tests__/ssr-hydration.test.tsx`
verify the boot-before-hydrate path in vanilla React.

## How to verify the demo is doing what the spec promises

### 1. SSR HTML contains facade fallback (not blank, not spatial)

```sh
pnpm --filter spatial-next-min dev
# then:
curl -s http://localhost:3030/lazy | grep -oE '<model[^>]*>|enable-xr'
```

Expected output: a `<model ...>` tag for the Model facade and **NO**
`enable-xr` attribute (the JSX runtime strips the marker on both
server and client; only the wrapper&apos;s output reaches the DOM).

### 2. Plain-web client does NOT fetch the spatial chunk

Open `http://localhost:3030/lazy` in plain Chrome → DevTools Network
panel → filter `chunk-`. After the page settles, **no
`spatial-*.js` / `chunk-*SHX6AI5C*.js` request is in flight**. The
bridge&apos;s dynamic `import('@webspatial/react-sdk/spatial')` is
guarded by `detectSpatialRuntime() !== null`, so it never fires in a
plain browser.

### 3. Eager page DOES inline the spatial implementation

Navigate to `http://localhost:3030/eager` → Network panel → the
page&apos;s main chunk is larger than `/lazy`&apos;s. Open
`view-source:http://localhost:3030/eager`: the inlined `<script>`
preload references include the spatial implementation directly.

### 4. RSC page does NOT pull spatial into the server bundle

`pnpm --filter spatial-next-min build` → inspect
`.next/server/app/server-only-util/page.js` → grep for
`SpatializedContainer`, `withSpatialMonitor`, `Entity`. **No hits.**
The Group B/C utilities import path is fully separate from the spatial
chunk.

### 5. `useSpatialReady()` stays false on plain web

Inspect `/capability-wrapper` in plain Chrome. The page renders the
&quot;Spatial preview unavailable&quot; flat poster card and the line
&quot;useSpatialReady currently returns: false&quot;. In the AVP simulator
the same page renders a real `<Model>`.

## Known gotchas

1. **Turbopack is disabled.** `lazy-load-spatial-runtime` spec lists
   Next.js Turbopack as **out of scope for v1**. `next.config.js` pins
   the bundler to Webpack to align with the spec&apos;s tested target. To
   try Turbopack anyway, run `next dev --turbo` — the SDK will likely
   still work (it follows standard ESM + `exports` + dynamic-import
   semantics), but it is not covered by any contract.
2. **`<Model>` points at `public/modelasset/cone.usdz`.** Same small USDZ as
   `apps/test-server/public/modelasset/cone.usdz`, copied here so Next dev serves
   it at `/modelasset/cone.usdz`. On plain web the facade renders a degraded
   `<model>` tag; WebSpatial loads the shipped file for the spatial primitive.
3. **`bootSpatial()` rejection only matters in WebSpatial.** Per the
   spec, `bootSpatial()` resolves synchronously on plain web. Catching
   `WebSpatialBootError` in the demo is for migration parity — that
   error path only fires when the bridge&apos;s dynamic `import()`
   actually fails inside a WebSpatial runtime.
4. **Mixed-import warning is not exercised here.** Each page imports
   from exactly one entry (default OR eager), and Next.js page
   navigation unmounts the previous page before mounting the next, so
   the dev-mode warning about co-mounting facades from both entries
   never fires. If you ever see that warning, look for a file that
   imports `Model` from `@webspatial/react-sdk` AND another file that
   imports `Model` from `@webspatial/react-sdk/eager` reachable from
   the same render pass.

## Cross-references

- Consumer-shaped Vite demo: `apps/spatial-vite-min/`
- Measured size-impact report: `docs/lazy-load-spatial-runtime-size-impact.md`
- Migration steps: `docs/migration/lazy-load-spatial-runtime.md`
- Spec (normative): `openspec/changes/lazy-load-spatial-runtime/`
- SSR unit tests (lower-level evidence): `packages/react/src/__tests__/ssr-hydration.test.tsx`
