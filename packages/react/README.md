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

**Recommended (React):** wrap spatial UI in `<SpatialBoot>` — the SDK calls `bootSpatial()` after mount and mounts `children` only after boot succeeds. On `WebSpatialBootError`, handle `onError`; `children` stay unmounted.

```tsx
import { SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'

export function AppRoot() {
  return (
    <SpatialBoot
      onError={(err: WebSpatialBootError) => {
        // show error UI; retry with bootSpatial() if needed
        console.error(err)
      }}
    >
      <App />
    </SpatialBoot>
  )
}
```

While boot is in flight, `children` are not mounted (render nothing). Show loading UI in your app layout around `<SpatialBoot>` if needed.

**CSR-only optimization:** you may `await bootSpatial()` before `createRoot().render(<SpatialBoot>…)` to shorten the blank period; Next.js / Remix typically use `<SpatialBoot>` inside a `'use client'` subtree instead.

```ts
import { bootSpatial } from '@webspatial/react-sdk'

await bootSpatial() // plain web: immediate; WebSpatial: loads chunk
createRoot(el).render(
  <SpatialBoot>
    <App />
  </SpatialBoot>,
)
```

Advanced: imperative `bootSpatial()` / `onSpatialLoadError`; `useSpatialReady()` for custom capability UI without `<SpatialBoot>`. See `docs/design/spatial-boot-component.md`.

### Default fallbacks per component

Every facade in the default entry has a documented fallback rendered in plain web / SSR / pre-boot:

| Public name                                                                    | Fallback rendering in non-WebSpatial browsers                               |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `Model`                                                                        | Native `<model>` element (with spatial-only event props stripped)           |
| `Reality`                                                                      | Single `<div aria-hidden="true">` placeholder preserving the layout box     |
| `Entity` / `Box` / `Sphere` / `Cone` / `Cylinder` / `Plane` / `*Entity` family | `null` (children NOT mounted)                                               |
| `Material` / `Texture` / `ModelAsset` / `AttachmentAsset` / `UnlitMaterial`    | `null`                                                                      |
| `SceneGraph` / `World`                                                         | `null` (children NOT mounted)                                               |

The full normative table lives in [`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`](../../openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) — search for "Component facades" and "Hook placeholders".

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

The JSX marker `<div enable-xr>` covers ~all consumer needs, but it produces a JSX element at the call site — not a _component type_ you can pass to a third-party HOC like `animated(...)`, `motion(...)`, or `styled(...)`. Wrap your own `forwardRef` shim around the marker and pass _that_ to the third-party HOC:

```tsx
import { forwardRef } from 'react'
import { animated, useSpring } from '@react-spring/web'

// `tsconfig.json` MUST set `"jsxImportSource": "@webspatial/react-sdk"` for
// `enable-xr` to compile into the real spatial wrapper.
const SpatialDiv = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<'div'>
>(function SpatialDiv(props, ref) {
  return <div enable-xr ref={ref} {...props} />
})
SpatialDiv.displayName = 'SpatialDiv'

const AnimatedDiv = animated(SpatialDiv)

export function MyPanel() {
  const [style] = useSpring(() => ({ '--xr-back': '40' }))
  return <AnimatedDiv style={style} className="my-panel" />
}
```

Why a shim is required: the spatial wrapping logic lives in the SDK's JSX runtime (resolved via `tsconfig.jsxImportSource`), so it only fires when the JSX _call site_ is parsed by your bundler. A `forwardRef` shim moves that call site into a component module the bundler compiles, then exposes the resulting component as a stable value for the third-party HOC.

### React 18+ peer dependency

`react` and `react-dom` are **required** peer dependencies (`>=18.0`). The SDK uses `useSyncExternalStore` for hydration-safe readiness; older React versions are unsupported in v1.

### Bundler compatibility

The SDK relies on three bundler capabilities to deliver its size budget: ESM resolution, the `exports` package.json field, and dynamic `import()` with code-splitting. **Tested-target list (non-normative)**: Vite ≥ 4, Webpack ≥ 5, Rollup ≥ 3, Rspack ≥ 1 (covered by `apps/spatial-rspack-min`), esbuild ≥ 0.18 with `splitting: true`, Next.js App Router (Webpack mode), Next.js Pages Router, React Router 7 (Remix-style SSR + Vite — `apps/spatial-remix-min`). See the [migration guide](../../docs/migration/lazy-load-spatial-runtime.md#bundler-compatibility) for environments that are out of scope for v1 (Module Federation, Next.js Turbopack, Webpack 4, CommonJS-only pipelines).

### Two distribution forms: default vs eager

The package publishes two entry roots with the **same export names**, so you can switch by changing only the import path:

| Entry              | Import                        | Choose when                                                                                                                                                                                                                                             |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default (lazy)** | `@webspatial/react-sdk`       | Web-first progressive enhancement; **SSR**, streaming SSR, or any page whose **server-rendered HTML** should include façade fallbacks for spatial primitives. Smallest synchronous footprint (~5 KB marginal delta in the SDK’s §9.2 fixture).          |
| **Eager**          | `@webspatial/react-sdk/eager` | Spatial-first apps (fixed WebSpatial shells, internal AVP / PICO surfaces) where you want **one network request** and no real `bootSpatial()` work — at the cost of inlining the full spatial implementation (roughly the same bytes as lazy-loading `dist/spatial.js`; no separate product size cap). |

**SSR / CSR routing**

- Hydration-safe façade SSR (`useSpatialReady` + stable server snapshot → fallback on server and during the hydration pass) is the contract for **`@webspatial/react-sdk`** only.
- Spatial primitives imported from **`@webspatial/react-sdk/eager`** MUST mount on the **client** only. Server-rendering those components is **not** a supported configuration: use the default entry for SSR pages, or CSR-gate the subtree (for example Next.js `dynamic(..., { ssr: false })`, or render spatial UI only after `typeof window !== 'undefined'`).

**Other rules**

- Migrating between entries is **import-root-only**; on eager, `bootSpatial()` / `isSpatialReady()` / `useSpatialReady()` are **compatibility stubs** (`bootSpatial()` resolves immediately; readiness always reports ready).
- **Do not** mix both entry roots in one application bundle — the same symbol name may refer to façade vs real implementation and behavior is undefined.

Normative detail: [`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`](../../openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) — search for "Entry routing" and "CSR-only for spatial primitives".

### Stateless utility APIs

A subset of the public API works without `bootSpatial()` ever being called and is included in the default-entry size budget:

| API                                                                                                         | Behavior                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WebSpatialRuntime.supports(name, tokens?)`                                                                 | Re-exported from `@webspatial/core-sdk/runtime` (inlined into the default-entry bundle at build time); see `openspec/specs/runtime-capabilities/spec.md`                          |
| `bootSpatial()` / `isSpatialReady()` / `useSpatialReady()` / `onSpatialLoadError()` / `WebSpatialBootError` | Boot bridge — see "Web-first, spatial-enhanced" above                                                                                                                          |
| `initScene(name, callback, options?)`                                                                       | No-op without a WebSpatial session; routes to `getSession().initScene(...)` after boot                                                                                         |
| `convertCoordinate(position, { from, to })`                                                                 | Throws `WebSpatialRuntimeError` when `supports('convertCoordinate')` is false or before `bootSpatial()` resolves; converts via the spatial scene when ready                    |
| `enableDebugTool()`                                                                                         | SSR-safe no-op; in browsers attaches `inspectCurrentSpatialScene` and `getSpatialized2DElement` to `window` (the diagnostics themselves require `bootSpatial()` to be awaited) |
| `version`                                                                                                   | Package version constant (build-time injected)                                                                                                                                 |

The full normative contract lives in [`openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md`](../../openspec/changes/lazy-load-spatial-runtime/specs/spatial-lazy-load/spec.md) — search for "Stateless utility APIs and pure re-exports". Internal `Model` / `SpatializedContainer` host wrappers use `useSyncExternalStore` for SSR + hydration — you do **not** wrap the app in a provider for that.

### Spatial hooks

Import stable hooks from the default entry and experimental animation hooks from the experimental entry:

```ts
import { useMetrics } from '@webspatial/react-sdk'
import { useAnimation } from '@webspatial/react-sdk/experimental'
```

`useMetrics()` has a stable web placeholder. A component instance that first
invokes it before `bootSpatial()` resolves keeps that placeholder until it
unmounts and remounts.

`useAnimation(config)` has no web fallback. Call it only from components that
mount after spatial readiness, such as children of `<SpatialBoot>` or a tree
rendered after an explicit `await bootSpatial()`. Calling it before readiness
throws `WebSpatialRuntimeError` with capability `useAnimation`.

### RSC, server requests, and runtime detection

The default entry carries `'use client'` at the top of its emitted `dist/index.js`. Frameworks that support React Server Components treat imports from `@webspatial/react-sdk` as a **client boundary**: you can still **render** facade components from a Server Component file (they become client components), but you cannot **call** hook-style APIs from server-only modules.

If you need to **branch server-rendered HTML** on the incoming request (e.g. different hero for WebSpatial-capable shells vs plain browsers), base that decision on the **HTTP `User-Agent`** string and the **official WebSpatial documentation** for how to interpret it — for example [Introduction](https://webspatial.dev/docs/introduction) and [Development Guide](https://webspatial.dev/docs/development-guide). **Do not rely on undocumented SDK helpers** for environment detection in application code.

## SpatialDiv lifecycle differs from a plain `<div>`

A `<div enable-xr>` (SpatialDiv) is **not** a plain `<div>`. In a WebSpatial runtime the SDK renders your content into a portal whose host DOM node is created, and may be **recreated**, by the SDK — and the hidden layout box you see in the React tree is **not necessarily the same DOM node** as the visible portal host. In plain-web fallback it renders a single host element.

Because of this, **do not reach into child DOM refs inside an `enable-xr` container to synchronize layout or attach an external renderer** (Three.js, a `<canvas>` 2D context, a video player, etc.). Those child nodes may be detached/recreated under you, so a one-shot `useEffect([])` that captures `ref.current` will silently attach to a stale node.

### `onSpatialContentReady` fires only in a WebSpatial runtime

`onSpatialContentReady` is a **spatial-content-host signal**: it is invoked (in `useLayoutEffect` timing) **only when a real WebSpatial spatial content host exists** — i.e. in a WebSpatial runtime after the spatial content has committed. `ctx.host` is always that connected spatial host, and you can return a cleanup that runs on teardown / re-ready.

It does **NOT** fire on plain web (no WebSpatial runtime), nor before `bootSpatial()` has produced a spatial host. For the flat-web presentation, attach your renderer with your **own** `ref` + effect on your **own** element (see the second example), optionally branching on `useSpatialReady()`.

### Do — spatial path via `onSpatialContentReady` (+ cleanup)

```tsx
<div
  enable-xr
  onSpatialContentReady={(ctx) => {
    // Runs ONLY in a WebSpatial runtime. ctx.host is the connected spatial host.
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(ctx.host.clientWidth, ctx.host.clientHeight)
    ctx.host.appendChild(renderer.domElement)

    // Returned cleanup runs on unmount / before the next ready edge.
    return () => {
      renderer.dispose()
      renderer.domElement.remove()
    }
  }}
/>
```

### Do — flat-web path via your own `ref` + effect

```tsx
// Plain web (no WebSpatial runtime): onSpatialContentReady does NOT fire, so
// initialize the flat presentation from YOUR OWN element with a normal effect.
function FlatRenderer() {
  const slotRef = useRef<HTMLDivElement>(null)
  const ready = useSpatialReady() // true only in a WebSpatial runtime

  useLayoutEffect(() => {
    if (ready) return // spatial runtime is handled by onSpatialContentReady
    const el = slotRef.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer()
    el.appendChild(renderer.domElement)
    return () => {
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [ready])

  return (
    <div enable-xr onSpatialContentReady={(ctx) => attachSpatial(ctx.host)}>
      <div ref={slotRef} /> {/* your own element, your own ref — flat path */}
    </div>
  )
}
```

### Don't — capture a child ref in `useEffect([])` assuming a spatial host

```tsx
// ANTI-PATTERN: fragile. The captured node may be recreated or split across
// a hidden layout host and a visible portal host, so `el` can become stale
// and the renderer attaches to a detached/wrong node. It also conflates the
// spatial and flat-web paths into one runtime-blind effect.
function Broken() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current!
    const renderer = new THREE.WebGLRenderer()
    el.appendChild(renderer.domElement) // ← may attach to a stale node
  }, [])
  return (
    <div enable-xr>
      <div ref={ref} /> {/* child DOM ref is NOT a supported spatial attach point */}
    </div>
  )
}
```

For layout/size changes prefer **declarative React updates** (props/state) rather than imperative DOM measurement of child refs.

### Nested ordering note

`onSpatialContentReady` ordering guarantees are runtime-scoped:

- In a WebSpatial runtime, the parent `SpatialDiv` callback runs **before** the child callback on the same ready edge.
- In non-WebSpatial fallback (plain web DOM), parent/child ordering is **not** a guaranteed contract and should be treated as unspecified.

Recommended practice: initialize imperative renderers from each container's own `ctx.host` and avoid coupling setup logic to parent/child callback sequence in fallback web mode.

## SpatialDiv CSS and transforms

Spatial transforms are sampled from an off-screen **probe** DOM node, not from the visible portal surface. Tag/class selectors, probe vs. host split, and workarounds are documented in [WebSpatial Quirks — SpatialDiv / `enable-xr` and CSS](../../docs/webspatial-quirks.md). Maintainer architecture notes live in [`src/spatialized-container/ARCHITECTURE.md`](src/spatialized-container/ARCHITECTURE.md).
