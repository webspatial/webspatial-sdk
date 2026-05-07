# Spatial lazy load (WebSpatial React SDK)

## ADDED Requirements

### Requirement: Default entry MUST NOT bundle spatial implementation

The published default entry of `@webspatial/react-sdk` MUST contain only lightweight facades, hook placeholders, the runtime bridge, the boot helper, the JSX runtime web variants, and type-only exports. It MUST NOT contain any spatial implementation modules (containers, monitors, reality, entities, real `Model`, real reality hooks).

#### Scenario: Size budget on default entry

- **WHEN** the published `dist/index.js` is gzipped
- **THEN** the size MUST be at most 8192 bytes (8KB)
- **AND** the budget is enforced by an automated test that fails the build when exceeded

#### Scenario: Spatial-only identifiers are absent from default entry

- **WHEN** the published `dist/index.js` is searched for spatial-only identifier names
- **THEN** none of the following identifiers MUST appear in the file: `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `RealityRoot`, the real-implementation source of `withSpatialMonitor`, the real-implementation source of `withSpatialized2DElementContainer`, real-Model implementation symbols, real reality-hook implementation symbols

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

---

### Requirement: Bridge singleton

The default entry MUST maintain an internal bridge module providing synchronous read (`getSpatialImpl()`), asynchronous load (`loadSpatialImpl()`), readiness check (`isSpatialReady()`), and error registration (`onSpatialLoadError(cb)`). `getSpatialImpl()` and `loadSpatialImpl()` MUST NOT be part of the documented application-facing public API. `isSpatialReady()` and `onSpatialLoadError(cb)` MUST be re-exported as public API alongside `bootSpatial()` (their contracts are specified in the `bootSpatial` requirement).

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

- `isSpatialReady(): boolean` — returns `true` only when the spatial chunk has been loaded successfully and the bridge has stored the implementation reference.
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

#### Scenario: Dev-mode warning when boot is forgotten

- **WHEN** a facade is rendered while `isSpatialReady()` is `false` and `bootSpatial()` has never been called
- **AND** the build is a development build (not production)
- **THEN** the SDK MUST log a one-shot console warning indicating that `bootSpatial()` may not have been awaited
- **AND** the warning MUST NOT be repeated on subsequent renders within the same page

---

### Requirement: Component facades

For every spatial React component or HOC publicly exported by `@webspatial/react-sdk`, the default entry MUST provide a facade with the same TypeScript signature. Facades MUST delegate to the real implementation via the bridge when `isSpatialReady()` is `true`, and MUST render a defined fallback otherwise.

#### Scenario: Facade renders web fallback before boot completes

- **WHEN** a facade is rendered while `isSpatialReady()` is `false`
- **THEN** it MUST render `props.fallback` if provided
- **AND** otherwise it MUST render its component-specific default fallback (documented per component)
- **AND** it MUST NOT trigger any dynamic import

#### Scenario: Facade renders real implementation after boot in spatial runtime

- **WHEN** `bootSpatial()` has resolved in a WebSpatial runtime
- **AND** a facade is then rendered
- **THEN** the facade MUST mount the real implementation from the spatial chunk
- **AND** all props MUST be forwarded to the real implementation unchanged (excluding the `fallback` prop, which is consumed by the facade)

#### Scenario: HOC facade preserves wrapper-cache identity contract

- **WHEN** `withSpatialized2DElementContainer(Comp)` or `withSpatialMonitor(Comp)` is invoked from the default entry with the same `Comp` reference more than once
- **THEN** repeated invocations MUST return the same wrapper component reference
- **AND** the cached wrapper component MUST itself behave as a facade (web fallback before boot, real implementation after boot)

#### Scenario: Mounted facade switches to real implementation when bridge becomes ready

- **WHEN** a facade is mounted with `isSpatialReady() === false`
- **AND** the bridge subsequently becomes ready (e.g. `bootSpatial()` resolves)
- **THEN** the facade MUST re-render and mount the real implementation on the next React commit, without requiring an explicit parent re-render or a `key` change
- **AND** any DOM identity preserved by the React reconciler (e.g. `ref` continuity) MUST be respected by the facade's switch logic

#### Scenario: Reality fallback preserves layout

- **WHEN** the `Reality` facade renders in fallback mode
- **THEN** it MUST render exactly one host placeholder `<div>` that preserves the layout box (className, style, and other layout-affecting props apply to that host)
- **AND** the placeholder MUST NOT participate in keyboard focus
- **AND** the placeholder MUST be excluded from the accessibility tree (`aria-hidden="true"`)
- **AND** the `Reality` facade MUST NOT mount its React children subtree in fallback mode

---

### Requirement: Hook placeholders

For every spatial Hook publicly exported by `@webspatial/react-sdk`, the default entry MUST provide a placeholder that is invoked unconditionally per render and returns a documented stable default value. Real hook implementations MUST be loaded only after `bootSpatial()` resolves and MUST NOT be invoked during the placeholder phase.

A given component instance MUST consistently use either the placeholder hook (web mode) or the real hook (spatial mode) for its entire lifetime. The SDK MUST NOT switch between placeholder and real hook implementations within a single component instance, even if `isSpatialReady()` transitions from `false` to `true` during that instance's lifetime. Switching to the real hook implementation MUST happen only when the component is unmounted and remounted (for example via a `key` change, a parent unmount, or a fresh page load).

#### Scenario: Hook placeholder returns documented default in web mode

- **WHEN** a Hook placeholder is invoked while `isSpatialReady()` is `false`
- **THEN** the placeholder MUST return its documented default value (per-Hook contract)
- **AND** it MUST NOT throw
- **AND** it MUST NOT trigger network requests
- **AND** it MUST NOT subscribe to runtime events

#### Scenario: Real Hook is used only after boot in spatial runtime

- **WHEN** `bootSpatial()` has resolved in a WebSpatial runtime
- **AND** a component that calls the Hook is mounted
- **THEN** the real Hook MUST be invoked

#### Scenario: Hook implementation does not switch mid-life

- **WHEN** a component instance has rendered at least once while `isSpatialReady()` was `false`
- **AND** `isSpatialReady()` later becomes `true`
- **THEN** that component instance MUST continue to invoke the placeholder hook for the remainder of its lifetime
- **AND** to start using the real hook implementation the component MUST be unmounted and remounted

#### Scenario: Remount picks up the real hook implementation

- **WHEN** a component using a spatial hook unmounts after `isSpatialReady()` has become `true`
- **AND** the same component (or a new instance with a different React `key`) mounts again
- **THEN** the new instance MUST invoke the real hook implementation from the spatial chunk

---

### Requirement: JSX runtime web variant strips spatial markers

The web variants of the JSX runtime (`jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts`) MUST remove WebSpatial-only markers from props before delegating to React's JSX runtime. Removal MUST happen for every JSX call site (`jsx`, `jsxs`, `jsxDEV`).

#### Scenario: enable-xr attribute is stripped

- **WHEN** an element is created with the `enable-xr` prop in the web variant
- **THEN** the prop MUST be removed before reaching React
- **AND** the element MUST be created as a plain DOM element with no spatial wrapping

#### Scenario: enable-xr-monitor attribute is stripped

- **WHEN** an element is created with the `enable-xr-monitor` prop in the web variant
- **THEN** the prop MUST be removed before reaching React
- **AND** the element MUST be created as a plain DOM element with no monitor wrapping

#### Scenario: enableXr style key is stripped

- **WHEN** an element is created with `style={{ enableXr: true, ... }}` in the web variant
- **THEN** the `enableXr` key MUST be removed from the style object
- **AND** other style keys MUST pass through unchanged

#### Scenario: __enableXr__ class token is stripped

- **WHEN** an element is created with a `className` containing the `__enableXr__` token in the web variant
- **THEN** the token MUST be removed from the className string
- **AND** other class tokens MUST be preserved with original ordering

#### Scenario: No marker present is a no-op

- **WHEN** an element is created without any of the documented WebSpatial markers
- **THEN** the web JSX runtime MUST forward props to `react/jsx-runtime` without modification

---

### Requirement: SSR and hydration safety

In a server-side rendering context the default entry MUST behave as web mode: facades render fallback, hook placeholders return defaults, no dynamic import is scheduled. After client-side hydration the application MAY call `bootSpatial()` to load the spatial chunk and switch facades to real implementations.

#### Scenario: Server render does not touch spatial chunk

- **WHEN** an application server-renders a tree containing facades or hook placeholders
- **THEN** the spatial chunk MUST NOT be requested
- **AND** all facades MUST render fallback markup

#### Scenario: First client render matches server render

- **WHEN** a tree containing facades is server-rendered and then hydrated on the client
- **AND** the application has not yet awaited `bootSpatial()`
- **THEN** the first client render MUST produce DOM identical to the server render
- **AND** hydration MUST complete without React hydration-mismatch warnings

#### Scenario: Switch to spatial happens after hydration

- **WHEN** an application calls `bootSpatial()` after `ReactDOM.hydrateRoot` has completed
- **THEN** the next render cycle MAY mount real spatial implementations
- **AND** any DOM changes resulting from the switch MUST NOT be attributed to a hydration mismatch

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
