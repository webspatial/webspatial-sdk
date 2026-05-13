# Migrating to lazy-load `@webspatial/react-sdk`

This guide covers the upgrade from `@webspatial/react-sdk` `1.5.x` (or earlier) to the lazy-load v1 architecture. **It is a BREAKING change.**

The new architecture removes the dual-build (`dist/web` + `dist/default`) plus the alias-switching `@webspatial/vite-plugin` in favor of a single flat `dist/` layout where the spatial implementation lives in a dynamically importable subpath (`@webspatial/react-sdk/spatial`). Plain browsers pay only the lean default entry; the spatial chunk is fetched only when an application opts in via `bootSpatial()` from a WebSpatial-capable runtime.

The full normative contract lives in [`openspec/specs/spatial-lazy-load/spec.md`](../../openspec/specs/spatial-lazy-load/spec.md) and [`openspec/specs/runtime-capabilities/spec.md`](../../openspec/specs/runtime-capabilities/spec.md). This guide is the human-readable summary plus the migration recipes.

---

## TL;DR

1. **Remove `@webspatial/vite-plugin`** from your build pipeline (uninstall + delete the plugin entry from `vite.config.ts` / `webpack.config.js` / etc.).
2. **Add `await bootSpatial()` before your first React render** in WebSpatial-runtime entry points. In plain browsers it resolves immediately and never fetches the spatial chunk; in WebSpatial shells it loads the spatial chunk over the network.
3. **Stop importing the four internal containers** (`SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`) — use the public `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(Comp)` HOCs instead.
4. **Replace `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` imports** with the default `@webspatial/react-sdk` entry. Both legacy subpaths are removed.
5. **Confirm React `>=18.0`** is installed. React 18's `useSyncExternalStore` is a hard requirement.

---

## Step 1 — Drop `@webspatial/vite-plugin`

Before:

```ts
// vite.config.ts (1.5.x)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webSpatial from '@webspatial/vite-plugin'

export default defineConfig({
  plugins: [react(), webSpatial({ output: 'avp' })],
})
```

After:

```ts
// vite.config.ts (lazy-load v1)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

The lazy-load v1 SDK does not need a build plugin. The single bundle output works in both plain web and WebSpatial runtimes; the runtime decides which path to take.

If you also have `@webspatial/builder` invocations (e.g. `webspatial build --xrTarget=avp`), they continue to work for packaging-only concerns; they no longer rewrite the SDK's import path.

---

## Step 2 — Call `bootSpatial()` before your first render

The lazy-load v1 SDK loads the real spatial implementation on demand. Until you call `bootSpatial()`, every facade renders its documented per-component fallback (see the README's "Default fallbacks per component" table). The recommended integration is:

```tsx
import { bootSpatial } from '@webspatial/react-sdk'
import ReactDOM from 'react-dom/client'
import App from './App'

await bootSpatial()
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

`bootSpatial()` semantics:

- In a non-WebSpatial browser (`navigator.userAgent` does not match the WebSpatial / PICO shells nor the Puppeteer test harness), it resolves immediately and never fetches the spatial chunk. **Plain web users pay zero network for the spatial code.**
- In a WebSpatial runtime, it dynamically imports `@webspatial/react-sdk/spatial`. The bundler (Vite, Webpack, Rspack, …) emits this as a separate chunk that is fetched once.
- It is **idempotent**: concurrent / repeated calls share the same promise.
- It supports **retry on failure**: after a rejection, calling `bootSpatial()` again starts a fresh `import()`.
- It **never throws raw `import()` errors**; rejection is always a `WebSpatialBootError` whose `cause` is the underlying error.

If you need to call `bootSpatial()` later (e.g. inside `useEffect`), facades and hook placeholders will keep rendering their fallback until the promise resolves; on the next React commit after the bridge becomes ready, **mounted facades automatically swap to the real implementation** (no `key` change required).

There is one caveat: **public spatial hooks (currently `useMetrics`) do NOT switch mid-life**. A component instance that first invoked `useMetrics()` while the bridge was unready continues using the placeholder for its entire lifetime. To start using the real hook, the component must be unmounted and remounted (e.g. via a `key` change, parent unmount, or page reload). This is intentional — it keeps the React Hook call sequence consistent for the instance's lifetime.

### Boot before vs after `hydrateRoot`

For SSR consumers (Next.js App Router, custom SSR pipelines):

- **Boot before hydrate** (`await bootSpatial(); hydrateRoot(...)`): the spatial chunk fetch starts in parallel with HTML streaming. The hydration pass still uses fallback rendering (matching the SSR HTML); the swap to real implementations happens on the React commit immediately after hydration. Hydration is mismatch-safe.
- **Boot after hydrate** (`hydrateRoot(...); void bootSpatial()`): the page is interactive faster (no boot-related delay). The spatial chunk loads after hydration; on resolution the next commit swaps to real implementations. Slightly later swap point than boot-before, but still mismatch-safe.

Both timings produce identical hydration safety because `useSpatialReady` is implemented with `useSyncExternalStore` and a stable `getServerSnapshot` returning `false`.

---

## Step 3 — Use HOC facades instead of internal containers

The four internal container classes are no longer publicly exported:

| Removed (BREAKING) | Replacement |
| --- | --- |
| `SpatializedContainer` | Use `withSpatialized2DElementContainer(Comp)` HOC; the facade decides at render time whether to mount the real container or the transparent passthrough |
| `Spatialized2DElementContainer` | Same as above |
| `SpatializedStatic3DElementContainer` | Use `<Model {...} />`; the `Model` facade owns this internally |
| `SpatialMonitor` | Use `withSpatialMonitor(El)` HOC |

Before:

```tsx
import { Spatialized2DElementContainer } from '@webspatial/react-sdk'

function MyContainer() {
  return <Spatialized2DElementContainer component="div">...</Spatialized2DElementContainer>
}
```

After:

```tsx
import { withSpatialized2DElementContainer } from '@webspatial/react-sdk'

const SpatializedDiv = withSpatialized2DElementContainer('div')

function MyContainer() {
  return <SpatializedDiv>...</SpatializedDiv>
}
```

The HOCs cache their wrapper output by raw component reference (per-render identity preserved), so `withSpatialized2DElementContainer('div')` always returns the same wrapper across renders.

---

## Step 4 — Drop `@webspatial/react-sdk/web` and `/default` subpaths

Both legacy subpaths have been hard-removed. Use the default entry:

```ts
// Before
import { Model } from '@webspatial/react-sdk/web'
import { Reality } from '@webspatial/react-sdk/default'

// After
import { Model, Reality } from '@webspatial/react-sdk'
```

The default entry contains facades that handle web-mode and spatial-mode rendering automatically, so a single import path works in every runtime.

---

## Step 5 — `createElement` (classic JSX transform) is deprecated

Applications using the classic JSX transform (`tsconfig` `"jsx": "react"` plus `"jsxFactory": "createElement"`) imported `createElement` from the SDK. That export is now `@deprecated`:

```ts
// Still works in v1; will be removed in v2.
import { createElement } from '@webspatial/react-sdk'
```

Migrate to the automatic JSX transform:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@webspatial/react-sdk"
  }
}
```

(Or `"jsx": "react-jsxdev"` for development builds; the SDK ships both `./jsx-runtime` and `./jsx-dev-runtime` subpaths.)

The new JSX runtime strips spatial markers (`enable-xr`, `enable-xr-monitor`, `style.enableXr`, `className __enableXr__`) and wraps the element with the corresponding facade HOC in a single pass — no SDK import required at the call site.

---

## Bundler compatibility

The lazy-load v1 SDK relies on three bundler capabilities:

1. **ECMAScript modules** — the package is published as ESM (`"type": "module"`). CommonJS `require()` is not supported.
2. **`exports` package.json field** — for subpath resolution of `'.'`, `./jsx-runtime`, `./jsx-dev-runtime`, and `./spatial`.
3. **Dynamic `import()` with code-splitting** — the bridge invokes `import('@webspatial/react-sdk/spatial')`; the bundler must emit the spatial chunk as a separate output that is fetched on demand. Without code-splitting (e.g. bare esbuild without `splitting: true`), the bundler will inline the spatial chunk into the main bundle. **The SDK still functions correctly** but the per-application size benefit is lost on that consumer's bundle.

### Tested-target list (non-normative)

These bundlers / frameworks satisfy all three capabilities and are exercised in the SDK's CI:

- Vite ≥ 4
- Webpack ≥ 5
- Rollup ≥ 3
- Rspack ≥ 1
- esbuild ≥ 0.18 with `splitting: true`
- **Next.js App Router** (Webpack mode) — canonical RSC framework target
- **Next.js Pages Router**

### Out-of-scope environments (v1)

The following environments MAY work in practice but are NOT part of the v1 contract; failures there should be reported as feature requests / follow-up issues, NOT v1 spec violations:

- Module Federation / micro-frontend host-shared SDK setups
- **Next.js Turbopack** (`next dev --turbo`, `next build --turbo`)
- Webpack 4 and any other bundler without `exports` package.json field support
- CommonJS-only consumer pipelines

If you depend on one of these environments, please open an issue at <https://github.com/webspatial/webspatial-sdk/issues> so we can prioritize.

---

## RSC (React Server Components) consumers

The default entry carries a top-level `'use client'` directive, so the entire `@webspatial/react-sdk` is treated as a Client Component boundary by the RSC compiler. Importing facades from a Server Component file works:

```tsx
// app/page.tsx (Server Component)
import { Model } from '@webspatial/react-sdk'

export default function Page() {
  return <Model src="/assets/robot.usdz" />
}
```

Subsequent hydration on the client uses `useSpatialReady`'s `getServerSnapshot` returning `false`, so the first client render produces fallback DOM matching the server-rendered HTML. The swap to real implementations happens on the React commit after hydration completes. Hydration mismatches are not possible from the SDK alone — the only way to trigger one is to feed different props to a facade server-side vs client-side, which is the application's responsibility.

The SDK's pure re-exports (`WebSpatialRuntime.supports`, `WebSpatialRuntimeError`, `getAbsoluteUrl`, type-only re-exports) are reachable from the same client subgraph because the `'use client'` boundary is at the SDK's public entry. If you need React-less consumption from a Server Component, track the follow-up issue listed in the spec's `tasks.md` §12.

---

## Hook contract change: per-instance pinning

Pre-v1, `useMetrics` would silently switch from web fallback to real spatial values across renders if `bootSpatial()` resolved between two renders. Lazy-load v1 makes this **deterministic**:

- A component instance that first invoked `useMetrics()` while the bridge was unready continues using the placeholder for its entire lifetime.
- To start using the real hook implementation, the component must be unmounted and remounted (e.g. via a `key` change, parent unmount, or page reload).

This change is required by the spec's "Hook implementation does not switch mid-life" Scenario, which keeps the React Hook call sequence consistent across the instance's lifetime (Rules of Hooks).

The placeholder return value is unchanged: `pointToPhysical(pt) === pt / 1360`, `physicalToPoint(m) === m * 1360`. If your code performed math on these values, the numerics are stable across the upgrade.

---

## CHANGELOG-style summary of breaking changes

- **BREAKING**: removed `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` subpaths — use the default `@webspatial/react-sdk` entry.
- **BREAKING**: `@webspatial/vite-plugin` is no longer required and the SDK no longer participates in any plugin-driven import rewriting.
- **BREAKING**: removed public exports `SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor` — use the `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(Comp)` HOCs.
- **BREAKING**: `react` and `react-dom` are now required peer dependencies (`>=18.0`); React 17 and earlier are no longer supported.
- **BREAKING**: spatial code is now lazy-loaded via `bootSpatial()`; applications that previously relied on spatial primitives mounting real implementations on first render MUST `await bootSpatial()` before `ReactDOM.createRoot(...).render(...)` (or accept the documented fallback-to-real swap on the next React commit after `bootSpatial()` resolves later).
- **BREAKING**: a component instance that calls `useMetrics()` (and any future spatial Hooks) now pins the placeholder-vs-real choice for its lifetime; remount required to switch to the real implementation after a late `bootSpatial()`.
- **DEPRECATED**: `createElement` named export — migrate to the automatic JSX transform (`./jsx-runtime` / `./jsx-dev-runtime`). Removal scheduled for v2.

---

## Where to file issues

If you hit a rough edge during the upgrade, please file an issue at <https://github.com/webspatial/webspatial-sdk/issues> with:

- The bundler / framework you use (Vite, Webpack, Next.js, …) and its version
- The runtime where the failure surfaces (plain Chrome, AVP, PICO, SSR)
- A minimal reproduction (StackBlitz / repo link if possible)
