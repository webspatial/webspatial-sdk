# Migrating to lazy-load `@webspatial/react-sdk`

This guide covers the upgrade from `@webspatial/react-sdk` v1 to v2. **It is a BREAKING change.** All breaking removals listed below happen in this major upgrade.

The v2 default entry is web-first: plain browsers and SSR render documented fallback HTML, and the real spatial implementation loads only after `bootSpatial()` runs in a WebSpatial-capable runtime. Spatial-only client apps can import `@webspatial/react-sdk/eager` to link the spatial implementation immediately.

The full normative contract lives in [`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`](../../openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) and [`openspec/specs/runtime-capabilities/spec.md`](../../openspec/specs/runtime-capabilities/spec.md). This guide is the human-readable summary plus the migration recipes.

---

## TL;DR

1. **Choose one React SDK import root per bundle.** Use `@webspatial/react-sdk` for web / SSR-capable apps; use `@webspatial/react-sdk/eager` only for CSR-only spatial apps.
2. **Wrap React spatial UI in `<SpatialBoot>`** from `@webspatial/react-sdk`. It calls `bootSpatial()` after mount, renders `null` while boot is pending, and mounts children only after boot succeeds.
3. **Use `await bootSpatial()` before `createRoot()` only as a CSR / imperative optimization.** In plain browsers it resolves immediately and never fetches the spatial chunk; in WebSpatial shells it loads the spatial chunk over the network.
4. **Replace `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` imports** with `@webspatial/react-sdk` or `@webspatial/react-sdk/eager`. Both legacy subpaths are removed.
5. **Stop importing removed public exports**: internal containers (`SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`), factory HOCs (`withSpatialized2DElementContainer`, `withSpatialMonitor`), `Spatialized2DElementContainerProps`, `SSRProvider`, and `getAbsoluteUrl`.
6. **Confirm React `>=18.0`** is installed. React 18's `useSyncExternalStore` is a hard requirement.

---

## Choosing the eager entry

Use **`import { … } from '@webspatial/react-sdk/eager'`** when the app targets **only** WebSpatial-capable environments and you want the spatial implementation **statically linked** (roughly one sync request, no real `bootSpatial()` work — the call is a **no-op stub**). Export names mirror the default entry; migrating is **`import`-root-only**.

**SSR / prerender caveat:** spatial primitives imported from **`@webspatial/react-sdk/eager`** MUST NOT run during server-side rendering — that path is **client-only**. If your HTML snapshot must include façade fallbacks for `<Model />`, `<Reality />`, etc., keep **`@webspatial/react-sdk`** as the import root for those routes. Alternatively, CSR-gate eager-imported primitives (Next.js **`dynamic(import('...'), { ssr: false })`**, or mount spatial UI only in `useEffect` / after `typeof window`).

Hydration-safe façade SSR is specified for the **default** entry only (see **`bootSpatial` before vs after `hydrateRoot`** below).

**Do not** mix `@webspatial/react-sdk` and `@webspatial/react-sdk/eager` in the same bundle — pick one root per app.

Further detail: [`packages/react/README.md` → "Two distribution forms"](../../packages/react/README.md#two-distribution-forms-default-vs-eager) and [`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`](../../openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) ("Entry routing", "CSR-only for spatial primitives").

---

## Step 1 — Boot with `<SpatialBoot>` in React apps

The lazy-load SDK loads the real spatial implementation on demand. For React applications, the recommended integration is `<SpatialBoot>`:

```tsx
import { SpatialBoot } from '@webspatial/react-sdk'

export function AppRoot() {
  return (
    <SpatialBoot>
      <App />
    </SpatialBoot>
  )
}
```

`SpatialBoot` calls `bootSpatial()` after mount. While boot is pending it renders `null`; children mount only after boot succeeds. There is no public `gate` or `fallback` prop — render loading UI in your surrounding app layout if needed. Use `onError` to show application-specific error UI if the spatial chunk fails to load.

### Optional CSR pre-boot

Pure client-rendered apps may still pre-await `bootSpatial()` before the first `createRoot()` render to shorten the blank period:

```tsx
import { bootSpatial, SpatialBoot } from '@webspatial/react-sdk'
import ReactDOM from 'react-dom/client'
import App from './App'

await bootSpatial()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <SpatialBoot>
    <App />
  </SpatialBoot>,
)
```

Use this as a CSR optimization, not as the default SSR / framework recipe. Next.js / React Router / Remix-style apps typically place `<SpatialBoot>` inside a `'use client'` subtree.

`bootSpatial()` semantics are the same whether it is called by `<SpatialBoot>` or manually:

- In a non-WebSpatial browser (`navigator.userAgent` does not match the WebSpatial / PICO shells nor the Puppeteer test harness), it resolves immediately and never fetches the spatial chunk. **Plain web users pay zero network for the spatial code.**
- In a WebSpatial runtime, it dynamically imports `@webspatial/react-sdk/spatial`. The bundler (Vite, Webpack, Rspack, …) emits this as a separate chunk that is fetched once.
- It is **idempotent**: concurrent / repeated calls share the same promise.
- It supports **retry on failure**: after a rejection, calling `bootSpatial()` again starts a fresh `import()`.
- It **never throws raw `import()` errors**; rejection is always a `WebSpatialBootError` whose `cause` is the underlying error.

If you call `bootSpatial()` without `<SpatialBoot>`, facades and hook placeholders keep rendering their fallback until the promise resolves; on the next React commit after the bridge becomes ready, **mounted facades automatically swap to the real implementation** (no `key` change required).

### Imperative refs during a late boot

If a facade mounts before `bootSpatial()` resolves, refs point at the fallback output for that first commit. For `Model`, that means a forwarded ref can initially point at the degraded `<webspatial-model-fallback>` host, not a spatial `ModelRef`. Do not use `modelRef.current.ready`, `entityTransform`, or other `ModelRef` APIs as a boot readiness signal from that fallback.

Those APIs are safe only after the component mounts with the real spatial implementation:

- Put the spatial subtree inside `<SpatialBoot>`; children mount only after the real implementation is ready.
- Or render/remount the spatial subtree only after `useSpatialReady()` returns `true`.

Avoid one-shot effects that capture a facade ref before boot and imperatively attach listeners or renderer state:

```tsx
function Drone() {
  const modelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = modelRef.current
    if (!el) return
    const onClick = () => console.log('clicked')
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [])

  return <Model ref={modelRef} src="/drone.glb" />
}
```

In that pattern the effect captures the fallback element; after the boot swap, the listener remains attached to the detached fallback node and is not attached to the real spatial implementation.

For late-boot custom wiring, gate the mounted `Model` itself on `useSpatialReady()`:

```tsx
function Drone() {
  const ready = useSpatialReady()
  const modelRef = useRef<ModelRef | null>(null)

  useEffect(() => {
    if (!ready) return
    const model = modelRef.current
    if (!model) return
    void model.ready.then(() => {
      model.entityTransform = new DOMMatrix()
    })
  }, [ready])

  if (!ready) return null
  return <Model ref={modelRef} src="/drone.glb" />
}
```

When the component above mounts, `ready` is already true, so `modelRef.current` is the real spatial `ModelRef`; `ready` and `entityTransform` are available on that object.

There are two hook contracts to keep in mind:

- `useMetrics()` uses a stable web placeholder. A component instance that first invoked it while the bridge was unready continues using the placeholder for its entire lifetime. To start using the real hook, the component must be unmounted and remounted (e.g. via a `key` change, parent unmount, or page reload).
- `useAnimation(config)` has no web fallback. Import it from `@webspatial/react-sdk`, but call it only from components that mount after spatial readiness, such as children of `<SpatialBoot>` or a tree rendered after an explicit `await bootSpatial()`. Calling it before readiness throws `WebSpatialRuntimeError` with capability `useAnimation`.

This is intentional — it keeps hook behavior deterministic and avoids changing the React Hook call sequence within a mounted component instance.

### Boot before vs after `hydrateRoot`

For SSR consumers (Next.js App Router, custom SSR pipelines) using the **default** entry `@webspatial/react-sdk` (not `@webspatial/react-sdk/eager`):

- **Boot before hydrate** (`await bootSpatial(); hydrateRoot(...)`): the spatial chunk fetch starts in parallel with HTML streaming. The hydration pass still uses fallback rendering (matching the SSR HTML); the swap to real implementations happens on the React commit immediately after hydration. Hydration is mismatch-safe.
- **Boot after hydrate** (`hydrateRoot(...); void bootSpatial()`): the page is interactive faster (no boot-related delay). The spatial chunk loads after hydration; on resolution the next commit swaps to real implementations. Slightly later swap point than boot-before, but still mismatch-safe.

Both timings produce identical hydration safety because `useSpatialReady` is implemented with `useSyncExternalStore` and a stable `getServerSnapshot` returning `false`.

---

## Step 2 — Use JSX markers instead of internal containers

The four internal container classes are no longer publicly exported:

| Removed (BREAKING)                    | Replacement                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SpatializedContainer`                | Use the JSX marker `<div enable-xr />`; the SDK JSX runtime wraps it with the internal facade HOC at compile time |
| `Spatialized2DElementContainer`       | Same as above                                                                                                     |
| `SpatializedStatic3DElementContainer` | Use `<Model {...} />`; the `Model` facade owns this internally                                                    |
| `SpatialMonitor`                      | Use the JSX marker `<div enable-xr-monitor />`                                                                    |

Before:

```tsx
import { Spatialized2DElementContainer } from '@webspatial/react-sdk'

function MyContainer() {
  return (
    <Spatialized2DElementContainer component="div">
      ...
    </Spatialized2DElementContainer>
  )
}
```

After:

```tsx
function MyContainer() {
  return <div enable-xr>...</div>
}
```

If you need a component value to pass into a third-party HOC, write a small shim whose JSX call site contains the marker:

```tsx
import { forwardRef } from 'react'

const SpatializedDiv = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<'div'>
>(function SpatializedDiv(props, ref) {
  return <div enable-xr ref={ref} {...props} />
})
```

The factory HOCs (`withSpatialized2DElementContainer` / `withSpatialMonitor`) still exist inside the SDK for JSX-runtime implementation details, but they are not public exports.

---

## Step 3 — Drop `@webspatial/react-sdk/web` and `/default` subpaths

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

## Step 4 — `createElement` (classic JSX transform) is deprecated

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
    "jsxImportSource": "@webspatial/react-sdk",
  },
}
```

(Or `"jsx": "react-jsxdev"` for development builds; the SDK ships both `./jsx-runtime` and `./jsx-dev-runtime` subpaths.)

The new JSX runtime strips spatial markers (`enable-xr`, `enable-xr-monitor`, `style.enableXr`, `className __enableXr__`) and wraps the element with the corresponding facade HOC in a single pass — no SDK import required at the call site.

---

## Bundler compatibility

The lazy-load v1 SDK relies on three bundler capabilities:

1. **ECMAScript modules** — the package is published as ESM (`"type": "module"`). CommonJS `require()` is not supported.
2. **`exports` package.json field** — for consumer subpath resolution of `'.'`, `./eager`, `./jsx-runtime`, `./jsx-dev-runtime`, and `./spatial`; the SDK also publishes `./internal/facades-client` for its own JSX-runtime boundary.
3. **Dynamic `import()` with code-splitting** — the bridge invokes `import('@webspatial/react-sdk/spatial')`; the bundler must emit the spatial chunk as a separate output that is fetched on demand. Without code-splitting (e.g. bare esbuild without `splitting: true`), the bundler will inline the spatial chunk into the main bundle. **The SDK still functions correctly** but the per-application size benefit is lost on that consumer's bundle.

### Tested-target list (non-normative)

These bundlers / frameworks satisfy all three capabilities and are exercised in the SDK's CI:

- Vite ≥ 4
- Webpack ≥ 5
- Rollup ≥ 3
- Rspack ≥ 1 — see `apps/spatial-rspack-min`
- esbuild ≥ 0.18 with `splitting: true`
- **Next.js App Router** (Webpack mode) — canonical RSC framework target
- **Next.js Pages Router**
- **React Router 7** (Remix-style SSR + Vite) — see `apps/spatial-remix-min/`

Rspack note: `apps/spatial-rspack-min/rspack.config.mjs` sets
`resolve.fullySpecified: false` for JavaScript modules because the current
`@webspatial/core-sdk` ESM build preserves extensionless package-internal
relative imports. Keep that setting in custom Rspack apps until the core SDK
emits fully specified `.js` import specifiers.

### Out-of-scope environments (v1)

The following environments MAY work in practice but are NOT part of the v1 contract; failures there should be reported as feature requests / follow-up issues, NOT v1 spec violations:

- Module Federation / micro-frontend host-shared SDK setups
- **Next.js Turbopack** (`next dev --turbo`, `next build --turbo`)
- Webpack 4 and any other bundler without `exports` package.json field support
- CommonJS-only consumer pipelines

If you depend on one of these environments, please open an issue at <https://github.com/webspatial/webspatial-sdk/issues> so we can prioritize.

---

## RSC (React Server Components) consumers

The following applies when spatial primitives are imported from the **default** entry `@webspatial/react-sdk`. If you use **`@webspatial/react-sdk/eager`**, do not rely on server HTML for those primitives — mount them **client-only** (see [Choosing the eager entry](#choosing-the-eager-entry)).

The default entry carries a top-level `'use client'` directive, so the entire `@webspatial/react-sdk` is treated as a Client Component boundary by the RSC compiler. Importing facades from a Server Component file works:

```tsx
// app/page.tsx (Server Component)
import { Model } from '@webspatial/react-sdk'

export default function Page() {
  return <Model src="/assets/robot.usdz" />
}
```

Subsequent hydration on the client uses `useSpatialReady`'s `getServerSnapshot` returning `false`, so the first client render produces fallback DOM matching the server-rendered HTML. The swap to real implementations happens on the React commit after hydration completes. Hydration mismatches are not possible from the SDK alone — the only way to trigger one is to feed different props to a facade server-side vs client-side, which is the application's responsibility.

The SDK's pure re-exports (`WebSpatialRuntime.supports`, `WebSpatialRuntimeError`, type-only re-exports) are reachable from the same client subgraph because the `'use client'` boundary is at the SDK's public entry.

For **request-time branching** in RSC or middleware (hero for WebSpatial vs plain web), use the **`User-Agent`** header and the **official WebSpatial site documentation** for classification. The SDK does **not** ship a `@webspatial/react-sdk/server` subpath or public `detectSpatialRuntime` helper in v1 — see [`packages/react/README.md` → "RSC, server requests, and runtime detection"](../../packages/react/README.md#rsc-server-requests-and-runtime-detection).

### `@webspatial/core-sdk` platform APIs on the server

Do **not** import `@webspatial/core-sdk` on the server and execute spatial side effects (`Spatial.requestSession()`, `JSBCommand.execute()`, scene polyfill / `openSpatialSceneSync`, etc.). `createPlatformSync()` now **throws** when `window` is unavailable instead of returning a silent no-op platform that reported `{ success: true }`.

Supported SSR uses the **React SDK default entry** (facades + `bootSpatial()` on the client) or CSR-gates eager spatial primitives. Polyfills install only via `import '@webspatial/core-sdk/install-polyfills'` from the client spatial chunk (`!isSSREnv()` guard). See [`openspec/changes/platform-ssr-fail-fast/proposal.md`](../../openspec/changes/platform-ssr-fail-fast/proposal.md).

> **Removed in this major release:** `getAbsoluteUrl` was promoted to the public surface by accident during the lazy-load redesign — the SDK only ever used it internally to feed the native bridge absolute asset URLs. Replace direct callers with `new URL(url, location.href).href` (browser) or your framework's URL helper (Next.js `metadataBase`, etc.) for server-side absolute URLs. The helper itself still exists under `src/internal/urlUtils.ts` for `Texture` / `ModelAsset` and is no longer a public-API commitment.

---

## Hook contract change: per-instance pinning

Pre-v1, `useMetrics` would silently switch from web fallback to real spatial values across renders if `bootSpatial()` resolved between two renders. Lazy-load v1 makes this **deterministic**:

- A component instance that first invoked `useMetrics()` while the bridge was unready continues using the placeholder for its entire lifetime.
- To start using the real hook implementation, the component must be unmounted and remounted (e.g. via a `key` change, parent unmount, or page reload).

This change is required by the spec's "Hook implementation does not switch mid-life" Scenario, which keeps the React Hook call sequence consistent across the instance's lifetime (Rules of Hooks).

The placeholder conversion functions throw `WebSpatialRuntimeError` while the placeholder is active (plain web, SSR, pre-boot, or pinned placeholder instances). Guard with `useSpatialReady()` or only call conversions after `bootSpatial()` resolves and the component remounts.

`useAnimation(config)` is ready-gated instead of placeholder-backed: it delegates to the real spatial implementation only after `bootSpatial()` has resolved, and otherwise throws synchronously with guidance to use `<SpatialBoot>` or `await bootSpatial()` before mounting the component.

---

## CHANGELOG-style summary of breaking changes

- **BREAKING**: removed `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` subpaths — use the default `@webspatial/react-sdk` entry.
- **BREAKING**: removed public exports `SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor` — use the `enable-xr` / `enable-xr-monitor` JSX markers.
- **BREAKING**: `react` and `react-dom` are now required peer dependencies (`>=18.0`); React 17 and earlier are no longer supported.
- **BREAKING**: spatial code is now lazy-loaded via `bootSpatial()`; React applications should wrap spatial UI in `<SpatialBoot>`, or use imperative `await bootSpatial()` before `ReactDOM.createRoot(...).render(...)` as a CSR-only optimization.
- **BREAKING**: a component instance that calls `useMetrics()` now pins the placeholder-vs-real choice for its lifetime; remount required to switch to the real implementation after a late `bootSpatial()`. `useAnimation(config)` is exported from the default entry but is ready-gated: call it only after `<SpatialBoot>` / `await bootSpatial()`, otherwise it throws `WebSpatialRuntimeError`.
- **DEPRECATED**: `createElement` named export — migrate to the automatic JSX transform (`./jsx-runtime` / `./jsx-dev-runtime`). Removal scheduled for v2.
- **BREAKING**: removed **`SSRProvider`** from `@webspatial/react-sdk` and `@webspatial/react-sdk/eager`. On the default entry, hydration gating is handled by the facade's `useSpatialReady` (`useSyncExternalStore`); real `Model` / `SpatializedContainer` are reached only through the facade delegate and mount after hydration commits, so no app-level Context or internal SSR wrapper is required — delete any `<SSRProvider>` wrapper; no replacement import is required. Spatial primitives imported from `@webspatial/react-sdk/eager` are CSR-only: if you server-render them, gate the subtree to the client (e.g. `dynamic(..., { ssr: false })`) or import from the default entry instead.
- **BREAKING**: removed `withSpatialized2DElementContainer` and `withSpatialMonitor` named exports (plus the `Spatialized2DElementContainerProps` type) from `@webspatial/react-sdk` and `@webspatial/react-sdk/eager`. The factory HOCs were demoted to internal-only — the documented public mechanism for wrapping intrinsic elements remains the `enable-xr` / `enable-xr-monitor` JSX marker. If you imported the factory directly to compose with a third-party HOC (e.g. `animated(withSpatialized2DElementContainer('div'))`), wrap your own `forwardRef` shim around `<div enable-xr ref={ref} />` and pass _that_ to the third-party HOC (see `packages/react/README.md` → "Advanced: composing with third-party HOCs" for the recipe).
- **BREAKING**: removed `getAbsoluteUrl` from `@webspatial/react-sdk` and `@webspatial/react-sdk/eager`; replace it with standard URL helpers.
- **Behavior change (`@webspatial/core-sdk`)**: `createPlatformSync()` / `createPlatform()` throw during SSR (no `window`) instead of using internal `SSRPlatform` no-ops. Fix server bundles that executed JSB or `openSpatialSceneSync`; use the React SDK default entry or CSR-gate spatial UI.

---

## Where to file issues

If you hit a rough edge during the upgrade, please file an issue at <https://github.com/webspatial/webspatial-sdk/issues> with:

- The bundler / framework you use (Vite, Webpack, Next.js, …) and its version
- The runtime where the failure surfaces (plain Chrome, AVP, PICO, SSR)
- A minimal reproduction (StackBlitz / repo link if possible)
