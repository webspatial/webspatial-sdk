# Spatial lazy load (WebSpatial React SDK)

## ADDED Requirements

### Requirement: Default entry MUST NOT bundle spatial implementation

The published default entry of `@webspatial/react-sdk` MUST contain only lightweight facades, hook placeholders, the runtime bridge, the boot helper, the JSX runtime web variants, and type-only exports. It MUST NOT contain any spatial implementation modules (containers, monitors, reality, entities, real `Model`, real reality hooks).

The default entry MUST also contain the **complete** web-mode rendering for every public facade — every per-component default fallback specified in "Component facades" — so that rendering any facade in a non-WebSpatial browser succeeds without loading additional modules over the network.

#### Scenario: Size budget on default entry

- **WHEN** the published `dist/index.js` is gzipped
- **THEN** the size MUST be at most 8192 bytes (8KB)
- **AND** the budget is enforced by an automated test that fails the build when exceeded

#### Scenario: Spatial-only identifiers are absent from default entry

- **WHEN** the published `dist/index.js` is searched for spatial-only identifier names
- **THEN** none of the following identifiers MUST appear in the file (verified to exist in the source as spatial-only exports): `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `PortalSpatializedContainer`, `StandardSpatializedContainer`, `SpatialMonitor`, `ResourceRegistry`, `AttachmentRegistry`, the real-implementation function bodies of `withSpatialized2DElementContainer` / `withSpatialMonitor` (distinct from their facade re-exports), real-`Model` implementation symbols, and real reality-hook implementation symbols (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`)

#### Scenario: Default entry contains complete fallback rendering for every facade

- **WHEN** the published `dist/index.js` is loaded
- **THEN** it MUST contain the rendering logic for every public facade's documented default fallback (Model degraded `<model>` tag, Reality placeholder `<div aria-hidden>`, entity / material / asset `null` rendering, HOC pass-through wrappers, and any other per-component default fallback listed in "Component facades")
- **AND** rendering any facade in a non-WebSpatial browser MUST NOT require any additional module to be loaded over the network

---

### Requirement: Spatial implementation MUST live in a dynamically importable subpath

The package MUST expose `@webspatial/react-sdk/spatial` as the single source of truth for the spatial implementation. The default entry MUST load this module via dynamic `import()` only and MUST NOT statically import it.

#### Scenario: Web runtime never fetches spatial chunk

- **WHEN** an application imports `@webspatial/react-sdk` and runs in a non-WebSpatial browser
- **AND** the application does not call `bootSpatial()`
- **THEN** the spatial chunk MUST NOT be requested over the network
- **AND** facades and hook placeholders MUST continue to render web fallbacks without scheduling any dynamic import

#### Scenario: Spatial runtime loads spatial chunk at most once

- **WHEN** an application runs in a WebSpatial runtime and `bootSpatial()` is awaited one or more times
- **THEN** the spatial chunk MUST be requested exactly once for the page lifetime
- **AND** subsequent `bootSpatial()` calls MUST return the cached resolution result

#### Scenario: Plain web users see final rendering at first render

- **WHEN** an application is loaded in a non-WebSpatial browser (`detectSpatialRuntime() === null`)
- **AND** `bootSpatial()` has been awaited per the recommended pattern (or has been omitted entirely)
- **THEN** the first render of every facade MUST produce its documented per-component default fallback — which IS the user's final intended display in this environment
- **AND** no further re-render to switch implementations MUST occur for the page lifetime
- **AND** the spatial chunk MUST NOT be fetched, parsed, or evaluated

---

### Requirement: Bridge singleton

The default entry MUST maintain an internal bridge module providing synchronous read (`getSpatialImpl()`), asynchronous load (`loadSpatialImpl()`), readiness check (`isSpatialReady()`), readiness subscription primitives, and error registration (`onSpatialLoadError(cb)`). `getSpatialImpl()`, `loadSpatialImpl()`, and the raw subscription primitives MUST NOT be part of the documented application-facing public API. `isSpatialReady()`, `useSpatialReady()`, and `onSpatialLoadError(cb)` MUST be re-exported as public API alongside `bootSpatial()` (their contracts are specified in the `bootSpatial` requirement).

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
- **THEN** `loadSpatialImpl()` MUST reject with the underlying error
- **AND** the registered `onSpatialLoadError(cb)` callback (if any) MUST be invoked exactly once with that error
- **AND** `isSpatialReady()` MUST remain `false`
- **AND** facades MUST continue to render fallback content without throwing

---

### Requirement: `bootSpatial` is the only activation path

`bootSpatial()` MUST be the single API that triggers loading of the spatial chunk. Facades and hook placeholders MUST NOT initiate `import('@webspatial/react-sdk/spatial')` on their own. The function MUST have signature `bootSpatial(): Promise<void>`.

`bootSpatial()` is idempotent within a single load attempt: concurrent in-flight calls MUST share one promise; after a successful resolution all subsequent calls MUST return an already-resolved promise without scheduling additional work. After a rejection, callers MAY invoke `bootSpatial()` again to retry, in which case the bridge MUST attempt a fresh dynamic `import()` provided no other retry is currently in flight.

The default entry MUST also export:

- `isSpatialReady(): boolean` — synchronous read; returns `true` only when the spatial chunk has been loaded successfully and the bridge has stored the implementation reference.
- `useSpatialReady(): boolean` — a React hook returning the current readiness, subscribed via `useSyncExternalStore` so consuming components automatically re-render when the bridge becomes ready. Implementations MUST short-circuit the subscription work when `detectSpatialRuntime() === null` so that non-WebSpatial browsers pay no per-render bookkeeping cost. Safe to call during SSR (returns `false`).
- `onSpatialLoadError(cb: (err: WebSpatialBootError) => void): () => void` — registers a callback invoked on every failed load attempt. Multiple callbacks MAY be registered concurrently; the returned function unsubscribes the corresponding callback. Callbacks MUST be invoked in registration order. Successful retries after a prior failure MUST NOT replay earlier errors to listeners.
- `WebSpatialBootError` — an `Error` subclass used as the rejection value of `bootSpatial()` and the argument to `onSpatialLoadError` callbacks. Instances MUST satisfy `name === 'WebSpatialBootError'`, MUST set `cause` to the original error thrown by the dynamic `import()`, and MUST expose `attempt: number` (1-based) indicating which retry the failure corresponds to.

Recommended integration pattern (non-normative): applications SHOULD `await bootSpatial()` before invoking `ReactDOM.createRoot(...).render(...)` so that facades and hook placeholders never render in spatial runtimes. Calling `bootSpatial()` later is permitted; mounted facades will switch to the real implementation on the next React commit (see "Component facades"), but components that called spatial hook placeholders during their prior renders MUST remount to pick up the real hook implementations (see "Hook placeholders").

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

For every spatial React component or HOC publicly exported by `@webspatial/react-sdk`, the default entry MUST provide a facade with the same TypeScript signature. Facades MUST delegate to the real implementation via the bridge when `isSpatialReady()` is `true`, and MUST render the documented per-component default fallback otherwise.

Facades MUST NOT accept a generic `fallback` prop in v1; per-component default fallbacks are fixed by this Requirement and customization is the application's responsibility (using `useSpatialReady()` to write a wrapper component is the recommended pattern).

Facade implementations MUST be self-contained within the default entry: they MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`, MUST NOT call into runtime APIs that exist only in the spatial chunk, and MUST NOT instantiate `@webspatial/core-sdk` runtime classes during fallback rendering. The complete web-mode rendering for every facade MUST be reachable purely through the default entry's static module graph.

Facade `displayName` MUST match the public component name (`Model`, `Reality`, `BoxEntity`, etc.). HOC wrapper facades MUST follow the existing `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` naming convention. Facades MUST NOT be wrapped in `React.memo` (props-identity comparison semantics are the real implementation's choice; the facade does not impose memoization).

#### Per-component default fallback

| Public name | Default fallback rendering in the default entry |
| --- | --- |
| `Model` | Strip spatial-only event props (`onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`) and the `spatialEventOptions` prop, then render `<model ref={ref} {...remainingProps} />`, preserving today's degraded behavior in plain browsers |
| `Reality` | A single `<div aria-hidden="true" ref={ref}>` placeholder that preserves the layout box (className, style, and other layout-affecting props apply to the host); the React children subtree MUST NOT mount |
| `BoxEntity` / `Box`, `SphereEntity` / `Sphere`, `ConeEntity` / `Cone`, `CylinderEntity` / `Cylinder`, `PlaneEntity` / `Plane`, `ModelEntity`, `AttachmentEntity` | `null` |
| `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset` | `null` |
| `SceneGraph` / `World` | `<>{children}</>` (transparent container in fallback mode) |
| `withSpatialized2DElementContainer(Comp)` (HOC wrapper) | `<Comp {...passthroughProps} ref={ref} />` (strip spatial-event props, otherwise transparent) |
| `withSpatialMonitor(El)` (HOC wrapper) | `<El {...passthroughProps} ref={ref} />` (transparent) |

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

- **WHEN** `withSpatialized2DElementContainer(Comp)` or `withSpatialMonitor(Comp)` is invoked from the default entry with the same `Comp` reference more than once
- **THEN** repeated invocations MUST return the same wrapper component reference
- **AND** the cache key MUST be the raw `Comp` reference; structurally equivalent but distinct references MUST yield distinct wrappers
- **AND** the cached wrapper component MUST itself behave as a facade (web fallback before boot, real implementation after boot)

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
- **AND** HOC wrapper facades produced by `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(Comp)` MUST follow the existing `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` naming convention

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

2. **Wrap** the element type with the corresponding **facade HOC** from the default entry when a marker is present:
   - `enable-xr` / `style.enableXr` / `__enableXr__` → `withSpatialized2DElementContainer(type)`
   - `enable-xr-monitor` → `withSpatialMonitor(type)`

   The facade HOCs (defined by "Component facades") decide at render time whether to render the per-component fallback (web) or the real spatialized container (spatial runtime). The JSX runtime MUST NOT statically or dynamically import from `@webspatial/react-sdk/spatial`; it relies entirely on the facade indirection for spatial behavior.

3. When `type === Model` (the public `Model` facade), the JSX runtime MUST NOT wrap or strip — `Model` handles its own runtime branching internally. This preserves today's AVP behavior.

**Mutation policy**: the top-level `props` object passed to a JSX call is created fresh per render by React's JSX transform and MAY be mutated in place (delete attribute keys, reassign `className`). However, `props.style` MAY be a user-memoized object shared across renders or with sibling consumers. When the `enableXr` key is present in `props.style`, the runtime MUST produce a new style object that omits the `enableXr` key (e.g. via shallow spread / object-rest destructuring) and reassign `props.style` to that new object; the runtime MUST NOT mutate the original `props.style` reference. This protects against (a) corrupting a memoized style object across renders, (b) mutating an `Object.freeze`d style object (which would throw in strict mode), and (c) cross-component aliasing of a shared style constant.

**Marker source**: only `props.className` is recognized as a class-name source. The HTML-style `props.class` (rare in React) MUST NOT be recognized as a marker source in v1.

#### Scenario: enable-xr triggers facade wrap and prop is stripped

- **WHEN** an element is created with the `enable-xr` prop
- **THEN** the prop MUST be removed from props before delegating to React
- **AND** the element type passed to React MUST be `withSpatialized2DElementContainer(type)` (the facade HOC version)

#### Scenario: enable-xr-monitor triggers monitor facade wrap and prop is stripped

- **WHEN** an element is created with the `enable-xr-monitor` prop
- **THEN** the prop MUST be removed from props before delegating to React
- **AND** the element type passed to React MUST be `withSpatialMonitor(type)` (the facade HOC version)

#### Scenario: enableXr style key triggers wrap and is stripped without mutating the user style object

- **WHEN** an element is created with `style={someStyleRef}` where `someStyleRef` contains an `enableXr` key
- **THEN** the runtime MUST produce a new style object (e.g. via shallow spread / object-rest destructuring) that omits the `enableXr` key, and MUST reassign `props.style` to that new object
- **AND** the new style object MUST NOT contain the `enableXr` key
- **AND** the original `someStyleRef` MUST be unchanged after the JSX call (no `enableXr` deletion, no key reorder); this MUST hold even when `someStyleRef` is `Object.freeze`d
- **AND** the element type passed to React MUST be `withSpatialized2DElementContainer(type)`

#### Scenario: __enableXr__ class token triggers wrap and is stripped from className

- **WHEN** an element is created with a `className` string containing the `__enableXr__` token (whitespace-delimited)
- **THEN** the token MUST be removed from the className string before delegating to React
- **AND** the remaining class tokens MUST preserve original ordering and whitespace handling
- **AND** the element type passed to React MUST be `withSpatialized2DElementContainer(type)`

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

#### Scenario: SSR strips and wraps identically to client-side rendering

- **WHEN** the JSX runtime is invoked during server-side rendering (e.g. `renderToString`, `renderToPipeableStream`, RSC)
- **THEN** the same strip + wrap rules MUST apply
- **AND** the resulting server-rendered HTML MUST NOT contain the `enable-xr` attribute, the `enable-xr-monitor` attribute, the `enableXr` style key, or the `__enableXr__` class token
- **AND** subsequent client-side hydration MUST NOT report a hydration mismatch caused by these markers
- **AND** because `useSpatialReady()` returns `false` during SSR (per "Bridge singleton"), the wrapped facade HOC MUST render its documented fallback during SSR — not the real spatialized container

---

### Requirement: SSR and hydration safety

In a server-side rendering context the default entry MUST behave as web mode: facades render their per-component default fallback, hook placeholders return their documented defaults, the bridge MUST NOT schedule any dynamic import, and registered `onSpatialLoadError` callbacks MUST NOT be invoked. The default entry MUST work under any React 18+ SSR API (including `renderToString`, `renderToPipeableStream`, `renderToReadableStream`, and React 19 `prerender*`) and inside React Server Components when the facade or hook is consumed via a Client Component.

To make hydration safe, the SDK MUST follow these constraints:

- **Client-component directive**: every facade module and every public hook module that calls React hooks MUST begin with the `'use client'` directive. The directive MUST be preserved through the build into the published `dist/` files. Without this directive, the React Server Components compiler will treat facades as Server Components and fail the moment they call hooks. Files that do not call React hooks (`runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `runtime/errors.ts`, the constant-only `useMetrics` placeholder source, plain type-only modules) MUST NOT carry the directive — they remain server-callable.
- **Hydration-aware readiness**: `useSpatialReady()` MUST be implemented with `useSyncExternalStore` (or another React-hydration-aware primitive that exposes a server snapshot). This guarantees that the value used during hydration matches the SSR snapshot, and React's built-in transition swaps to the live snapshot only after hydration commits — preventing any mismatch warning regardless of when `bootSpatial()` resolves relative to `hydrateRoot()`.
- **`getServerSnapshot` stability**: the `getServerSnapshot` argument passed to `useSyncExternalStore` inside `useSpatialReady` MUST be a single module-level constant function returning `false`. It MUST NOT be a fresh closure created per call (which would trigger React's "Snapshot is unstable" warning). The same module-level constant MAY also serve as the plain-web `getSnapshot` (per the `useSpatialReady` short-circuit) since both must report `false`.
- **Deterministic facade rendering**: given identical props, a facade's fallback rendering MUST produce identical DOM across renders and across server/client. The SDK only guarantees mismatch-free hydration when (a) facade props are identical between server and client, and (b) `useSpatialReady` follows the `useSyncExternalStore` constraint above.

Both `await bootSpatial(); hydrateRoot(...)` (boot before hydrate; bridge ready when hydrate starts) and `hydrateRoot(...); bootSpatial()` (hydrate first, boot after) MUST be supported. The `useSyncExternalStore`-based `useSpatialReady` makes both timings hydration-safe; applications choose based on UX preference (boot-before avoids a fallback-to-real DOM swap; boot-after gets faster initial hydrate).

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

#### Scenario: Standalone Vite project

- **WHEN** a Vite + React project depends only on `@webspatial/react-sdk` (no `@webspatial/vite-plugin`)
- **THEN** the build MUST succeed
- **AND** the size budget and lazy-load contracts in this spec MUST hold

#### Scenario: Removed legacy subpaths

- **WHEN** an application or build plugin attempts to import `@webspatial/react-sdk/web` or `@webspatial/react-sdk/default`
- **THEN** module resolution MUST fail (the subpaths are removed in this version)
- **AND** the package CHANGELOG MUST mark the removal as a breaking change with a documented migration path
