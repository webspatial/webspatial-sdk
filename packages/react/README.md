<div align="left">
  <img src="../../assets/logo.png" alt="WebSpatial Logo" width="400"/>
</div>
<br/>

# React SDK for WebSpatial

The React SDK from the WebSpatial SDK makes the WebSpatial API immediately available inside React.

## Documentation

- [Introduction](https://webspatial.dev/docs/introduction)
- [Quick Example](https://webspatial.dev/docs/quick-example)
- [Core Concepts](https://webspatial.dev/docs/core-concepts)
- [Development Guide](https://webspatial.dev/docs/development-guide)

## Web-first, spatial-enhanced

`@webspatial/react-sdk` v1 ships as a **lean default entry plus a dynamically loaded spatial chunk**. Plain web users (Chrome, Safari, Firefox — anywhere `navigator.userAgent` does not match a WebSpatial runtime) pay only the small default bundle and see the documented per-component fallback markup. The spatial implementation is fetched over the network only when the application opts in via `bootSpatial()` from a WebSpatial-capable runtime (Apple Vision Pro / PICO OS WebSpatial shells).

```ts
import { bootSpatial, isSpatialReady, useSpatialReady } from '@webspatial/react-sdk'

// Recommended: await bootSpatial() BEFORE the first React render.
// In plain browsers it resolves immediately and never fetches the spatial chunk.
await bootSpatial()
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

If you cannot pre-await (e.g. you're inside an existing render cycle), call `bootSpatial()` later: facades will mount their fallback first and swap to the real implementation on the React commit immediately after the bridge resolves.

### Default fallbacks per component

Every facade in the default entry has a documented fallback rendered in plain web / SSR / pre-boot:

| Public name | Fallback rendering in non-WebSpatial browsers |
| --- | --- |
| `Model` | Native `<model>` element (with spatial-only event props stripped) |
| `Reality` | Single `<div aria-hidden="true">` placeholder preserving the layout box |
| `Entity` / `Box` / `Sphere` / `Cone` / `Cylinder` / `Plane` / `*Entity` family | `null` (children NOT mounted) |
| `Material` / `Texture` / `ModelAsset` / `AttachmentAsset` / `UnlitMaterial` | `null` |
| `SceneGraph` / `World` | `<>{children}</>` (transparent — children render through their own facades) |

The full normative table lives in [`openspec/specs/spatial-lazy-load/spec.md`](../../openspec/specs/spatial-lazy-load/spec.md) — search for "Component facades" and "Hook placeholders".

> The factory HOCs `withSpatialized2DElementContainer` and `withSpatialMonitor` are **internal-only** in v2 — the documented public mechanism for wrapping intrinsic elements is the `enable-xr` / `enable-xr-monitor` JSX marker (see "JSX markers" below). For the rare case where you need a wrapped component as a value (e.g. to compose with another HOC like react-spring's `animated(...)`), use the recipe in "Advanced: composing with third-party HOCs" further down.

### Custom wrappers (escape hatch)

Facades intentionally do NOT accept a generic `fallback` prop in v1; the per-component defaults above are fixed. If you need a different fallback (e.g. a CSS-only 3D preview while the spatial chunk loads), write a small wrapper:

```tsx
import { Model, useSpatialReady } from '@webspatial/react-sdk'

function MyModelOrSkeleton(props: ComponentProps<typeof Model>) {
  const ready = useSpatialReady()
  if (!ready) {
    // Your custom fallback. Render any HTML you like here; once `ready`
    // flips true the next React commit mounts the real <Model />.
    return <div className="model-skeleton" />
  }
  return <Model {...props} />
}
```

`useSpatialReady()` is hydration-safe (`useSyncExternalStore` with a stable server snapshot), so this pattern works in CSR, SSR, and React Server Components alike.

### Advanced: composing with third-party HOCs

The JSX marker `<div enable-xr>` covers ~all consumer needs, but it produces a JSX element at the call site — not a *component type* you can pass to a third-party HOC like `animated(...)`, `motion(...)`, or `styled(...)`. Wrap your own `forwardRef` shim around the marker and pass *that* to the third-party HOC:

```tsx
import { forwardRef } from 'react'
import { animated, useSpring } from '@react-spring/web'

// `tsconfig.json` MUST set `"jsxImportSource": "@webspatial/react-sdk"` for
// `enable-xr` to compile into the real spatial wrapper.
const SpatialDiv = forwardRef<HTMLDivElement, React.ComponentPropsWithRef<'div'>>(
  function SpatialDiv(props, ref) {
    return <div enable-xr ref={ref} {...props} />
  },
)
SpatialDiv.displayName = 'SpatialDiv'

const AnimatedDiv = animated(SpatialDiv)

export function MyPanel() {
  const [style] = useSpring(() => ({ '--xr-back': '40' }))
  return <AnimatedDiv style={style} className="my-panel" />
}
```

Why a shim is required: the spatial wrapping logic lives in the SDK's JSX runtime (resolved via `tsconfig.jsxImportSource`), so it only fires when the JSX *call site* is parsed by your bundler. A `forwardRef` shim moves that call site into a component module the bundler compiles, then exposes the resulting component as a stable value for the third-party HOC.

### React 18+ peer dependency

`react` and `react-dom` are **required** peer dependencies (`>=18.0`). The SDK uses `useSyncExternalStore` for hydration-safe readiness; older React versions are unsupported in v1.

### Bundler compatibility

The SDK relies on three bundler capabilities to deliver its size budget: ESM resolution, the `exports` package.json field, and dynamic `import()` with code-splitting. **Tested-target list (non-normative)**: Vite ≥ 4, Webpack ≥ 5, Rollup ≥ 3, Rspack ≥ 1, esbuild ≥ 0.18 with `splitting: true`, Next.js App Router (Webpack mode), Next.js Pages Router. See the [migration guide](../../docs/migration/lazy-load-spatial-runtime.md#bundler-compatibility) for environments that are out of scope for v1 (Module Federation, Next.js Turbopack, Webpack 4, CommonJS-only pipelines).

### Stateless utility APIs

A subset of the public API works without `bootSpatial()` ever being called and is included in the default-entry size budget:

| API | Behavior |
| --- | --- |
| `WebSpatialRuntime.supports(name, tokens?)` | Synchronous capability lookup; returns `false` for spatial keys in plain browsers and `true` for documented capabilities under Puppeteer / WebSpatial shells |
| `bootSpatial()` / `isSpatialReady()` / `useSpatialReady()` / `onSpatialLoadError()` / `WebSpatialBootError` | Boot bridge — see "Web-first, spatial-enhanced" above |
| `initScene(name, callback, options?)` | No-op without a WebSpatial session; routes to `getSession().initScene(...)` after boot |
| `convertCoordinate(position, { from, to })` | Returns `position` unchanged without a session; resolves through the spatial scene after boot |
| `enableDebugTool()` | SSR-safe no-op; in browsers attaches `inspectCurrentSpatialScene` and `getSpatialized2DElement` to `window` (the diagnostics themselves require `bootSpatial()` to be awaited) |
| `SSRProvider` | React Context provider; carries no spatial dependency |
| `version` | Package version constant (build-time injected) |

The full normative contract lives in [`openspec/specs/spatial-lazy-load/spec.md`](../../openspec/specs/spatial-lazy-load/spec.md) — search for "Stateless utility APIs and pure re-exports".

### Server-safe subpath (`@webspatial/react-sdk/server`)

The default entry carries `'use client'` at the top of its emitted `dist/index.js`, which means Next.js App Router (and any RSC-aware bundler) turns every imported symbol into a Client Reference — calling it from a Server Component throws `"Attempted to call X() from the server but X is on the client."`.

Helpers that are genuinely server-callable live on a separate subpath:

```ts
import { detectSpatialRuntime } from '@webspatial/react-sdk/server'
```

| API | Behavior |
| --- | --- |
| `detectSpatialRuntime(input)` | Server-side WebSpatial runtime detection from a User-Agent string or a `Headers`-like object (Next.js `await headers()`, Web Fetch `Headers`, Express-style `req.headers`). Returns the same `{ type, shellVersion }` snapshot the client runtime cache produces from `navigator.userAgent`. `type === null` when the request is from a plain browser. |
| `export type *` | Mirror of the default entry's full type surface so RSC files can write type annotations (`ModelProps`, `CapabilityKey`, `Vec3`, …) without crossing back to `@webspatial/react-sdk`. Zero runtime cost. |

```tsx
// app/page.tsx (RSC)
import { headers } from 'next/headers'
import { detectSpatialRuntime } from '@webspatial/react-sdk/server'

export default async function Page() {
  const runtime = detectSpatialRuntime(await headers())
  if (runtime.type === 'visionos') return <SpatialHero />
  return <FallbackHero />
}
```

Only APIs that are useful in server-side execution context AND fail gracefully without browser globals belong here. Hooks, facade components, and any helper that mutates module-level singleton state (which would leak across requests in a shared Node process) are intentionally **not** re-exported from this subpath — keep importing those from the default entry, which Next will resolve as a Client Component boundary.

## SpatialDiv `onSpatialContentReady` runtime note

When using nested `SpatialDiv` (`enable-xr`) with `onSpatialContentReady`, callback ordering differs by runtime:

- In WebSpatial runtime, parent `SpatialDiv` callback runs before child callback on the same ready edge.
- In non-WebSpatial fallback (plain web DOM), callback ordering between parent and child is not a guaranteed contract and should be treated as unspecified.

Recommended practice: initialize imperative renderers from each container's own `ctx.host` and avoid coupling setup logic to parent/child callback sequence in fallback web mode.

## SpatialDiv CSS and transforms

Spatial transforms are sampled from an off-screen **probe** DOM node, not from the visible portal surface. Tag/class selectors, probe vs. host split, and workarounds are documented in [WebSpatial Quirks — SpatialDiv / `enable-xr` and CSS](../../docs/webspatial-quirks.md). Maintainer architecture notes live in [`src/spatialized-container/ARCHITECTURE.md`](src/spatialized-container/ARCHITECTURE.md).
