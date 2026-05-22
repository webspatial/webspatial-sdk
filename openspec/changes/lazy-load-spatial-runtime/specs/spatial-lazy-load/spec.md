# Spatial lazy load (WebSpatial React SDK)

## Terminology

Throughout this spec, **"WebSpatial runtime"** means a runtime classified by the `runtime-capabilities` spec's "Internal runtime snapshot" Requirement as `type !== null` — i.e. one of `'visionos'`, `'picoos'`, or `'puppeteer'` (the test-harness equivalent that exists for end-to-end CI coverage of `bootSpatial()`; see `packages/autoTest`). **"Non-WebSpatial browser"** means `type === null` (plain browsers and SSR without Puppeteer instrumentation). The `'puppeteer'` runtime is treated identically to `'visionos'` / `'picoos'` for all bridge / boot / facade decisions in this spec; the differences only show up in product-level capability detection (`supports()`, per `runtime-capabilities`) and in the autoTest CI harness.

## ADDED Requirements

### Requirement: Default entry MUST NOT bundle spatial implementation

The published default entry of `@webspatial/react-sdk` MUST contain only:

- Lightweight facades for every public spatial component, plus internal HOC wrapper facades used by the SDK's JSX runtime (per "Component facades")
- Hook placeholders for every public spatial hook (per "Hook placeholders")
- The runtime bridge, the boot helper, the public readiness API (`bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`), and the recommended React integration component `SpatialBoot` (per "`SpatialBoot` React integration")
- The unified JSX runtime (per "JSX runtime strips spatial markers and wraps with facade HOCs")
- Stateless utility APIs and pure re-exports (Group B / Group C per "Stateless utility APIs and pure re-exports remain in the default entry")
- Type-only exports

It MUST NOT contain any spatial implementation modules (containers, monitors, reality, entities, real `Model`, real reality hooks).

The default entry MUST also contain the **complete** web-mode rendering for every public component facade and internal HOC wrapper facade — every per-component default fallback specified in "Component facades" — so that rendering any facade in a non-WebSpatial browser succeeds without loading additional modules over the network.

**Size budget framing**: the **product-level contract** is that adding `@webspatial/react-sdk` to a downstream application following the SDK's recommended web-first integration pattern MUST NOT increase the application's gzipped bundle size by more than **8 KB** compared to the same application without the SDK. The default entry MUST NOT emit runtime imports from `@webspatial/core-sdk`; core-sdk runtime code belongs to the spatial/eager implementation graph. The "recommended integration pattern" is named-import of the spatial primitives the application actually uses (e.g. `import { Model, bootSpatial } from '@webspatial/react-sdk'`), NOT namespace import (`import * as W from ...`) or side-effect import. The marginal-delta contract is the user-facing measurement; an additional SDK-side proxy on `dist/index.js` size keeps the SDK build pipeline honest. Worst-case namespace / full-barrel imports MAY exceed the budget; that is informational, not a contract violation.

#### Scenario: Marginal bundle delta on a typical consumer (product-level contract)

- **WHEN** a downstream application imports the SDK using the recommended named-import pattern (e.g. `import { Model, bootSpatial } from '@webspatial/react-sdk'` and uses `<Model />` plus `await bootSpatial()` per the migration guide)
- **AND** the application is built with one of the documented compatible bundlers (per "Plugin-free integration")
- **THEN** the marginal gzipped bundle delta — the difference between the application bundle with the SDK imported and the same application bundle without the SDK imported — MUST be at most 8192 bytes (8 KB)
- **AND** the default-entry build-output assertion MUST fail if importing `@webspatial/react-sdk` makes any runtime import from `@webspatial/core-sdk` reachable through the default entry's static module graph
- **AND** the budget MUST be enforced by a CI fixture (a minimal Vite + React project under `tests/` or similar) that fails the build when exceeded

#### Scenario: SDK-side `dist/index.js` size proxy

- **WHEN** the published `dist/index.js` is gzipped on its own (independent of any consumer build)
- **THEN** the size MUST be at most 8192 bytes (8 KB)
- **AND** this proxy is a necessary-but-not-sufficient condition for the marginal-delta contract; it is enforced at SDK build time so regressions surface inside the SDK's own test suite without requiring a fixture build

#### Scenario: Worst-case namespace / full-barrel import is informational

- **WHEN** a downstream application uses `import * as W from '@webspatial/react-sdk'` with non-static property access, side-effect-only `import '@webspatial/react-sdk'`, or explicit named-import of every public export at once
- **THEN** the marginal gzipped bundle delta MAY exceed 8 KB (typical worst case projected at 9–11 KB before tree-shaking gains)
- **AND** this is NOT a v1 spec violation; it is a documented limitation of the consumer's import shape
- **AND** the migration guide MUST recommend named imports of only the spatial primitives the application actually uses

#### Scenario: Spatial-only identifiers are absent from default entry

- **WHEN** the published `dist/index.js` is searched for spatial-only identifier names
- **THEN** none of the following identifiers MUST appear in the file (verified to exist in the source as spatial-only exports): `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `PortalSpatializedContainer`, `StandardSpatializedContainer`, `SpatialMonitor`, `ResourceRegistry`, `AttachmentRegistry`, the real-implementation function bodies of `withSpatialized2DElementContainer` / `withSpatialMonitor` (distinct from their facade re-exports), real-`Model` implementation symbols, and real reality-hook implementation symbols (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`)

#### Scenario: Core SDK runtime imports are absent from default entry

- **WHEN** the published `dist/index.js` static-import closure is inspected
- **THEN** no emitted JavaScript file reachable from that closure MUST import `@webspatial/core-sdk` or any `@webspatial/core-sdk/*` runtime subpath
- **AND** type-only declarations MAY still reference core-sdk types in `.d.ts` output
- **AND** `@webspatial/core-sdk` runtime imports MAY appear in the spatial/eager implementation graph

#### Scenario: Default entry contains complete fallback rendering for every facade

- **WHEN** the published `dist/index.js` is loaded
- **THEN** it MUST contain the rendering logic for every public facade's documented default fallback (Model degraded `<model>` tag, Reality placeholder `<div aria-hidden>`, entity / material / asset `null` rendering, internal HOC pass-through wrappers used by the JSX runtime, and any other per-component default fallback listed in "Component facades")
- **AND** rendering any facade in a non-WebSpatial browser MUST NOT require any additional module to be loaded over the network

---

### Requirement: Spatial implementation MUST live in a dynamically importable subpath

The package MUST expose `@webspatial/react-sdk/spatial` as the single source of truth for the spatial implementation. The default entry MUST load this module via dynamic `import()` only and MUST NOT statically import it.

#### Scenario: Web runtime never fetches spatial chunk

- **WHEN** an application imports `@webspatial/react-sdk` and runs in a non-WebSpatial browser
- **AND** the application does not call `bootSpatial()`
- **THEN** the spatial chunk MUST NOT be requested over the network
- **AND** facades and hook placeholders MUST continue to render web fallbacks without scheduling any dynamic import

#### Scenario: Spatial runtime caches the successful load

- **WHEN** an application runs in a WebSpatial runtime and `bootSpatial()` is awaited and resolves successfully one or more times
- **THEN** the spatial chunk MUST be requested at most once **after the first successful load**, for the remainder of the page lifetime
- **AND** every subsequent `bootSpatial()` call MUST return the cached successful resolution result without scheduling additional network requests
- **AND** failure paths are governed by the "Boot retry after a failure" Scenario in the `bootSpatial` Requirement, which explicitly permits a fresh `import()` after a prior rejection — that retry does NOT violate this caching contract

#### Scenario: Plain web users see final rendering at first render

- **WHEN** an application is loaded in a non-WebSpatial browser (`detectSpatialRuntime() === null`)
- **AND** `bootSpatial()` has been awaited per the recommended pattern (or has been omitted entirely)
- **THEN** the first render of every facade MUST produce its documented per-component default fallback — which IS the user's final intended display in this environment
- **AND** no further re-render to switch implementations MUST occur for the page lifetime
- **AND** the spatial chunk MUST NOT be fetched, parsed, or evaluated

---

### Requirement: Bridge singleton

The default entry MUST maintain an internal bridge module providing synchronous read (`getSpatialImpl()`), asynchronous load (`loadSpatialImpl()`), readiness check (`isSpatialReady()`), readiness subscription primitives, and error registration (`onSpatialLoadError(cb)`). `getSpatialImpl()`, `loadSpatialImpl()`, and the raw subscription primitives MUST NOT be part of the documented application-facing public API. `isSpatialReady()`, `useSpatialReady()`, and `onSpatialLoadError(cb)` MUST be re-exported as public API alongside `bootSpatial()` (their contracts are specified in the `bootSpatial` and `SSR and hydration safety` requirements).

#### Scenario: Concurrent load requests share one promise

- **WHEN** `loadSpatialImpl()` is called multiple times before resolution
- **THEN** all callers MUST receive the same promise instance
- **AND** the underlying dynamic `import()` MUST be invoked at most once

#### Scenario: SSR safety

- **WHEN** any bridge method is called in an environment without `window`
- **THEN** the call MUST NOT throw
- **AND** `getSpatialImpl()` MUST return `null`
- **AND** `loadSpatialImpl()` MUST resolve to `null` without scheduling a network request
- **AND** `isSpatialReady()` MUST return `false`

#### Scenario: Spatial chunk load failure is observable

- **WHEN** the dynamic `import('@webspatial/react-sdk/spatial')` rejects (e.g. network error)
- **THEN** `loadSpatialImpl()` MUST reject with a `WebSpatialBootError` whose `cause` is set to the underlying `import()` error and whose `attempt` is the 1-based attempt count
- **AND** every callback registered via `onSpatialLoadError(cb)` MUST be invoked exactly once with that same `WebSpatialBootError` instance
- **AND** `isSpatialReady()` MUST remain `false`
- **AND** facades MUST continue to render fallback content without throwing
- **AND** the wrapping into `WebSpatialBootError` MUST happen inside `loadSpatialImpl()` so that downstream consumers (`bootSpatial()`, listener callbacks) never observe the raw `import()` error directly; the underlying error remains accessible via `error.cause` for diagnostics

---

### Requirement: `bootSpatial` is the only activation path

`bootSpatial()` MUST be the single API that triggers loading of the spatial chunk. Facades and hook placeholders MUST NOT initiate `import('@webspatial/react-sdk/spatial')` on their own. The function MUST have signature `bootSpatial(): Promise<void>`.

`bootSpatial()` is idempotent within a single load attempt: concurrent in-flight calls MUST share one promise; after a successful resolution all subsequent calls MUST return an already-resolved promise without scheduling additional work. After a rejection, callers MAY invoke `bootSpatial()` again to retry, in which case the bridge MUST attempt a fresh dynamic `import()` provided no other retry is currently in flight.

The default entry MUST also export:

- `isSpatialReady(): boolean` — synchronous read; returns `true` only when the spatial chunk has been loaded successfully and the bridge has stored the implementation reference.
- `useSpatialReady(): boolean` — a React hook returning the current readiness, subscribed via `useSyncExternalStore` so consuming components automatically re-render when the bridge becomes ready. Implementations MUST short-circuit the subscription work when `detectSpatialRuntime() === null` so that non-WebSpatial browsers pay no per-render bookkeeping cost. Safe to call during SSR (returns `false`).
- `onSpatialLoadError(cb: (err: WebSpatialBootError) => void): () => void` — registers a callback invoked on every failed load attempt. Multiple callbacks MAY be registered concurrently; the returned function unsubscribes the corresponding callback. Callbacks MUST be invoked in registration order. Successful retries after a prior failure MUST NOT replay earlier errors to listeners. The wrapping into `WebSpatialBootError` is performed inside the bridge's internal `loadSpatialImpl()` (per "Bridge singleton"); listeners always receive the same `WebSpatialBootError` instance that `bootSpatial()` would reject with.
- `WebSpatialBootError` — an `Error` subclass used as the rejection value of `bootSpatial()` and the argument to `onSpatialLoadError` callbacks. Instances MUST satisfy `name === 'WebSpatialBootError'`, MUST set `cause` to the original error thrown by the dynamic `import()`, and MUST expose `attempt: number` (1-based) indicating which retry the failure corresponds to.

#### Scenario: `bootSpatial()` is the activation path

- **WHEN** an application runs in a WebSpatial runtime and awaits `bootSpatial()`
- **THEN** the SDK MUST load the spatial implementation through the bridge before resolving
- **AND** facades and hook placeholders MUST NOT independently trigger that load before `bootSpatial()` is called

Recommended integration patterns (non-normative):

- **React (preferred):** wrap spatial UI in `<SpatialBoot>` from the default entry so the SDK invokes `bootSpatial()` after mount and mounts `children` only after a successful boot (see "`SpatialBoot` React integration").
- **Imperative / CSR-only:** applications MAY `await bootSpatial()` before `ReactDOM.createRoot(...).render(...)` to avoid an initial blank period when also using `<SpatialBoot>`, or call `bootSpatial()` without `<SpatialBoot>` for full manual control (advanced). Calling `bootSpatial()` later while facades are already mounted is permitted; facades switch on the next React commit (see "Component facades"), but hook placeholders from prior renders MUST remount after boot (see "Hook placeholders").

---

### Requirement: `SpatialBoot` React integration

The default entry and the eager entry (`@webspatial/react-sdk/eager`) MUST export a client component `SpatialBoot` that wraps `bootSpatial()` for React applications.

`SpatialBoot` MUST:

- Invoke `bootSpatial()` once after mount (unless a future internal option disables auto-boot — not part of the v1 public surface).
- By default (`gate` prop omitted or `true`), MUST NOT mount `children` until `bootSpatial()` has resolved successfully in the current page session.
- While boot is in flight and `children` are not mounted, MUST render `fallback` when provided, otherwise render nothing (`null`).
- When `bootSpatial()` rejects with `WebSpatialBootError`, MUST invoke the optional `onError` callback with that error and MUST NOT mount `children`.
- When `bootSpatial()` resolves successfully, MUST mount `children` and MAY invoke the optional `onReady` callback.

The default entry MUST NOT export a public `useBootSpatial` hook in v1. Boot progress state machines MAY exist as internal implementation details of `SpatialBoot`; a public hook MAY be added in a follow-up change if product requests it.

`SpatialBoot` MUST carry `'use client'` (directly or via its module graph) so it is safe to import from Next.js App Router / React Router client boundaries.

The eager entry MUST export `SpatialBoot` as a compatibility stub with the same props and gating semantics, reporting ready immediately (spatial implementation already linked).

#### Scenario: Default gate hides children until boot succeeds

- **WHEN** a consumer renders `<SpatialBoot><App /></SpatialBoot>` without setting `gate` to `false`
- **AND** `bootSpatial()` has not yet resolved in a WebSpatial runtime
- **THEN** `App` MUST NOT be mounted
- **AND** when `bootSpatial()` subsequently resolves, `App` MUST mount on the next React commit

#### Scenario: Boot failure does not mount children

- **WHEN** `bootSpatial()` rejects with `WebSpatialBootError` inside `<SpatialBoot onError={cb}>…</SpatialBoot>`
- **THEN** `onError` MUST be called with that error
- **AND** `children` MUST remain unmounted for that failure

#### Scenario: Optional fallback during boot

- **WHEN** a consumer passes `fallback={<Loading />}` to `<SpatialBoot>`
- **AND** `children` are not yet mounted because boot has not succeeded
- **THEN** the rendered output MUST be `<Loading />` (not `children`)

#### Scenario: Eager entry SpatialBoot is immediately ready

- **WHEN** a consumer renders `<SpatialBoot>` imported from `@webspatial/react-sdk/eager`
- **THEN** `children` MUST be eligible to mount on the first client commit without waiting on a dynamic import
- **AND** `bootSpatial()` stub behavior from the eager entry MUST still apply per "Eager-mode entry" lazy-load runtime stub Scenarios

---

#### Scenario: Boot is a no-op in non-WebSpatial browsers

- **WHEN** `bootSpatial()` is awaited in a non-WebSpatial browser (`detectSpatialRuntime() === null`)
- **THEN** it MUST resolve without scheduling any dynamic import
- **AND** the spatial chunk MUST NOT be fetched
- **AND** `isSpatialReady()` MUST continue to return `false`

#### Scenario: Boot is a no-op during SSR

- **WHEN** `bootSpatial()` is awaited in an environment without `window`
- **THEN** it MUST resolve without scheduling any dynamic import
- **AND** it MUST NOT throw

#### Scenario: Boot blocks until spatial chunk is ready

- **WHEN** `bootSpatial()` is awaited in a WebSpatial runtime for the first time
- **THEN** the returned promise MUST resolve only after the spatial chunk is loaded and `isSpatialReady()` returns `true`
- **AND** any facade rendered after resolution MUST mount the real implementation synchronously

#### Scenario: Boot is idempotent across multiple awaits

- **WHEN** `bootSpatial()` is awaited multiple times in the same page during a single load attempt
- **THEN** the spatial chunk MUST be requested at most once for that attempt
- **AND** all callers MUST receive the same successful resolution

#### Scenario: Boot retry after a failure

- **WHEN** `bootSpatial()` has rejected and the application calls `bootSpatial()` again
- **AND** no other retry is currently in flight
- **THEN** the bridge MUST initiate a fresh dynamic `import()`
- **AND** if the retry succeeds, `isSpatialReady()` MUST become `true` and previously failed listeners MUST NOT be re-notified
- **AND** if the retry also fails, all registered `onSpatialLoadError` listeners MUST be notified with a new `WebSpatialBootError` whose `attempt` is incremented

#### Scenario: Boot rejection wraps the underlying error

- **WHEN** `bootSpatial()` rejects
- **THEN** the rejection value MUST be a `WebSpatialBootError`
- **AND** its `cause` MUST be the original error thrown by `import()`
- **AND** its `attempt` MUST be 1-based and reflect the failed attempt count
- **AND** `isSpatialReady()` MUST continue to return `false`

#### Scenario: Multiple error listeners receive each failure

- **WHEN** multiple callbacks are registered via `onSpatialLoadError(cb)`
- **AND** a load attempt fails
- **THEN** every registered callback MUST be invoked exactly once for that failure, in registration order

#### Scenario: Unsubscribing an error listener

- **WHEN** the unsubscribe function returned by `onSpatialLoadError(cb)` is invoked
- **THEN** `cb` MUST NOT be invoked for any subsequent load attempt failures
- **AND** other registered callbacks MUST continue to be invoked normally

#### Scenario: No auto-load from facade or hook

- **WHEN** a facade is rendered or a hook placeholder is invoked while `isSpatialReady()` is `false` and `bootSpatial()` has never been called
- **THEN** the facade MUST render fallback and the hook MUST return its documented default value
- **AND** neither MUST trigger `import('@webspatial/react-sdk/spatial')`
- **AND** behavior MUST remain web-fallback for the entire page lifetime unless `bootSpatial()` is later called

#### Scenario: Bridge state is shared across all React roots in the realm

- **WHEN** an application creates multiple React roots (`ReactDOM.createRoot` called more than once) within the same JavaScript realm
- **THEN** a single successful `bootSpatial()` call MUST cause every root to switch facades to real implementations on subsequent renders
- **AND** there MUST NOT be a per-root `bootSpatial` API or per-root readiness state

#### Scenario: StrictMode double invocation is safe

- **WHEN** `bootSpatial()` is invoked twice synchronously (e.g. inside a `useEffect` under `<StrictMode>` in development)
- **THEN** the spatial chunk MUST still be requested at most once for that load attempt
- **AND** both invocations MUST receive the same resolution outcome

#### Scenario: Dev-mode warning when boot is forgotten in a WebSpatial runtime

- **WHEN** a facade is rendered while `isSpatialReady()` is `false` and `bootSpatial()` has never been called
- **AND** the runtime IS a WebSpatial runtime (`detectSpatialRuntime() !== null`)
- **AND** the build is a development build (not production)
- **THEN** the SDK MUST log a one-shot console warning indicating that `bootSpatial()` may not have been awaited
- **AND** the warning MUST NOT be repeated on subsequent renders within the same page

#### Scenario: No dev-mode warning in non-WebSpatial browsers

- **WHEN** a facade is rendered while `isSpatialReady()` is `false` and `bootSpatial()` has never been called
- **AND** the runtime is NOT a WebSpatial runtime (`detectSpatialRuntime() === null`)
- **THEN** the SDK MUST NOT log a "boot was forgotten" warning, since the rendered fallback IS the user's final intended display in this environment

---

### Requirement: Component facades

For every spatial React component publicly exported by `@webspatial/react-sdk`, the default entry MUST provide a facade with the same TypeScript signature. The SDK also maintains internal HOC wrapper facades (`withSpatialized2DElementContainer`, `withSpatialMonitor`) for the JSX-runtime marker path; those factories are not documented public default-entry exports after the `internalize-hoc-factories` change. Facades MUST delegate to the real implementation via the bridge when `isSpatialReady()` is `true`, and MUST render the documented per-component default fallback otherwise.

Facades MUST NOT accept a generic `fallback` prop in v1; per-component default fallbacks are fixed by this Requirement and customization is the application's responsibility (using `useSpatialReady()` to write a wrapper component is the recommended pattern).

Facade implementations MUST be self-contained within the default entry: they MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`, MUST NOT call into runtime APIs that exist only in the spatial chunk, and MUST NOT instantiate `@webspatial/core-sdk` runtime classes during fallback rendering. The complete web-mode rendering for every facade MUST be reachable purely through the default entry's static module graph.

Facade `displayName` MUST match the public component name (`Model`, `Reality`, `BoxEntity`, etc.). Internal HOC wrapper facades MUST follow the existing `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` naming convention. Facades MUST NOT be wrapped in `React.memo` (props-identity comparison semantics are the real implementation's choice; the facade does not impose memoization).

Additional file-level constraints on facade modules (the `'use client'` directive in particular) are pinned by the "SSR and hydration safety" Requirement.

#### Per-component default fallback

| Public name | Default fallback rendering in the default entry |
| --- | --- |
| `Model` | Strip spatial-only event props (`onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`) and the `spatialEventOptions` prop, then render `<model ref={ref} {...remainingProps} />`, preserving today's degraded behavior in plain browsers |
| `Reality` | A single `<div aria-hidden="true" ref={ref}>` placeholder that preserves the layout box (className, style, and other layout-affecting props apply to the host); the React children subtree MUST NOT mount |
| `Entity` (the base Entity component / empty transform group), `BoxEntity` / `Box`, `SphereEntity` / `Sphere`, `ConeEntity` / `Cone`, `CylinderEntity` / `Cylinder`, `PlaneEntity` / `Plane`, `ModelEntity`, `AttachmentEntity` | `null` |
| `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset` | `null` |
| `SceneGraph` / `World` | `null` (children NOT mounted) |

> The factory-style HOCs `withSpatialized2DElementContainer(Comp)` and `withSpatialMonitor(El)` originally appeared in this fallback table as public surface (returning `<Comp {...passthroughProps} ref={ref} />` / `<El {...passthroughProps} ref={ref} />` respectively). They have since been demoted to **internal-only** — see the `internalize-hoc-factories` changeset. The factories still exist (the SDK's own JSX runtime continues to reach them via `src/internal/facades-client.ts` to compile `<div enable-xr>` / `<div enable-xr-monitor>` JSX markers), but they are no longer part of the documented public surface. The wrapper-cache identity contract pinned in the Scenario below still applies to that internal usage; the JSX-runtime-driven wrap path is what every consumer of the markers reaches in practice.

#### Scenario: Facade renders documented fallback while spatial implementation is unavailable

- **WHEN** a facade is rendered while `isSpatialReady()` is `false`
- **THEN** it MUST render the per-component default fallback specified in the table above
- **AND** the rendering MUST NOT depend on any module outside the default entry
- **AND** it MUST NOT trigger any dynamic import
- **AND** the rendering MUST be the same regardless of why `isSpatialReady()` is `false` (non-WebSpatial browser, SSR, boot in flight, boot rejected, or boot never called)

#### Scenario: Facade renders real implementation after boot in spatial runtime

- **WHEN** `bootSpatial()` has resolved in a WebSpatial runtime
- **AND** a facade is then rendered
- **THEN** the facade MUST mount the real implementation from the spatial chunk
- **AND** all props MUST be forwarded to the real implementation unchanged

#### Scenario: HOC facade preserves wrapper-cache identity contract

- **WHEN** the JSX runtime (or any other internal SDK code path) invokes the internal `withSpatialized2DElementContainer(Comp)` or `withSpatialMonitor(Comp)` factory with the same `Comp` reference more than once
- **THEN** repeated invocations MUST return the same wrapper component reference
- **AND** the cache key MUST be the raw `Comp` reference; structurally equivalent but distinct references MUST yield distinct wrappers
- **AND** the cached wrapper component MUST itself behave as a facade (web fallback before boot, real implementation after boot)
- **AND** this contract applies to the internal factories reachable via `src/internal/facades-client.ts`; the factories were originally documented as public APIs in v1 and have since been demoted to internal-only per the `internalize-hoc-factories` change

#### Scenario: Mounted facade switches to real implementation when bridge becomes ready

- **WHEN** a facade is mounted with `isSpatialReady() === false`
- **AND** the bridge subsequently becomes ready (e.g. `bootSpatial()` resolves)
- **THEN** the facade MUST re-render and mount the real implementation on the next React commit, without requiring an explicit parent re-render or a `key` change
- **AND** any DOM identity preserved by the React reconciler (e.g. `ref` continuity) MUST be respected by the facade's switch logic

#### Scenario: Model fallback renders degraded `<model>` tag

- **WHEN** the `Model` facade renders in fallback mode
- **THEN** it MUST render a native `<model>` element with the layout-affecting and asset-related props passed through (e.g. `src`, `style`, `className`)
- **AND** spatial-only event handler props (`onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`) MUST be stripped before reaching the `<model>` element
- **AND** the `spatialEventOptions` prop MUST be stripped
- **AND** the forwarded `ref` MUST be attached to the `<model>` element

#### Scenario: Reality fallback preserves layout

- **WHEN** the `Reality` facade renders in fallback mode
- **THEN** it MUST render exactly one host placeholder `<div>` that preserves the layout box (className, style, and other layout-affecting props apply to that host)
- **AND** the placeholder MUST NOT participate in keyboard focus
- **AND** the placeholder MUST be excluded from the accessibility tree (`aria-hidden="true"`)
- **AND** the `Reality` facade MUST NOT mount its React children subtree in fallback mode

#### Scenario: Facade ref is null when fallback renders no host element

- **WHEN** a facade renders fallback that returns `null` or a Fragment (e.g. `BoxEntity`, `UnlitMaterial`, `SceneGraph` with no children)
- **THEN** any forwarded `ref.current` MUST be `null` (consistent with React's behavior when `forwardRef` resolves to no host node)

#### Scenario: Facade displayName matches public name

- **WHEN** a facade is inspected via React DevTools or `Component.displayName`
- **THEN** its `displayName` MUST equal the public exported name (e.g. `Model`, `Reality`, `BoxEntity`)
- **AND** internal HOC wrapper facades produced by `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(Comp)` MUST follow the existing `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` naming convention

---

### Requirement: Hook placeholders

For every spatial Hook publicly exported from the default entry of `@webspatial/react-sdk`, the default entry MUST provide a placeholder that is invoked unconditionally per render and returns a documented stable default value. Real hook implementations MUST be loaded only after `bootSpatial()` resolves and MUST NOT be invoked during the placeholder phase.

Internal hooks consumed only by spatial components (the `useEntity` family, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) are NOT publicly exported and MUST NOT appear in the default entry. They live in `@webspatial/react-sdk/spatial` and ship with the spatial chunk; they have no placeholder and MUST be unreachable from the default entry.

A given component instance MUST consistently use either the placeholder hook (web mode) or the real hook (spatial mode) for its entire lifetime. The SDK MUST NOT switch between placeholder and real hook implementations within a single component instance, even if `isSpatialReady()` transitions from `false` to `true` during that instance's lifetime. Switching to the real hook implementation MUST happen only when the component is unmounted and remounted (for example via a `key` change, a parent unmount, or a fresh page load).

#### Public spatial Hooks and their documented web-mode defaults

| Hook         | Signature                                                                                                                  | Web-mode return value                                                                                                                                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useMetrics` | `() => { pointToPhysical: (pt: number, opts?: object) => number; physicalToPoint: (m: number, opts?: object) => number }` | An object whose `pointToPhysical` and `physicalToPoint` properties are module-level constant function references. `pointToPhysical(pt) === pt / 1360`. `physicalToPoint(m) === m * 1360`. The two function identities MUST remain stable across all renders and all `bootSpatial()` calls during the page lifetime. |

#### Scenario: useMetrics placeholder returns the documented fallback values

- **WHEN** `useMetrics()` is invoked in a non-WebSpatial browser, during SSR, or before `bootSpatial()` has resolved
- **THEN** the returned object MUST expose `pointToPhysical` and `physicalToPoint` matching the table above
- **AND** `pointToPhysical(0)` MUST equal `0`
- **AND** `pointToPhysical(1360)` MUST equal `1`
- **AND** `physicalToPoint(1)` MUST equal `1360`
- **AND** the call MUST NOT throw, MUST NOT schedule a network request, MUST NOT subscribe to a `window`-scoped external store

#### Scenario: useMetrics function identities are stable across renders

- **WHEN** a component invokes `useMetrics()` across multiple renders while `isSpatialReady()` remains `false`
- **THEN** the `pointToPhysical` reference returned in render N MUST be `===` the `pointToPhysical` returned in render N-1
- **AND** the `physicalToPoint` reference returned in render N MUST be `===` the `physicalToPoint` returned in render N-1

#### Scenario: useMetrics is SSR-safe

- **WHEN** `useMetrics()` is invoked in an environment without `window` (e.g. under `renderToString` / `renderToPipeableStream`)
- **THEN** it MUST NOT throw
- **AND** the placeholder MUST return the same constant functions documented in the table above
- **AND** if the implementation uses `useSyncExternalStore`, it MUST provide a `getServerSnapshot` that returns a stable value without touching `window`

#### Scenario: Real hook is used only after boot in spatial runtime

- **WHEN** `bootSpatial()` has resolved in a WebSpatial runtime
- **AND** a component that calls a public spatial hook is mounted for the first time
- **THEN** the real hook implementation from the spatial chunk MUST be invoked

#### Scenario: Hook implementation does not switch mid-life

- **WHEN** a component instance has rendered at least once while `isSpatialReady()` was `false`
- **AND** `isSpatialReady()` later becomes `true`
- **THEN** that component instance MUST continue to invoke the placeholder hook for the remainder of its lifetime
- **AND** to start using the real hook implementation the component MUST be unmounted and remounted

#### Scenario: Remount picks up the real hook implementation

- **WHEN** a component using a public spatial hook unmounts after `isSpatialReady()` has become `true`
- **AND** the same component (or a new instance with a different React `key`) mounts again
- **THEN** the new instance MUST invoke the real hook implementation from the spatial chunk

#### Scenario: New publicly exported spatial hooks must define documented defaults

- **WHEN** a future SDK version adds a new spatial Hook to the default entry's public exports
- **THEN** the table in this Requirement MUST be updated with that Hook's signature and its documented web-mode default value
- **AND** an automated test in the react-sdk package MUST verify the placeholder against those documented defaults
- **AND** the new placeholder MUST satisfy the SSR-safety, identity-stability, and no-mid-life-switch constraints already defined for `useMetrics`

---

### Requirement: JSX runtime strips spatial markers and wraps with facade HOCs

The package MUST expose a single unified JSX runtime (`jsx-runtime` and `jsx-dev-runtime` subpaths). The previously separate `jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` files MUST be removed; one runtime serves both plain web and WebSpatial environments. The runtime MUST act on every JSX call site (`jsx`, `jsxs`, `jsxDEV`).

For each call:

1. **Strip** the WebSpatial-only markers from props before delegating to React's JSX runtime: the `enable-xr` prop, the `enable-xr-monitor` prop, the `enableXr` key inside `props.style`, and the `__enableXr__` token inside `props.className`.

2. **Wrap** the element type with the corresponding **facade HOC** from the SDK-internal `@webspatial/react-sdk/internal/facades-client` boundary when a marker is present and the facade HOC is callable:
   - `enable-xr` / `style.enableXr` / `__enableXr__` → `withSpatialized2DElementContainer(type)`
   - `enable-xr-monitor` → `withSpatialMonitor(type)`

   The facade HOCs (defined by "Component facades") decide at render time whether to render the per-component fallback (web) or the real spatialized container (spatial runtime). The JSX runtime MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`; it relies entirely on the facade indirection for spatial behavior.

   **RSC Client Reference caveat**: `jsx-runtime` / `jsx-dev-runtime` themselves MUST remain server-callable. In React Server Components server bundles, the internal `facades-client` boundary may resolve `Model`, `withSpatialized2DElementContainer`, and `withSpatialMonitor` to Client References (opaque objects) rather than callable functions. In that environment the JSX runtime MUST strip markers but MUST NOT attempt to invoke the Client References; it MAY leave the element type unwrapped because the internal HOC fallback is transparent and therefore produces the same server HTML that the wrapped client fallback would hydrate. In client bundles and SSR environments where the internal facade HOCs are callable functions, the full strip + wrap path MUST run.

3. When `type === Model` (the public `Model` facade), the JSX runtime MUST NOT wrap or strip — `Model` handles its own runtime branching internally. This preserves today's AVP behavior.

**Mutation policy**: the top-level `props` object passed to a JSX call is created fresh per render by React's JSX transform and MAY be mutated in place (delete attribute keys, reassign `className`). However, `props.style` MAY be a user-memoized object shared across renders or with sibling consumers. When the `enableXr` key is present in `props.style`, the runtime MUST produce a new style object that omits the `enableXr` key (e.g. via shallow spread / object-rest destructuring) and reassign `props.style` to that new object; the runtime MUST NOT mutate the original `props.style` reference. This protects against (a) corrupting a memoized style object across renders, (b) mutating an `Object.freeze`d style object (which would throw in strict mode), and (c) cross-component aliasing of a shared style constant.

**Marker source**: only `props.className` is recognized as a class-name source. The HTML-style `props.class` (rare in React) MUST NOT be recognized as a marker source in v1.

#### Scenario: enable-xr triggers facade wrap and prop is stripped

- **WHEN** an element is created with the `enable-xr` prop
- **THEN** the prop MUST be removed from props before delegating to React
- **AND** when the internal facade HOC is callable, the element type passed to React MUST be `withSpatialized2DElementContainer(type)` (the facade HOC version)
- **AND** when an RSC server bundle resolves the facade HOC to a Client Reference, the runtime MUST NOT call it and MAY pass the original element type after stripping the prop

#### Scenario: enable-xr-monitor triggers monitor facade wrap and prop is stripped

- **WHEN** an element is created with the `enable-xr-monitor` prop
- **THEN** the prop MUST be removed from props before delegating to React
- **AND** when the internal facade HOC is callable, the element type passed to React MUST be `withSpatialMonitor(type)` (the facade HOC version)
- **AND** when an RSC server bundle resolves the facade HOC to a Client Reference, the runtime MUST NOT call it and MAY pass the original element type after stripping the prop

#### Scenario: enableXr style key triggers wrap and is stripped without mutating the user style object

- **WHEN** an element is created with `style={someStyleRef}` where `someStyleRef` contains an `enableXr` key
- **THEN** the runtime MUST produce a new style object (e.g. via shallow spread / object-rest destructuring) that omits the `enableXr` key, and MUST reassign `props.style` to that new object
- **AND** the new style object MUST NOT contain the `enableXr` key
- **AND** the original `someStyleRef` MUST be unchanged after the JSX call (no `enableXr` deletion, no key reorder); this MUST hold even when `someStyleRef` is `Object.freeze`d
- **AND** when the internal facade HOC is callable, the element type passed to React MUST be `withSpatialized2DElementContainer(type)`
- **AND** when an RSC server bundle resolves the facade HOC to a Client Reference, the runtime MUST NOT call it and MAY pass the original element type after stripping the style key

#### Scenario: __enableXr__ class token triggers wrap and is stripped from className

- **WHEN** an element is created with a `className` string containing the `__enableXr__` token (whitespace-delimited)
- **THEN** the token MUST be removed from the className string before delegating to React
- **AND** the remaining class tokens MUST preserve original ordering and whitespace handling
- **AND** when the internal facade HOC is callable, the element type passed to React MUST be `withSpatialized2DElementContainer(type)`
- **AND** when an RSC server bundle resolves the facade HOC to a Client Reference, the runtime MUST NOT call it and MAY pass the original element type after stripping the class token

#### Scenario: HTML class attribute is not recognized as a marker source

- **WHEN** an element is created with `class="__enableXr__"` (the HTML-style attribute name) instead of `className`
- **THEN** the JSX runtime MUST NOT recognize `props.class` as a marker source
- **AND** props pass through to React unchanged (React itself decides how to handle a non-canonical `class` prop)

#### Scenario: Model type bypasses JSX runtime wrapping and stripping

- **WHEN** an element is created with `type === Model` (the public `Model` facade)
- **THEN** the JSX runtime MUST NOT strip any markers from props
- **AND** the JSX runtime MUST NOT wrap the type with any facade HOC
- **AND** props pass through to React unchanged

#### Scenario: No marker present is a no-op

- **WHEN** an element is created without any of the documented WebSpatial markers
- **THEN** the JSX runtime MUST forward props to React's JSX runtime without modification
- **AND** it MUST NOT clone `props.style`, MUST NOT split `className`, MUST NOT reassign any prop

#### Scenario: SSR strips markers and preserves hydration-safe output

- **WHEN** the JSX runtime is invoked during server-side rendering (e.g. `renderToString`, `renderToPipeableStream`, RSC)
- **THEN** the same marker-strip rules MUST apply
- **AND** when the internal facade HOCs resolve to callable functions, the same wrap rules MUST apply
- **AND** when an RSC server bundle resolves the internal facade HOCs to Client References, the runtime MUST NOT call them and MAY leave marked elements unwrapped after stripping
- **AND** the resulting server-rendered HTML MUST NOT contain the `enable-xr` attribute, the `enable-xr-monitor` attribute, the `enableXr` style key, or the `__enableXr__` class token
- **AND** subsequent client-side hydration MUST NOT report a hydration mismatch caused by these markers
- **AND** because `useSpatialReady()` returns `false` during SSR (per "Bridge singleton"), any wrapped facade HOC MUST render its documented fallback during SSR — not the real spatialized container
- **AND** client bundles MUST restore the full strip + wrap path once the internal facade HOCs are callable functions

---

### Requirement: SSR and hydration safety

In a server-side rendering context the default entry MUST behave as web mode: facades render their per-component default fallback, hook placeholders return their documented defaults, the bridge MUST NOT schedule any dynamic import, and registered `onSpatialLoadError` callbacks MUST NOT be invoked. The default entry MUST work under any React 18+ SSR API (including `renderToString`, `renderToPipeableStream`, `renderToReadableStream`, and React 19 `prerender*`) and inside React Server Components when the facade or hook is consumed via a Client Component.

**Entry routing (normative)**

- Applications that rely on SSR (streaming or synchronous), initial HTML snapshots that include WebSpatial primitives, or hydration of those primitives with the façade contracts in this Requirement MUST use the lazy-load **default entry** `@webspatial/react-sdk`. Facade SSR / hydration semantics in this Requirement apply **only** when spatial primitives resolve through that entry.
- The **eager** entry `@webspatial/react-sdk/eager` targets **client-rendered** spatial UI: spatial primitives imported from the eager entry MUST NOT be server-rendered as part of a supported configuration. Consumers MUST mount eager-imported spatial subtrees only on the client (e.g. Next.js `dynamic(..., { ssr: false })`, conditional render after `typeof window !== 'undefined'`, or a client-only route tree) **or** MUST use the default entry for SSR pages where those primitives participate in server HTML output. SSR or mixed SSR/CSR setups that eagerly import primitives from `@webspatial/react-sdk/eager` **AND** evaluate them during server render are **out of scope** for SDK guarantees — behavior MAY include hydration mismatches or runtime divergence; remediation is routing those imports to the default entry or gating the subtree to CSR.

To make hydration safe, the SDK MUST follow these constraints:

- **Client-component directive**: every facade module and every public hook module that calls React hooks MUST begin with the `'use client'` directive. The directive MUST be preserved through the build into the published `dist/` files. Without this directive, the React Server Components compiler will treat facades as Server Components and fail the moment they call hooks. Files that do not call React hooks (`runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `runtime/errors.ts`, the constant-only `useMetrics` placeholder source, plain type-only modules) MUST NOT carry the directive — they remain server-callable.
- **Hydration-aware readiness**: `useSpatialReady()` MUST be implemented with `useSyncExternalStore` (or another React-hydration-aware primitive that exposes a server snapshot). This guarantees that the value used during hydration matches the SSR snapshot, and React's built-in transition swaps to the live snapshot only after hydration commits — preventing any mismatch warning regardless of when `bootSpatial()` resolves relative to `hydrateRoot()`.
- **`getServerSnapshot` stability**: the `getServerSnapshot` argument passed to `useSyncExternalStore` inside `useSpatialReady` MUST be a single module-level constant function returning `false`. It MUST NOT be a fresh closure created per call (which would trigger React's "Snapshot is unstable" warning). The same module-level constant MAY also serve as the plain-web `getSnapshot` (per the `useSpatialReady` short-circuit) since both must report `false`.
- **Internal spatial host wrapper (`withSSRSupported`)**: real `Model` / `SpatializedContainer` (and similar) MUST gate heavy client work behind `useSyncExternalStore` with a stable module-level constant `getServerSnapshot` returning `false` during SSR **and** the client hydration pass, and `getSnapshot` returning `true` thereafter — yielding a deterministic `style`/`className` placeholder `<div>` without exporting `SSRProvider` / `SSRContext`.
- **Deterministic facade rendering**: given identical props, a facade's fallback rendering MUST produce identical DOM across renders and across server/client. The SDK only guarantees mismatch-free hydration when (a) facade props are identical between server and client, and (b) `useSpatialReady` follows the `useSyncExternalStore` constraint above.

Both `await bootSpatial(); hydrateRoot(...)` (boot before hydrate; bridge ready when hydrate starts) and `hydrateRoot(...); bootSpatial()` (hydrate first, boot after) MUST be supported. The `useSyncExternalStore`-based `useSpatialReady` makes both timings hydration-safe — but the "fallback flash" trade-off differs by rendering path:

- **Pure CSR path** (`await bootSpatial(); createRoot(...).render(...)`): the first React commit calls `getSnapshot()` (returning `true` since the bridge is already ready) and renders real spatial implementations directly. No fallback-to-real DOM swap occurs.
- **SSR + hydrate path with boot BEFORE hydrate** (`await bootSpatial()` followed by `hydrateRoot(...)`, with `await bootSpatial(); renderToString(...)` on the server): the **client hydration pass** still uses `getServerSnapshot()` returning `false` (per "First client render matches server render regardless of boot timing"), so the first client render produces fallback DOM matching the server-rendered HTML; the swap to real implementations happens on the next React commit. Hydration is mismatch-safe but the fallback-to-real swap is NOT avoidable in this path.
- **SSR + hydrate path with boot AFTER hydrate** (`hydrateRoot(...); void bootSpatial()`): hydration pass renders fallback (matching server); on `bootSpatial()` resolution the next commit swaps to real. Trades faster initial hydration for a slightly later swap point compared to boot-before.

Applications choose between SSR boot-before and SSR boot-after based on whether they want the spatial chunk fetch to start in parallel with HTML streaming (boot-before) or after the page is interactive (boot-after); the visible fallback-to-real swap is identical in both SSR sub-cases.

#### Scenario: Server render does not touch spatial chunk and does not invoke error listeners

- **WHEN** an application server-renders a tree containing facades or hook placeholders under any React 18+ SSR API (including `renderToString`, `renderToPipeableStream`, `renderToReadableStream`, React 19 `prerender*`, and React Server Components Client-Component rendering)
- **THEN** the spatial chunk MUST NOT be requested
- **AND** all facades MUST render their per-component default fallback markup
- **AND** `bootSpatial()` invoked during SSR MUST resolve without scheduling a dynamic import
- **AND** any `onSpatialLoadError` callbacks registered before SSR MUST NOT be invoked during SSR

#### Scenario: Streaming SSR is equivalent to synchronous SSR

- **WHEN** the application uses `renderToPipeableStream` or `renderToReadableStream` rather than synchronous `renderToString`
- **THEN** facade rendering, hook placeholder behavior, and bridge no-op semantics MUST be identical to the synchronous case
- **AND** facades MUST NOT introduce Suspense boundaries on their own
- **AND** the spatial chunk MUST NOT be requested in any chunk of the stream

#### Scenario: RSC client-component facade

- **WHEN** an application using React Server Components imports a facade (e.g. `Model`) into a Server Component file
- **THEN** the facade module MUST be honored as a Client Component reference (because the facade source begins with `'use client'`)
- **AND** the Server Component MUST NOT execute the facade's React hooks during the RSC render
- **AND** the RSC payload MUST contain the standard Client-Component reference for that node
- **AND** subsequent client-side hydration of the RSC payload MUST render the facade as in any other CSR / hydration scenario covered by this Requirement

#### Scenario: getServerSnapshot returns a stable constant

- **WHEN** `useSpatialReady()` is invoked under SSR
- **THEN** the `getServerSnapshot` argument passed to its internal `useSyncExternalStore` MUST be a single module-level function reference returning `false`
- **AND** repeated calls to that `getServerSnapshot` within the same SSR pass MUST return the same `false` value (referential and structural equality)
- **AND** React MUST NOT log a "The result of `getServerSnapshot` should be cached" warning for this hook

#### Scenario: First client render matches server render regardless of boot timing

- **WHEN** a tree containing facades is server-rendered and then hydrated on the client
- **AND** `bootSpatial()` may have been awaited before `hydrateRoot(...)`, after `hydrateRoot(...)`, or never
- **THEN** the first client render during hydration MUST produce DOM identical to the server render — i.e. fallback rendering for every facade
- **AND** hydration MUST complete without React hydration-mismatch warnings
- **AND** this contract is delivered by `useSpatialReady`'s `useSyncExternalStore`-based implementation, which uses `getServerSnapshot` (returning `false`) during hydration and only switches to the live snapshot after hydration commits

#### Scenario: Switch to spatial happens after hydration commits

- **WHEN** `bootSpatial()` resolves at any point — before, during, or after hydration
- **THEN** the switch from facade fallback to real spatial implementation MUST happen on a render cycle scheduled AFTER hydration commits, never during the hydration pass
- **AND** any DOM changes resulting from the switch MUST NOT be attributed to a hydration mismatch
- **AND** if `bootSpatial()` was awaited before `hydrateRoot(...)`, the hydration pass MUST still render fallback (matching server output); the swap to real implementation MUST happen on the next React commit

#### Scenario: Mismatch responsibility is limited to deterministic facade output

- **WHEN** the application supplies different props to a facade server-side vs client-side (for example because the server reads a request-specific value the client cannot reproduce, or because data fetching produces different results across the two passes)
- **THEN** the resulting hydration mismatch MUST be considered the application's responsibility, NOT a violation of this spec
- **AND** the SDK only guarantees mismatch-free hydration when facade props are identical between server and client and the SSR-related implementation constraints in this Requirement's preamble are met

---

### Requirement: Plugin-free integration

Applications MUST be able to use `@webspatial/react-sdk` without any build plugin. The package MUST NOT depend on `@webspatial/vite-plugin` (or any peer plugin) to satisfy the size, lazy-load, or runtime contracts in this spec.

**Bundler capability requirements** — the consuming bundler MUST support all three of:

1. **ECMAScript modules**: the package is published as ESM (`"type": "module"`); CommonJS `require()` is not supported.
2. **`exports` package.json field**: subpath resolution for `'.'`, `./eager`, `./jsx-runtime`, `./jsx-dev-runtime`, `./spatial`, and the SDK-internal `./internal/facades-client` boundary reached by the JSX runtime.
3. **Dynamic `import()` with code-splitting**: when the bridge invokes `import('@webspatial/react-sdk/spatial')`, the bundler MUST emit the spatial chunk as a separate output that is fetched on demand. Bundlers without code-splitting (e.g. bare esbuild without `splitting: true`) will inline the chunk into the main bundle; the SDK still functions correctly but the size-budget benefit defined by "Default entry MUST NOT bundle spatial implementation" is lost on the consumer side.

Bundlers and frameworks that satisfy all three capabilities form the **non-normative tested-targets list** (maintained in the migration guide, not in this spec): Vite ≥ 4, Webpack ≥ 5, Rollup ≥ 3, Rspack ≥ 1 (covered by `apps/spatial-rspack-min`), esbuild ≥ 0.18 with `splitting: true`. Next.js App Router (Webpack mode) and Next.js Pages Router are the canonical tested framework targets.

**Peer dependency contract** — the package's `peerDependencies` MUST list `react: ">=18.0"` and `react-dom: ">=18.0"` (the version that introduced `useSyncExternalStore`, on which `useSpatialReady` depends). Both peers MUST be **required** (`peerDependenciesMeta.<peer>.optional` MUST be `false` or absent — `optional: true` is forbidden in v1). React 18.x and React 19+ both satisfy the version constraint; the `'use client'` directive used by hook-using files (per "SSR and hydration safety") is honored by React 18.0+ in RSC contexts and is a benign no-op everywhere else.

The hard-peer decision reflects the v1 product reality: the default entry's primary surface is React-bound (facades, hooks, JSX runtime). Group B / C utilities (`bootSpatial`, `WebSpatialRuntime.supports`, `initScene`, `convertCoordinate`, etc.) are React-agnostic individually, but the package as a whole exists to deliver React integration; "use the package without React" is not a v1 contract. Future versions MAY publish a separate React-less subpath (e.g. `@webspatial/react-sdk/runtime`) if real consumer demand surfaces — see `tasks.md §12` follow-ups.

**Out of scope for v1** — the following environments MAY work in practice but are NOT part of the v1 contract; failures there MUST be tracked as feature requests / follow-up issues, NOT v1 spec violations:

- Module Federation / micro-frontend host-shared SDK setups
- Next.js Turbopack (`next dev --turbo`, `next build --turbo`)
- Webpack 4 and any other bundler without `exports` package.json field support
- CommonJS-only consumer pipelines

#### Scenario: Standalone Vite project

- **WHEN** a Vite + React project depends only on `@webspatial/react-sdk` (no `@webspatial/vite-plugin`)
- **THEN** the build MUST succeed without any SDK-specific bundler configuration
- **AND** the size budget and lazy-load contracts in this spec MUST hold
- **AND** the spatial chunk MUST be emitted as a separate output fetched only when `bootSpatial()` triggers it in a WebSpatial runtime

#### Scenario: Webpack 5+ or Rspack project (capability-equivalent)

- **WHEN** an application uses Webpack 5+ or Rspack as its bundler with ESM, package `exports`, and dynamic-import code-splitting enabled
- **THEN** the build MUST succeed without `@webspatial/vite-plugin` or any WebSpatial-specific bundler plugin
- **AND** the spatial chunk MUST be emitted as a separate Webpack/Rspack chunk (e.g. via the framework's standard chunk-splitting heuristics)
- **AND** the Rspack fixture (`apps/spatial-rspack-min`) MUST build both the lazy default entry and the eager entry
- **AND** the Rspack fixture MAY use resolver configuration required by the current SDK package output (for example `resolve.fullySpecified: false` for JavaScript modules while `@webspatial/core-sdk` preserves extensionless package-internal ESM imports)
- **AND** Next.js App Router (which uses Webpack 5 by default) is the canonical tested Webpack framework instance for this Scenario

#### Scenario: ESM-only consumption

- **WHEN** a consumer attempts `require('@webspatial/react-sdk')` from a CommonJS module
- **THEN** module resolution MUST fail (per Node.js rules for ESM-only packages)
- **AND** the published `package.json` MUST set `"type": "module"` and MUST NOT publish CommonJS entry points
- **AND** consumers in CommonJS pipelines MUST use dynamic `await import('@webspatial/react-sdk')` (a node feature outside this spec's contract; SDK does not provide a CommonJS interop shim)

#### Scenario: Bundler without code-splitting still functions, but loses the size benefit

- **WHEN** a bundler that does NOT support dynamic-import code-splitting processes an application using `@webspatial/react-sdk` (e.g. bare esbuild without `splitting: true`, or an analogous CommonJS-style bundler)
- **THEN** the build MUST succeed
- **AND** `bootSpatial()` MUST resolve correctly because the implementation has been functionally inlined into the main bundle (no network request occurs because the chunk does not exist as a separate file)
- **AND** the per-application size benefit defined by "Default entry MUST NOT bundle spatial implementation" is lost on that application's bundle (a documented limitation of the consumer's bundler choice, NOT a violation of this spec)
- **AND** the SDK-side `dist/index.js` size budget MUST still hold (this is enforced on the published package, independent of how a downstream bundler chooses to assemble the application)

#### Scenario: React peer is required (hard peer)

- **WHEN** the published `packages/react/package.json` is inspected
- **THEN** `peerDependencies.react` MUST be `">=18.0"` and `peerDependencies["react-dom"]` MUST be `">=18.0"`
- **AND** `peerDependenciesMeta.react.optional` and `peerDependenciesMeta["react-dom"].optional` MUST be `false` (or the entries MUST be absent, since `false` is the npm/pnpm/yarn default)
- **AND** an SDK-side test MUST assert these declarations match expectations and fail when either peer is mistakenly marked optional

#### Scenario: Missing or older React surfaces an unmet peer

- **WHEN** an application's installed React version is older than `18.0`, OR React is not installed at all
- **THEN** `npm` / `pnpm` / `yarn` MUST surface the unmet (or version-mismatched) peer-dependency requirement at install time
- **AND** the SDK MUST NOT advertise compatibility with React versions older than `18.0`
- **AND** React 18.x and React 19+ both MUST work; the `'use client'` directive in hook-using files is honored by React 18+ RSC tooling and is benign in non-RSC environments

#### Scenario: React-less use is not a v1 contract

- **WHEN** a consumer attempts to use only the React-agnostic subset of the package's API (e.g. `bootSpatial`, `WebSpatialRuntime.supports`, `initScene`, `convertCoordinate`) without installing React
- **THEN** the SDK does NOT guarantee this works in v1 — the unmet peer warning MUST surface, and the consumer SHOULD install React even if unused
- **AND** breakage in this scenario is NOT a v1 spec violation; it is tracked as a feature request for a future React-less subpath (e.g. `@webspatial/react-sdk/runtime`) per `tasks.md §12` follow-ups

#### Scenario: Removed legacy subpaths

- **WHEN** an application or build plugin attempts to import `@webspatial/react-sdk/web` or `@webspatial/react-sdk/default`
- **THEN** module resolution MUST fail (the subpaths are removed in this version)
- **AND** the package CHANGELOG MUST mark the removal as a breaking change with a documented migration path

#### Scenario: Spatial container internals are no longer publicly exported

- **WHEN** an application attempts a named import of any of the following identifiers from the default entry: `SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`
- **THEN** the import MUST fail at TypeScript compile time (the names are not in the public type surface) and at runtime (the names are not bound on the default entry's namespace object)
- **AND** these identifiers MUST live only inside `@webspatial/react-sdk/spatial` as implementation internals consumed by facades and the internal HOC factories (`withSpatialized2DElementContainer`, `withSpatialMonitor`; both factories are internal-only per the `internalize-hoc-factories` change)
- **AND** the package CHANGELOG MUST mark the removal as a breaking change with the migration path "use the `enable-xr` / `enable-xr-monitor` JSX markers (resolved via `tsconfig.jsxImportSource`) instead of constructing containers / monitors directly" (originally the migration path pointed at the HOC factories `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(Comp)`; those factories were demoted to internal-only in the `internalize-hoc-factories` change)
- **AND** an automated test MUST verify these identifiers are absent from `dist/index.js` per "Spatial-only identifiers are absent from default entry"

#### Scenario: createElement export is deprecated

- **WHEN** an application imports `createElement` from `@webspatial/react-sdk` (used historically with the classic JSX transform — `tsconfig` `"jsx": "react"` plus `"jsxFactory": "createElement"`)
- **THEN** the import MUST continue to function in v1 with the same strip + facade-HOC wrap behavior as the unified JSX runtime (per "JSX runtime strips spatial markers and wraps with facade HOCs")
- **AND** the export MUST carry an `@deprecated` JSDoc annotation pointing users at the new JSX transform (`tsconfig` `"jsx": "react-jsx"` / babel `runtime: "automatic"`), which routes through the `./jsx-runtime` and `./jsx-dev-runtime` package.json `exports` mappings
- **AND** the package CHANGELOG MUST announce v2 removal so consumers have a migration window
- **AND** the v2 removal is OUT OF SCOPE for this change; only the deprecation flag, JSDoc, and CHANGELOG note land in v1

#### Scenario: Out-of-scope environments may work but are not v1 contracts

- **WHEN** an application uses one of the documented out-of-scope environments (Module Federation, Next.js Turbopack, Webpack 4, CommonJS-only pipelines)
- **THEN** the SDK MAY still work but this spec does NOT guarantee compatibility
- **AND** breakage in these environments MUST be triaged as a feature-request follow-up issue, NOT as a v1 spec violation
- **AND** the migration guide MUST link the relevant follow-up issue trackers (or note that none exists yet) so consumers can track future support

---

### Requirement: Stateless utility APIs and pure re-exports remain in the default entry

A subset of the public API consists of **stateless utility functions, pure constants, and type re-exports** that are independent of `@webspatial/react-sdk/spatial`. They MUST live in the default entry's static module graph, MUST NOT participate in the bridge / facade / placeholder pattern, MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`, and MUST function correctly without `bootSpatial()` ever being called.

These APIs split into two groups by mechanism:

**Group B — bridge-session-aware utilities** route through the React SDK bridge (`getSpatialImpl()?.getSession?.()`) after `bootSpatial()` has resolved. They gracefully degrade when no spatial implementation or `SpatialSession` is reachable, per the `runtime-capabilities` spec's "Unsupported behavior contracts" Requirement. They MUST NOT import `@webspatial/core-sdk` at runtime from the default entry.

| API | Behavior when no session is reachable |
| --- | --- |
| `initScene(name, callback, options?)` | Returns `undefined` without side effects when the bridge has no session |
| `convertCoordinate(position, { from, to })` | Resolves with `position` unchanged; MAY emit a one-shot `console.warn` (pinned in `runtime-capabilities` "Unsupported behavior contracts" Requirement) |
| `enableDebugTool()` | Returns immediately when `typeof window === 'undefined'`; in browser runtime attaches `inspectCurrentSpatialScene` and `getSpatialized2DElement` to `window`; diagnostic helpers read the bridge session lazily and throw a descriptive `bootSpatial()`-pointing error if no session is available |

**Group C — pure constants, type re-exports, and React Context**:

| API | Description |
| --- | --- |
| `WebSpatialRuntime.supports(name, tokens?)` | Synchronous capability lookup against the React SDK's local copy of the runtime-capability table. Pure data, no spatial chunk or core-sdk runtime dependency. Behavior pinned by the `runtime-capabilities` spec. |
| `WebSpatialRuntimeError` | Local `Error` subclass matching the runtime-capability error contract. |
| `CapabilityKey` | TypeScript type exported from the React SDK local capability helper. Compile-time only. |
| `version` | A `string` constant injected at build time via `__WEBSPATIAL_REACT_SDK_VERSION__`. |
| Component / Hook / Entity / Model type-only re-exports (e.g. `SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`) | Compile-time only; no runtime presence. |

**Subtle consequence**: an application running in a WebSpatial runtime that does NOT call `bootSpatial()` will see facades render their fallback and Group B utilities gracefully degrade because both read from the same unready bridge. This keeps the default entry core-free at runtime and makes `bootSpatial()` the single activation path for spatial implementation behavior.

#### Scenario: Group B utilities work without `bootSpatial()`

- **WHEN** an application invokes `initScene(...)`, `convertCoordinate(...)`, or `enableDebugTool()`
- **AND** has not awaited `bootSpatial()`
- **THEN** the calls MUST behave per the `runtime-capabilities` spec's "Unsupported behavior contracts" Requirement (graceful degradation: noop / return input / SSR-safe noop)
- **AND** the spatial chunk MUST NOT be loaded as a side effect of these calls

#### Scenario: `WebSpatialRuntime.supports` works without `bootSpatial()`

- **WHEN** an application calls `WebSpatialRuntime.supports('Model')` (or any other capability key) at any point in the page lifetime
- **THEN** the call MUST resolve synchronously against the React SDK's local capability table without scheduling any dynamic import
- **AND** the result MUST follow the `runtime-capabilities` Requirement contracts (`false` in non-WebSpatial browsers; `true` / `false` per the shell-version capability table in WebSpatial runtimes)

#### Scenario: Group C pure helpers are SSR-safe and side-effect free

- **WHEN** `WebSpatialRuntimeError` is constructed or thrown by application code
- **THEN** it MUST behave as a standard `Error` subclass without requiring the spatial chunk or a core-sdk runtime import

#### Scenario: Type-only re-exports vanish at runtime

- **WHEN** the published `dist/index.js` is inspected for runtime values
- **THEN** TypeScript type-only re-exports (e.g. `SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`) MUST contribute zero runtime bytes (consistent with `export type` semantics in tsup output)

#### Scenario: Stateless utilities are part of the default-entry size budget

- **WHEN** the `dist/index.js` size budget is measured (per "Default entry MUST NOT bundle spatial implementation")
- **THEN** the published Group B utility implementations and Group C constants / helpers MUST be counted within the gzipped budget
- **AND** they MUST NOT be split into a separate chunk to circumvent the budget
- **AND** the measurement MUST include a build-output assertion that the default-entry static graph contains no runtime imports from `@webspatial/core-sdk`

---

### Requirement: Tree-shake friendliness

The marginal-bundle-delta budget pinned by "Default entry MUST NOT bundle spatial implementation" depends on consumer bundlers tree-shaking unused exports out of the SDK's barrel. The SDK MUST publish itself in a way that lets standard ESM tree-shaking in Vite, Webpack 5+, Rollup, and Rspack reach the per-API granularity the budget assumes (named imports paying only for the named API's transitive dependencies, not for the full barrel).

The contract has three normative parts:

1. **`"sideEffects": false` declaration** — the published `package.json` MUST declare `"sideEffects": false` (or a precise allow-list of files that genuinely need side effects, kept as small as possible). Without this declaration, modern bundlers conservatively retain every module reachable from the barrel, defeating the named-import cost budget.

2. **No top-level observable side effects** — every module in the default entry's static graph MUST NOT execute any expression with **observable** side effects at module top level. "Observable" means visible from outside the module: writes to globals (`window.x = ...`, `globalThis.x = ...`), mutation of imported bindings, network requests, DOM manipulation, registration of event listeners on global objects, or calls to imported functions whose execution mutates external state.

   Module-private pure initialization is **explicitly permitted**, including:
   - Module-level data structure construction (`const cache = new Map()`, `const subscribers = new Set()`)
   - React factory calls intended by their library to be tree-shakable: `forwardRef(impl)`, `memo(component)`, `createContext(default)`, `lazy(loader)`
   - Any expression annotated with the `/* @__PURE__ */` magic comment
   - Numeric / string / object-literal constant initializers that do not invoke imported functions

   These are permitted because their result is a module-local value that vanishes from the consumer's bundle when the module itself is tree-shaken away; bundlers (Vite, Webpack 5+, Rollup, Rspack, esbuild) recognize them via `/* @__PURE__ */` annotations or per-package side-effect heuristics.

   Side effects with externally visible consequences MUST be deferred into functions invoked on demand (e.g. `bootSpatial()`, `enableDebugTool()`).

3. **Re-export shape** — the barrel `src/index.ts` SHOULD prefer named re-exports (`export { Model } from './facades/Model'`) over wildcard re-exports (`export * from './facades'`) where practical, to reduce ambiguity for bundler tree-shaking heuristics. Wildcard re-exports remain acceptable for type-only re-exports (`export type * from ...`) since types vanish at runtime.

#### Scenario: Published package declares sideEffects: false

- **WHEN** the published `packages/react/dist/package.json` (or the package.json published to the registry) is inspected
- **THEN** it MUST contain `"sideEffects": false` OR a precise allow-list array containing only files that legitimately have side effects
- **AND** an SDK-side test MUST assert this field exists with a value other than `true`

#### Scenario: No observable top-level side effects in default-entry modules

- **WHEN** any module in `packages/react/src/` reachable from `src/index.ts` (the default entry) is statically analyzed
- **THEN** the module body at top level MUST NOT contain any of the following:
  - Conditional or unconditional statements that perform writes to globals (e.g. `window.x = ...`, `globalThis.x = ...`)
  - Bare function-call statements that mutate external state (e.g. `initPolyfill()`, `attachListener(window, ...)`)
  - `import` for side effects only (`import 'some-side-effect-module'`)
  - Expression statements whose evaluation is not annotated `/* @__PURE__ */` and is not a known tree-shakable React factory call
- **AND** the existing top-level `if (typeof window !== 'undefined') { initPolyfill() }` in `src/index.ts` MUST be removed (this is also tracked in `tasks.md §7.2`); polyfill installation moves into the spatial chunk's bootstrap

#### Scenario: Module-private pure initialization is permitted

- **WHEN** a module in the default entry's static graph contains top-level expressions that produce module-local values without observable external effects
- **THEN** the following patterns MUST be permitted by the `tasks.md §9.6` lint:
  - `const Component = forwardRef<...>((props, ref) => { ... })`
  - `const wrapperCache = new Map<Component, Component>()`
  - `const readinessSubscribers = new Set<() => void>()`
  - `const SpatialContext = createContext<Bridge | null>(null)`
  - `const Memoized = /* @__PURE__ */ memo(BaseComponent)`
  - `const alwaysFalse = () => false`
- **AND** these MUST NOT be flagged as side-effect violations because their results are module-local values that vanish from the consumer bundle when the parent module is tree-shaken

#### Scenario: Named re-export preferred over wildcard for runtime values

- **WHEN** the barrel `src/index.ts` re-exports a runtime value (function, class, component)
- **THEN** the re-export SHOULD use the explicit named form `export { name } from './module'` rather than `export * from './module'`
- **AND** wildcard re-exports MAY be used for type-only re-exports because TypeScript types do not affect runtime tree-shaking

#### Scenario: Tree-shake validation in fixture

- **WHEN** the marginal-delta CI fixture (per "Default entry MUST NOT bundle spatial implementation") builds two consumer applications — one importing `Model` only, one importing the full set of public APIs — and compares their gzipped sizes
- **THEN** the `Model`-only application's marginal delta MUST be substantially smaller than the all-imports application's marginal delta (a tree-shaking effectiveness check; a flat ratio close to 1.0 indicates broken tree-shaking even if the absolute number passes)
- **AND** the recommended "named imports the user actually uses" pattern MUST satisfy the 8 KB budget per "Default entry MUST NOT bundle spatial implementation"

---

### Requirement: Eager-mode entry for spatial-only consumers

The package MUST expose a second published subpath, `@webspatial/react-sdk/eager`, in parallel with the lazy-load default entry (`@webspatial/react-sdk`). The eager entry MUST statically link the spatial implementation into the consumer's bundle so that consumers who target spatial-only runtimes (internal AVP / Pico enterprise apps, App Store apps shipped to fixed spatial devices, deeply spatial-first product surfaces) pay one network request instead of two and skip the `bootSpatial()` round-trip entirely.

**CSR-only for spatial primitives (normative)** — The eager entry is for applications that embed spatial UI in **purely client-rendered surfaces** or that CSR-gate subtrees importing this entry. SSR (or prerender HTML) configurations that invoke eager-imported spatial primitives on the server are **unsupported** — see "**Entry routing (normative)**" under "SSR and hydration safety". Applications needing SSR for spatial primitives MUST use `@webspatial/react-sdk`.

The eager entry MUST re-export the same TypeScript surface as the default entry — the named-export set MUST be a strict superset (no facade name MAY be missing, no hook name MAY be missing, no stateless utility MAY be missing) — so consumer code can migrate from the default entry to the eager entry by changing only the import root.

Within that named-export set:

- **Spatial primitives** (the facade names — `Model`, `Reality`, `Entity`, `BoxEntity` family, materials / assets, `SceneGraph` / `World`, and `useMetrics`) MUST resolve to the **real spatial implementations** loaded statically from `@webspatial/react-sdk/spatial`, not to facade fallbacks. Factory-style HOCs remain internal-only after the `internalize-hoc-factories` change; the public marker path is `enable-xr` / `enable-xr-monitor`, and the eager entry preloads the bridge so JSX-runtime marker wrappers reached through `@webspatial/react-sdk/internal/facades-client` render real implementations on first client render.
- **Stateless utilities** (Group B / Group C per "Stateless utility APIs and pure re-exports remain in the default entry": `enableDebugTool`, `convertCoordinate`, `initScene`, `WebSpatialRuntime`, `WebSpatialRuntimeError`, `version`, `createElement` (`@deprecated` per "createElement export is deprecated"), type-only re-exports including the core-sdk type re-exports) MUST be the same module-level references the default entry exposes (re-export, not redeclare). This guarantees behavior parity and allows shared code paths. The `@deprecated` `createElement` export MUST carry its JSDoc on the eager-entry surface too — re-export via `from './index'` preserves the annotation automatically.
- **Lazy-load runtime API** (`bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`, `SpatialBoot`) MUST be exposed as **compatibility stubs** (or real `SpatialBoot` with eager semantics) so that consumer code written against the default entry still type-checks and runs unchanged when its import root switches to the eager entry. The stub semantics are pinned by the Scenarios below. A public `useBootSpatial` hook MUST NOT be required on either entry in v1.

The eager entry MUST install the same polyfills as the spatial chunk (the `@webspatial/core-sdk/install-polyfills` side effect and the `initPolyfill()` container bootstrap) at module-evaluation time, since by definition the eager entry IS the spatial chunk for these consumers and there is no `bootSpatial()` to defer the install to.

The eager entry MUST coexist with the lazy-load default entry without polluting it: the default entry's marginal-delta budget (per "Default entry MUST NOT bundle spatial implementation") MUST hold byte-identically before and after the eager entry's existence, validated by the existing §9.2 fixture (which imports the default entry, not the eager entry).

#### Scenario: Single network request — no `/spatial` chunk fetched

- **WHEN** a consumer imports `@webspatial/react-sdk/eager` and renders a tree containing facades / hooks
- **THEN** the spatial implementation MUST be statically linked into the consumer's main bundle by the consumer's bundler
- **AND** no second network request to `@webspatial/react-sdk/spatial` MUST occur for the page lifetime
- **AND** the polyfill side effects (`@webspatial/core-sdk/install-polyfills`, the `initPolyfill()` container bootstrap) MUST install at eager-entry module-evaluation time, before the first React render

#### Scenario: Spatial primitives mount real implementations on first render

- **WHEN** a consumer imports `Model` (or any other spatial primitive) from `@webspatial/react-sdk/eager` and renders it for the first time
- **THEN** the rendered tree MUST contain the real spatial implementation, not the facade fallback
- **AND** no facade-to-real swap MUST occur on a subsequent commit — the eager entry's first commit IS the real implementation
- **AND** this MUST hold even when the consumer never calls `bootSpatial()`

#### Scenario: `bootSpatial()` compatibility stub is a no-op

- **WHEN** a consumer calls `bootSpatial()` after importing from the eager entry
- **THEN** the call MUST return `Promise.resolve()` immediately (no dynamic import, no network request, no error)
- **AND** development builds MAY log a one-shot `console.warn` indicating that `bootSpatial()` is unnecessary on the eager entry
- **AND** the warning MUST NOT fire repeatedly within the same page lifetime

#### Scenario: `isSpatialReady` / `useSpatialReady` always report ready

- **WHEN** a consumer calls `isSpatialReady()` after importing from the eager entry
- **THEN** it MUST return `true` immediately (synchronous read; reflects that the spatial implementation is statically linked)

- **WHEN** a consumer calls `useSpatialReady()` after importing from the eager entry
- **THEN** it MUST return `true` on the first and every subsequent render
- **AND** stubs MAY omit `useSyncExternalStore` (`useSpatialReadyEager()` is implemented as a constant `true`; `isSpatialReady()` is synchronous) — this is intentional for CSR-only ergonomics
- **AND** eager spatial primitives MUST NOT be server-rendered in a supported configuration (per "**CSR-only for spatial primitives**" above); parity with lazy-load SSR semantics is therefore **by requirement** delegated to routing consumers to `@webspatial/react-sdk`. Accidental SSR of eager primitives is intentionally **not** a contract of this Requirement

#### Scenario: `onSpatialLoadError` registers but never fires

- **WHEN** a consumer calls `onSpatialLoadError(cb)` after importing from the eager entry
- **THEN** the registration MUST succeed and return a valid unsubscribe function
- **AND** the callback MUST never be invoked (eager entry has no dynamic load and therefore no load failure)
- **AND** `WebSpatialBootError` MUST remain importable for type-narrowing convenience but MUST never be thrown by the eager entry's stubs

#### Scenario: Default entry's marginal-delta budget is not affected by eager entry's existence

- **WHEN** the §9.2 marginal-delta CI fixture builds `app-typical` (which imports `{ Model, bootSpatial }` from the **default** entry, not the eager entry)
- **THEN** the measured marginal sync delta MUST hold the same `≤ 8192 bytes` cap as before this Requirement was introduced
- **AND** publishing the eager entry MUST NOT add even one byte to the default entry's published `dist/index.js`
- **AND** the consumer's bundler MUST NOT reach the eager entry's static spatial implementation through any import chain rooted at the default entry

#### Scenario: Migration from default to eager is import-root-only

- **WHEN** an application written against the lazy-load default entry replaces every `from '@webspatial/react-sdk'` (and `from '@webspatial/react-sdk/spatial'` if any) with `from '@webspatial/react-sdk/eager'`
- **THEN** the application MUST type-check, build, and run without any other source change
- **AND** behavior MUST converge to "single-request load, no boot indirection" per the Scenarios above
- **AND** existing `await bootSpatial()` calls MUST become no-ops without breaking control flow

#### Scenario: Mixed-import shape is not supported

- **WHEN** a consumer imports the same symbol name (e.g. `Model`) from both the default entry and the eager entry within the same application bundle
- **THEN** the SDK does NOT guarantee well-defined behavior; the two imports resolve to physically different module instances (facade vs real-impl)
- **AND** development builds SHOULD log a one-shot `console.warn` if the SDK can detect this at runtime (e.g. via a probe that runs at eager-entry module evaluation and inspects the default entry's bridge state)
- **AND** the migration guide MUST document this limitation: consumers MUST pick one entry per application bundle

---

### Requirement: Two distribution forms share packaging hygiene

This change introduces two distribution forms — the lazy-load default entry (`@webspatial/react-sdk`) and the eager-mode entry (`@webspatial/react-sdk/eager`) — that target two different consumer profiles. A subset of this spec's contracts is **product-orthogonal packaging hygiene** that MUST hold for both forms regardless of the consumer's choice. Recognizing this explicitly means future changes that adjust the lazy / eager balance (e.g. removing one form entirely, adding a third form like an SSR-only entry) MUST NOT silently weaken the underlying SDK quality bar.

The packaging-hygiene contracts that apply to both forms are:

- **Tree-shake friendliness** (the entire "Tree-shake friendliness" Requirement): `"sideEffects"` allowlist correctness, no top-level observable side effects in any module reachable from any published entry, named re-export discipline. The SDK's `package.json` `"sideEffects"` field MUST be precise enough that consumer bundlers can tree-shake unreached code from BOTH the default entry's static graph AND the eager entry's static graph.
- **Plugin-free integration** (the entire "Plugin-free integration" Requirement): both forms MUST work without `@webspatial/vite-plugin` or any peer plugin. Both forms MUST be ESM-only. The bundler-capability requirements (ESM, `exports` field, dynamic-import code-splitting) apply to both, though the eager entry does NOT require code-splitting (it has no dynamic `import()` boundary). The peer-dependency contract (`react: ">=18.0"`, `react-dom: ">=18.0"`, both required and not optional) applies to both.
- **Stateless utility APIs and pure re-exports** (the entire "Stateless utility APIs and pure re-exports remain in the default entry" Requirement): both forms MUST expose the same Group B + Group C surface, with the same SSR-safety, side-effect-free, and runtime-graceful-degradation guarantees. The eager entry SHOULD re-export these by reference from the default entry rather than redeclare, to keep the contracts byte-identical.
- **JSX runtime** (the entire "JSX runtime strips spatial markers and wraps with facade HOCs" Requirement): the unified `./jsx-runtime` and `./jsx-dev-runtime` subpaths, plus the internal `./internal/facades-client` boundary they use, MUST work with both consumer entries unchanged. The runtime's strip + facade-HOC-wrap behavior MUST NOT depend on which entry the consumer's `<Model>` / `<div enable-xr>` references resolve to. (In the eager entry the wrapped facade HOC's first client render commits the real implementation directly; in the lazy entry it commits the fallback first.)
- **SSR and hydration safety** (the entire "SSR and hydration safety" Requirement): both forms MUST honor the `'use client'` directive on hook-using façade and hook modules. The **default** entry MUST satisfy the full façade SSR / hydration contracts in that Requirement. The **eager** entry's **spatial primitives** are **CSR-only** (per "**Entry routing (normative)**" and "**CSR-only for spatial primitives**" in the eager Requirement); server-rendering those primitives is **unsupported**, and mismatch remediation is **consumer-owned** (use the default entry or CSR-gate the subtree). Group B / Group C symbols re-exported on both entries MUST remain SSR-safe when invoked on the server, independent of spatial-primitive routing.
- **Type-only re-exports vanish at runtime** (per the corresponding Scenario inside "Stateless utility APIs and pure re-exports remain in the default entry"): both forms MUST emit zero runtime bytes for type-only re-exports.

The contracts that are **specific to the lazy-load default entry** and do NOT apply to the eager entry are:

- The 8 KB marginal-delta budget on `dist/index.js` (per "Default entry MUST NOT bundle spatial implementation") — the eager entry inlines spatial code by design and is **not** subject to a separate product size cap; only the lazy-load default entry is budgeted.
- The dynamic-import boundary, bridge singleton, and `bootSpatial()` activation contract — the eager entry replaces these with compatibility stubs per "Eager-mode entry for spatial-only consumers".
- The facade fallback rendering, hook placeholder values, and dev-mode "boot was forgotten" warning — the eager entry's facades are real implementations from first render, so there is no fallback to render and no warning to issue.
- Full SSR + hydration guarantees for **spatial primitives** (facade fallbacks, `useSpatialReady` server snapshots, first-client-render swap timing) — the eager entry documents spatial UI as **CSR-only**; those guarantees apply only when consumers import primitives from `@webspatial/react-sdk`.

#### Scenario: Hygiene contracts hold for both default and eager entries

- **WHEN** the SDK is published with both `@webspatial/react-sdk` (default entry) and `@webspatial/react-sdk/eager` subpaths
- **THEN** for each of the hygiene contracts enumerated in this Requirement's preamble, an SDK-side test MUST verify that contract for both `dist/index.js` and `dist/eager.js`
- **AND** introducing the eager entry MUST NOT require any change to the contract specifications themselves — only the test suite is extended to assert them against both entries

#### Scenario: Future change adjusting the lazy / eager balance does not weaken hygiene

- **WHEN** a future change proposes to add, remove, or restructure a distribution form (e.g. adding an SSR-only entry, removing the lazy-load entry if product feedback shows it unused, splitting the eager entry by capability)
- **THEN** the change proposal MUST explicitly enumerate which packaging-hygiene contracts from this Requirement's preamble continue to hold and which (if any) need updating
- **AND** removing or weakening any hygiene contract MUST be a separately-justified breaking change with its own CHANGELOG entry, NOT a side effect of the distribution-form restructuring
