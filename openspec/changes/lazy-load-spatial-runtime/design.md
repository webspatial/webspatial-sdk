## Context

Today `@webspatial/react-sdk` ships two near-identical bundles (`dist/web` ≈ `dist/default` ≈ 124KB) and relies on a separate `@webspatial/vite-plugin` (in repo `webspatial/web-builder-plugins`) to alias `@webspatial/react-sdk` to one of those subpaths based on `XR_ENV`. The intended outcome — "web users do not pay for spatial code" — does not actually hold today: only `initScene` and the JSX runtime have `.web.ts` placeholders, while every heavyweight spatial module (containers, monitors, reality, entities, real `Model`, reality hooks) still ends up in the web bundle.

Two parallel `XR_ENV` injection mechanisms (tsup banner writes `window.__webspatialsdk__.XR_ENV`; the plugin defines `window.XR_ENV`) further muddy runtime detection. None of the in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) actually use the plugin — they all alias `@webspatial/react-sdk` straight to source — so the dual-build contract has no end-to-end coverage in this repo.

Product positioning is now explicitly **web-first, spatial as enhancement**: most page loads are in regular browsers; only WebSpatial-runtime sessions need the spatial implementation. A simpler, web-first-aligned architecture is to **defer spatial code from build time to run time**: keep one tiny default bundle, dynamically `import()` the spatial implementation only inside a WebSpatial runtime, and gate that load on a single explicit `bootSpatial()` call.

## Goals / Non-Goals

**Goals:**

- Keep the cost of adding `@webspatial/react-sdk` to a typical web application small enough to be a non-issue for web users: target ≤ 8 KB gzipped marginal bundle delta on the consumer's bundle for the recommended named-import pattern (e.g. `import { Model, bootSpatial }`), with `dist/index.js` gzip ≤ 8 KB enforced as the SDK-side proxy. Both contracts are asserted by automated tests (proxy in the SDK's own test suite; marginal-delta in a Vite fixture). Worst-case namespace / full-barrel imports MAY exceed 8 KB and are explicitly informational.
- Preserve application-level import ergonomics for documented public React APIs: `import { Model, Reality, Entity, BoxEntity } from '@webspatial/react-sdk'` continues to work from the default entry, while internal reality hooks such as `useEntity` remain unavailable from the public root.
- Provide an additive `@webspatial/react-sdk/eager` entry for spatial-only consumers. It exposes the same TypeScript surface as the default entry, but statically links the spatial implementation, preloads the bridge, and turns the lazy-load runtime API into compatibility stubs so callers can migrate by changing only the import root.
- Spatial implementations are loaded over the network **only** in a WebSpatial runtime and **only** via `bootSpatial()`; after the first successful load, the spatial chunk is cached for the remainder of the page lifetime, while failed loads may be retried on demand.
- Hooks in the default entry are safe to call unconditionally and return documented stable defaults in web mode (no Rules-of-Hooks violations).
- The unified JSX runtime strips `enable-xr` / `enable-xr-monitor` / `style.enableXr` / `__enableXr__` className token AND wraps the element type with the corresponding facade HOC, eliminating "unknown attribute" warnings in plain browsers and preserving today's AVP-side `<div enable-xr/>` → spatial-container behavior.
- The package works correctly **without** any build plugin; `@webspatial/vite-plugin` is no longer a required dependency.

**Non-Goals:**

- Splitting the spatial chunk further (e.g. reality / container / model into separate sub-chunks). Land one spatial chunk first; revisit after measuring real-world load profiles.
- Server-side or RSC-time spatial implementations. SSR always renders web fallbacks; the bridge stays inert until client-side hydration completes and `bootSpatial()` is awaited.
- Introducing `<SpatialBoundary>` / Suspense-style integration in this change. `bootSpatial()` is the single supported activation path; a Suspense path can be added in a future change without breaking current callers.
- Migrating in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) to consume `dist` + `bootSpatial()`. Tracked as a follow-up. Their current alias-to-source workflow continues to work because the new `src/index.ts` is the lean entry.
- Rewriting or restructuring `@webspatial/core-sdk`. React SDK's default and server source imports `@webspatial/core-sdk/runtime` for the shared runtime-capability helper, and the build inlines that helper so emitted default/server JavaScript does not retain a runtime `@webspatial/core-sdk` import. Core-sdk main-entry runtime code is still reached only by the spatial/eager implementation graph. `noRuntime.ts` becomes unused by react-sdk after this change but is left in place; cleanup is out of scope.
- Removing or rewriting `@webspatial/vite-plugin`. The plugin lives in another repo; we only document the recommendation that users uninstall it.

## Decisions

### 1. Package structure and entry layout

- `@webspatial/react-sdk` `'.'` (default entry) contains only:
  - `runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `runtime/useSpatialReady.ts`, plus the `WebSpatialBootError` class (co-located with bridge or in `runtime/errors.ts`)
  - `facades/*.tsx` — facade React components for every public spatial component, plus internal HOC wrapper factories used by the SDK's JSX runtime (`withSpatialized2DElementContainer`, `withSpatialMonitor`). The HOC factories are not public default-entry API after the `internalize-hoc-factories` change; the documented consumer mechanism is the `enable-xr` / `enable-xr-monitor` JSX markers.
  - `hooks-web/useMetrics-placeholder.ts` — placeholder constants module (no React hooks, no `'use client'` directive); `hooks-web/useMetrics.ts` — the public `useMetrics` hook (begins with `'use client'`, picks placeholder vs real once per instance per decision 5). Future public hooks add their own pair of files here following the same split convention.
  - JSX runtime: unified `jsx-runtime.ts` / `jsx-dev-runtime.ts` (with marker stripping AND facade-HOC wrapping; see decision 6)
  - Type-only exports (props, refs, event types)
- `@webspatial/react-sdk/spatial` is a new bridge-facing subpath whose module is the single source of truth for the real spatial implementation that facades resolve by name: real `Model`, `Reality`, `Entity`, all public `*Entity` components, materials/assets, `SceneGraph` / `World`, real `withSpatialMonitor`, real `withSpatialized2DElementContainer`, and real `useMetrics`. The real HOC factories remain exported from this bridge-facing namespace for SDK-internal JSX-runtime use, but they are not re-exported from the default or eager public roots. Internal container constructors (`SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`) and internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useRealityEvents`, `useEntityId`, `useForceUpdate`) live inside the spatial chunk's module graph but are not part of the public default entry; the spatial subpath should export them only if a bridge-facing facade directly needs that symbol.
- `@webspatial/react-sdk/eager` is an additive single-request entry for spatial-only consumers. It statically imports `./spatial`, calls the bridge's internal preload hook (`__internalSetSpatialImpl`) at module evaluation time, re-exports real spatial primitives from `./spatial`, re-exports stateless utilities from the same source modules used by `./index` plus type-only surface from `./index`, and exposes no-op readiness / boot compatibility stubs. This keeps behavior aligned without pulling the default-entry facade chunk into the eager static closure.
- The `./web` and `./default` subpaths are **hard removed** from `package.json` `exports`. Old plugin configurations that alias to those paths will fail to resolve and surface the upgrade requirement loudly.

**Why hard-cut instead of a transition window**: a transition window keeps two import shapes valid, prolongs the maintenance tax, and lets old plugin configurations silently bypass the lazy-load contract. The breaking change is small (two import strings) and discoverable at build time, so a clean cut is cheaper overall.

### 2. Bridge singleton

- Module-level singleton in `runtime/bridge.ts`:

  ```ts
  type SpatialNS = typeof import('../spatial')
  let spatialImpl: SpatialNS | null = null
  let loadingPromise: Promise<SpatialNS | null> | null = null
  let lastError: WebSpatialBootError | null = null
  let attemptCount = 0
  const errorListeners = new Set<(err: WebSpatialBootError) => void>()
  // Subscribe-style readiness store, consumed by facades via useSyncExternalStore
  const readinessSubscribers = new Set<() => void>()
  ```

- Internal API (not part of the application-facing public API):
  - `getSpatialImpl(): SpatialNS | null` — synchronous read.
  - `loadSpatialImpl(): Promise<SpatialNS | null>` — performs the dynamic import in a WebSpatial runtime, resolves to `null` in web/SSR mode. Idempotent within a single attempt; after a rejection the next call may initiate a fresh attempt provided no other retry is in flight.
- Public API re-exported from the default entry (contracts pinned in the `bootSpatial` and `SSR and hydration safety` Requirements):
  - `isSpatialReady(): boolean` — synchronous read.
  - `useSpatialReady(): boolean` — React hook backed by `useSyncExternalStore`; consuming components automatically re-render on `false → true` transitions. In non-WebSpatial browsers (`detectSpatialRuntime() === null`), the hook short-circuits to a no-op subscriber and a constant `false` snapshot, so plain web users pay no per-render bookkeeping cost. SSR-safe: `useSyncExternalStore`'s `getServerSnapshot` argument is a module-level constant function returning `false`, which (per "SSR and hydration safety") makes hydration safe for both `await bootSpatial(); hydrateRoot()` and `hydrateRoot(); bootSpatial()` integration patterns.
  - `onSpatialLoadError(cb): () => void` — multi-listener; returns an unsubscribe function. Listeners are stored in a `Set` and notified in registration order. MUST NOT be invoked during SSR (no load attempts happen there).
  - `WebSpatialBootError` — `Error` subclass carrying `cause` (the underlying `import()` error) and `attempt` (1-based count). Stored on `lastError` after each failed attempt. The wrapping is performed inside `loadSpatialImpl()` *before* the rejection bubbles up to `bootSpatial()` or to error listeners, so all observable failure paths surface a `WebSpatialBootError` (never the raw `import()` error).
- Facades and user-side wrappers BOTH subscribe to readiness via the same `useSpatialReady()` hook. Subscription bookkeeping is tracked in the bridge's `readinessSubscribers` Set; the bridge notifies all subscribers on `false → true` transitions and (rarely) on `true → false` if a future feature ever resets readiness — v1 only flips once.
- Internal-only symbols (`getSpatialImpl`, `loadSpatialImpl`, raw subscribe primitives) MUST be prefixed (e.g. `__internalGetSpatialImpl`) when re-exported from the package, so external consumers cannot accidentally depend on them.
- The bridge module itself does **not** import React. The `useSyncExternalStore` integration lives in a separate `useSpatialReady` module — keeping the bridge independently testable and SSR-safe.

### 3. Boot helper as the single activation path

- `bootSpatial(): Promise<void>` exported from the default entry.
- In a WebSpatial runtime: call `loadSpatialImpl()`, `await` resolution, return.
- In a non-WebSpatial runtime (`detectSpatialRuntime() === null`) or SSR (`typeof window === 'undefined'`): return immediately without scheduling any network request.
- **Idempotency within an attempt**: concurrent in-flight calls share one promise; after a successful resolution all subsequent calls return an already-resolved promise without scheduling additional work.
- **Retry-on-demand after failure**: after a rejection, the next `bootSpatial()` invocation MAY initiate a fresh `import()` attempt provided no other retry is currently in flight. The bridge increments `attemptCount` on each fresh attempt; the resulting `WebSpatialBootError` carries that 1-based number.
- **Error wrapping**: rejections are always thrown as `WebSpatialBootError` instances with `name === 'WebSpatialBootError'`, `cause` set to the original `import()` error, and `attempt: number`. This gives error reporters and ErrorBoundary code a stable type to filter on.
- **Multi-listener error reporting**: `onSpatialLoadError(cb): () => void` accepts any number of callbacks; returns an unsubscribe. All listeners are notified in registration order on each failure. Successful retries do not replay earlier errors.
- **No SDK timeout (v1)**: the bridge does not race `import()` against a wall-clock timer. Applications that need a timeout can wrap `bootSpatial()` in their own `Promise.race`. We can revisit if real-world deployments report hung-import scenarios.
- **Console warning**: if a facade is rendered while `isSpatialReady() === false` and `bootSpatial()` has never been called, log a one-shot dev-mode warning **only** when `detectSpatialRuntime() !== null`. In a non-WebSpatial browser the rendered fallback IS the user's final intended display, so the warning would be noise. Silenced in production builds across all environments.

**Why one path, not two**: introducing `<SpatialBoundary>`/Suspense in the same change doubles the activation contract and complicates the hook story. With `bootSpatial()` as the single front door, the application is responsible for awaiting it before render in the recommended path. Late boot is still supported (facades subscribe to bridge readiness — see decision 4), but hooks deliberately do not switch mid-life: the placeholder a component first sees is the implementation it sees forever, switching only on remount. This eliminates Rules-of-Hooks risk without forcing placeholders to mimic real-hook call sequences.

### 4. Facade pattern for components and internal HOC wrappers

- For every public spatial React component, the default entry exports a facade with the same TypeScript signature. Facades **do not** accept a generic `fallback` prop in v1 — per-component default fallbacks are fixed (see the per-component table in the spec); customization is the application's responsibility via `useSpatialReady()` wrappers.
- Facades subscribe to bridge readiness through the public `useSpatialReady()` hook, so a `false → true` transition automatically re-renders mounted facades to the real implementation:

  ```tsx
  // Public hook (re-exported from default entry)
  export function useSpatialReady(): boolean {
    // Decided once per instance; non-WebSpatial branches use no-op subscribe
    // + always-false snapshot, so plain web users pay no bookkeeping cost.
    const [isWebOnly] = useState(() => detectSpatialRuntime() === null)
    return useSyncExternalStore(
      isWebOnly ? noopSubscribe : __internalSubscribeReadiness,
      isWebOnly ? alwaysFalse : isSpatialReady,
      alwaysFalse,
    )
  }

  // Facade
  export function Model(props: ModelProps) {
    const ready = useSpatialReady()
    if (!ready) return renderModelFallback(props)        // <model ...>
    return <getSpatialImpl()!.Model {...props} />
  }
  ```

  - `__internalSubscribeReadiness(cb)` adds `cb` to the bridge's `readinessSubscribers` Set and returns the unsubscribe.
  - `alwaysFalse` is a module-level constant returning `false`, doubling as both the SSR snapshot and the plain-web snapshot.
- **Self-containment**: facade modules MUST NOT import (statically or dynamically) from `src/spatial/`, MUST NOT call `new Spatial()` / `new SpatialScene()` / similar core-sdk runtime constructors, and MUST NOT use any value that only resolves at runtime in the spatial chunk. The complete fallback rendering for every facade lives in the default entry's static module graph; this is asserted by an automated audit (see tasks).
- **`'use client'` directive**: every facade module file MUST begin with `'use client'`. Facades use `useSpatialReady` (a hook) and therefore cannot be Server Components in RSC; the directive marks them as Client Component references. tsup / esbuild preserve top-level string directives in their output by default; the build verification (§13) MUST assert the directive remains in the published `dist/` files for every facade.
- **Plain web fast path**: the `useSpatialReady` short-circuit means non-WebSpatial browsers never register a subscription with the bridge and never observe a readiness flip — they take a deterministic, single-render path to the documented fallback.
- Internal HOC wrappers (`withSpatialized2DElementContainer`, `withSpatialMonitor`) return facade components that delegate to the real HOC's output via the bridge. They exist for the SDK's JSX-runtime marker path only; they are no longer documented public factories. Wrapper-cache contract (same `Comp` → same wrapper reference) is preserved by caching the facade wrapper using the raw `Comp` reference as the key; the real HOC's own cache lives inside the spatial chunk.
- Per-component default fallback (full table is normative in the spec; summary here):
  - `Model` → `<model ref {...modelProps}>` (degraded HTML element; spatial-only event props stripped) — preserves today's plain-browser behavior.
  - `Reality` → single `<div aria-hidden="true">` placeholder; children NOT mounted (matches `runtime-capabilities` Reality fallback contract).
  - `*Entity`, `Material*`, `Texture`, `*Asset` → `null`.
  - `SceneGraph` / `World` → `null` (children NOT mounted; typical trees are under `<Reality>`, whose fallback already suppresses the child subtree).
  - Internal HOC-wrapped components (JSX runtime only) → `<Comp/El {...passthrough} ref/>` (transparent passthrough).
- **Facade conventions**: `displayName` matches the public name (`Model`, `Reality`, `BoxEntity`); internal HOC wrapper facades follow the existing `WithSpatialMonitor(<inner>)` / `WithSpatialized2DElementContainer(<inner>)` naming. Facades are NOT wrapped in `React.memo`. In fallback paths that render `null` or a Fragment, forwarded `ref.current` is `null` (React-natural).
- Facades MUST NOT use the readiness subscription to swap hook implementations — only the rendered component subtree. Hooks (decision 5) explicitly do not switch mid-life.

### 5. Hook placeholder protocol

**Public hook surface**: the only spatial hook publicly exported from the default entry today is `useMetrics`. The reality-side hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) are **internal** — `packages/react/src/reality/index.tsx` does not re-export them, and a sweep of the in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) confirms no caller imports them directly. They are consumed only by spatial components (`Reality`, `*Entity`, `Model`).

Therefore:

- The `useEntity*` / `useRealityEvents` / `useForceUpdate` family ships **inside the spatial chunk** alongside the components that consume them. They have no placeholder and are not reachable from the default entry.
- Only `useMetrics` needs a placeholder.

**`useMetrics` placeholder design**:

- The placeholder constants (the `pointToPhysical` / `physicalToPoint` functions returning fixed-ratio values) live in a hooks-free module (e.g. `packages/react/src/hooks-web/useMetrics-placeholder.ts`). It is a plain function that returns a frozen module-level singleton `{ pointToPhysical, physicalToPoint }`:
  - `pointToPhysical(pt) => pt / 1360`
  - `physicalToPoint(m) => m * 1360`
- The `1/1360` ratio matches today's `noRuntime.ts` web fallback (`packages/react/src/noRuntime.ts`) so consumers see no behavior change on upgrade.
- Both function identities are stable for the lifetime of the page across all renders and across `bootSpatial()` calls. Consumers using these in `useEffect` dependency arrays do not get re-runs.
- The **public** `useMetrics` exported from the default entry is a thin React hook that uses a `useState` initializer to pick "placeholder" vs "real" once per component instance (per the "no mid-life switch" rule); this hook lives in its own file (e.g. `packages/react/src/hooks-web/useMetrics.ts`) which begins with `'use client'`. The placeholder constants module does NOT carry the directive (it has no hooks) and remains server-callable.
- SSR-safe: the placeholder constant module does not touch `window`. The public hook file uses `useState` and is therefore a Client Component in RSC; under SSR `useState` is supported by React and `isSpatialReady()` returns `false`, so the placeholder branch is selected and used identically across server and client.

**No mid-life switch**: a component instance that first invoked a placeholder hook MUST keep invoking the placeholder for its entire lifetime, even if `isSpatialReady()` flips to `true`. The real hook implementation is picked up only when the component unmounts and remounts (e.g. via a `key` change, parent unmount, or page reload). This contract is what allows placeholders and real hooks to differ in their internal React Hook call sequences without violating the Rules of Hooks.

**Implementation strategy** (non-normative, reflecting decision 4's facade subscription model):

```tsx
// packages/react/src/hooks-web/useMetrics.ts (the public default-entry hook)
'use client'

import { useState } from 'react'
import { useMetricsPlaceholder } from './useMetrics-placeholder'
import { getSpatialImpl, isSpatialReady } from '../runtime/bridge'

export function useMetrics(): ReturnType<typeof useMetricsPlaceholder> {
  // Decided once at first render of the component instance; never flips mid-life.
  const [impl] = useState(() =>
    isSpatialReady() ? getSpatialImpl()!.useMetrics : useMetricsPlaceholder,
  )
  return impl()
}
```

The default entry's `src/index.ts` re-exports this `useMetrics` as-is; it does not re-implement the selector logic.

If `bootSpatial()` is not awaited (misuse): `useMetrics` remains in placeholder mode for the entire page lifetime — consistent web-fallback behavior, no runtime crash. Facades will still flip (decision 4), but `useMetrics` inside any already-mounted component keeps returning the placeholder values until that component remounts.

**Future hooks**: if a future SDK version adds a new publicly exported spatial hook, the spec table in "Requirement: Hook placeholders" MUST be updated and a corresponding placeholder + tests landed in the same change.

### 6. JSX runtime: single unified runtime that strips and wraps with facade HOCs

**Today's split**: there are two JSX runtime files. `jsx-runtime.ts` (delegated to `jsx-shared.ts`) strips markers AND wraps with the **real** HOCs (`withSpatialized2DElementContainer` / `withSpatialMonitor`). `jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` simply re-export `react/jsx-runtime` and do nothing — leaking markers to the DOM in plain browsers (today's silent bug, primarily affecting RSC users via the `react-server` exports condition).

**After this change**: a **single** unified runtime serves all environments. The previously split `*.web.ts` files are deleted.

- The unified runtime lives at `packages/react/src/jsx/jsx-runtime.ts` and `jsx-dev-runtime.ts` (or its current shared module `jsx-shared.ts`). It performs strip + wrap in the same pass; the HOC targets become the **facade** versions (already exported from the default entry by "Component facades"). The facade chooses between web fallback and real spatial container at render time via the bridge — so the JSX runtime no longer needs an environment-aware variant.
- The RSC-compatible implementation obtains those facade HOCs through `@webspatial/react-sdk/internal/facades-client`, a small internal subpath that begins with `'use client'`. `jsx-runtime.js` itself remains server-callable. In a React Server Components server bundle the imported facades may resolve to Client References instead of callable functions; in that specific environment the runtime MUST strip markers but MUST NOT call the Client References. The resulting strip-only server output is valid because the internal HOC fallback is transparent and therefore produces the same DOM that the wrapped client fallback would hydrate.
- Markers and corresponding wraps:
  1. `enable-xr` prop → strip + wrap with `withSpatialized2DElementContainer(type)` facade
  2. `enable-xr-monitor` prop → strip + wrap with `withSpatialMonitor(type)` facade
  3. `enableXr` key inside `props.style` → strip + wrap with `withSpatialized2DElementContainer(type)` facade
  4. `__enableXr__` token inside `props.className` → strip + wrap with `withSpatialized2DElementContainer(type)` facade
- **`Model` bypass**: `if (type === Model) return type;` — `Model` handles its own runtime branching internally; matches today's AVP-side behavior in `jsx-shared.ts`.
- **Mutation policy**:
  - The top-level `props` object is fresh per render (created by React's JSX transform); deleting attribute keys (e.g. `enable-xr`) and reassigning `props.className` is safe.
  - **`props.style` MUST be cloned (shallow spread) before deleting `enableXr`**. Today's `jsx-shared.ts` mutates `props.style` directly, which corrupts user-memoized style objects (a real, latent bug) and would throw when the user has `Object.freeze`d the style. This change clones first.
- **Marker source**: only `props.className` is recognized. `props.class` (HTML-style alternative) is intentionally not recognized in v1 — kept consistent with current AVP behavior.
- **SSR**: the runtime contains no `window` access; strip rules work the same on server and client. Wrapping runs whenever the internal facade HOCs are callable; in RSC server bundles where they resolve to Client References, the runtime strips markers and leaves the element unwrapped because the HOC fallback is transparent. Server HTML is clean in either case, and client hydration matches.
- **`react-server` exports condition**: removed in `package.json`. The unified runtime IS RSC-safe (no `window` touch, no spatial chunk static import, and Client Reference detection for the internal facade boundary); a separate `react-server` mapping is no longer needed and would only add maintenance surface.
- **A1 (today's `*.web.ts` does not strip) auto-resolves**: the buggy file is deleted; nothing on `react-server` path remains to leak markers. No separate bug-fix PR is needed.

### 7. Spatial runtime detection

- A single `detectSpatialRuntime(): 'visionos' | 'picoos' | 'puppeteer' | null` helper in `runtime/detect.ts`, backed by `@webspatial/core-sdk/runtime`'s shared UA parser and inlined into emitted default/server JavaScript at build time. The emitted default-entry closure MUST NOT retain a runtime `@webspatial/core-sdk` import. The `'puppeteer'` value indicates a Puppeteer-driven test harness UA and MUST be treated identically to `'visionos'` / `'picoos'` for bridge / boot / facade decisions (per `runtime-capabilities` spec's "Detection helper used by lazy-load bridge" Scenario); this is intentional so `packages/autoTest` exercises the real `import('@webspatial/react-sdk/spatial')` path end-to-end. Internally facades branch on `detectSpatialRuntime() === null` vs non-null, so the `'puppeteer'` value flows through the spatial-equivalent path automatically with no per-call special-casing.
- Synchronous; no `await`, no network. Safe to call during SSR (returns `null` when `window` is unavailable).
- Called by `bootSpatial()` to decide whether to schedule the dynamic import, by `useSpatialReady()` once per component instance (via `useState` initializer) to choose the no-op vs real subscriber path, and by the dev-mode forgot-to-boot warning gate. Facades themselves never call `detectSpatialRuntime()` per render — they only consult `useSpatialReady()`.
- The result is treated as stable for the page lifetime, consistent with the existing `runtime-capabilities` decisions.
- The dev-mode "boot was forgotten" warning is gated on `detectSpatialRuntime() !== null`; non-WebSpatial browsers never see this warning because the rendered fallback IS their final intended display.

### 8. tsup configuration changes

- `packages/react/tsup.config.ts` collapses the old dual-build layout into flat published entries:
  - Default entry: `src/index.ts` → `dist/index.js`
  - Eager entry: `src/eager.ts` → `dist/eager.js`
  - Spatial entry: `src/spatial/index.ts` → `dist/spatial.js` (separate output file so dynamic `import('./spatial')` resolves to a distinct chunk that downstream bundlers can keep separate)
  - JSX runtime entries: `src/jsx/jsx-runtime.ts`, `src/jsx/jsx-dev-runtime.ts` → `dist/jsx/*.js` (single unified runtime — see decision 6; `*.web.ts` siblings are deleted)
  - Server / internal support entries introduced by sibling changes, including the internal `facades-client` RSC boundary
- Delete the `dist/web` and `dist/default` configurations entirely.
- Delete the `XR_ENV` lines from the banners; only `react-sdk-version` remains.
- The bridge's runtime `loadSpatialImpl()` uses a relative source dynamic import (`import('../spatial')`) so tsup emits a separate published `dist/spatial.js` chunk reachable through the package's `./spatial` export. Consumer bundlers still see a split dynamic-import boundary; the published subpath remains the public contract for direct/power-user access.
- The spatial entry has `noExternal` for any spatial-only internal deps but keeps `@webspatial/core-sdk` and `react` external (consumer-provided).
- `package.json` `exports` removes `./web` and `./default`, adds `./spatial`, `./eager`, and the SDK-internal `./internal/facades-client` RSC boundary, and collapses `./jsx-runtime` / `./jsx-dev-runtime` to a single mapping each (no `react-server` conditional sub-key), since the unified runtime is RSC-safe and there is no longer a "stripped-only" companion file to point at.

### 9. Size budget enforcement

Decision 13 (below) frames *why* the size budget has two tiers; this decision pins *how* enforcement is wired into the test suite:

- **SDK-side proxy** (`packages/react/src/__tests__/size-budget.test.ts` or similar): runs after `tsup` build, computes gzip size of `dist/index.js`, asserts ≤ 8192 bytes. Fast deterministic check — runs in the SDK's own test suite without a fixture build. Pinned by spec Scenario "SDK-side `dist/index.js` size proxy"; codified in `tasks.md §9.1`.
- **Marginal-delta fixture** (e.g. `tests/marginal-delta-vite/`): builds two minimal Vite ≥ 4 consumer apps — `app-base` (no SDK import) and `app-typical` (`import { Model, bootSpatial }` plus minimal usage) — and asserts gzipped marginal delta ≤ 8192 bytes. The default-entry dist scan separately asserts that this path contains no runtime imports from `@webspatial/core-sdk`. Pinned by spec Scenario "Marginal bundle delta on a typical consumer (product-level contract)"; codified in `tasks.md §9.2`.
- **Tree-shake effectiveness check**: a third `app-namespace` variant in the same fixture uses `import * as W` to defeat tree-shaking; assertion is that `app-namespace` marginal is *strictly larger* than `app-typical` marginal (catches broken tree-shaking even when absolute number passes). Pinned by spec Scenario "Tree-shake validation in fixture"; codified in `tasks.md §9.3`.
- **Identifier scan**: scans `dist/index.js` for spatial-only identifiers (`Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `PortalSpatializedContainer`, `StandardSpatializedContainer`, `SpatialMonitor`, `ResourceRegistry`, `AttachmentRegistry`, real reality-hook implementation symbols) — list comes verbatim from the spec's "Spatial-only identifiers are absent from default entry" Scenario. Codified in `tasks.md §9.4`.
- **`sideEffects: false` declaration** + **top-level side-effect lint**: pinned by spec's "Tree-shake friendliness" Requirement; codified in `tasks.md §9.5–§9.6`.
- `dist/spatial.js` size is reported as informational telemetry only; not budgeted in this change.

### 10. Plugin compatibility (cross-repo coordination)

- After this change, `@webspatial/vite-plugin` (in `webspatial/web-builder-plugins`) provides no value over plain Vite + `@webspatial/react-sdk`. Its remaining responsibilities (alias switching, dual outDir, `XR_ENV` define, `__XR_ENV_BASE__` define, base path appending) are either obsolete (alias / outDir / base) or trivially replaceable by user-side `define` (one liner).
- A plugin configuration that aliases `@webspatial/react-sdk` to `/web` or `/default` will **break the build** against the new SDK because those subpaths no longer exist. This is loud and intentional: it forces the upgrade conversation rather than letting the lazy-load optimization be silently bypassed.
- This change does not modify the plugin repo. A follow-up cross-repo issue will:
  - Announce the plugin as deprecated.
  - Recommend users remove `@webspatial/vite-plugin` from `vite.config.ts` and uninstall it.
  - Ship a final plugin version that no-ops gracefully (alias/outDir/base ignored, deprecation warning logged) for users who upgrade in two steps.

For the broader bundler-capability contract that "Plugin-free integration" relies on (ESM, `exports` field, dynamic-import code-splitting), see decision 11 below.

### 11. Bundler capability requirements and tested targets

The "Plugin-free integration" Requirement uses a **capability-based** contract instead of a bundler enumeration. Three capabilities together cover the full surface needed for plugin-free operation:

1. **ECMAScript modules** (`"type": "module"` in our package.json; consumer must support ESM imports).
2. **`exports` package.json field** (consumer must resolve `'.'`, `./eager`, `./jsx-runtime`, `./jsx-dev-runtime`, `./spatial`, and the SDK-internal `./internal/facades-client` boundary reached by the JSX runtime).
3. **Dynamic `import()` with code-splitting** (consumer must emit `dist/spatial.js` as a separate chunk fetched on demand).

Why capability-based, not enumeration:

- Bundler versions move fast; an enumeration grows stale.
- Capability is the actual contract; "Vite ≥ 4" is a *consequence* of that bundler honoring the capability list.
- A capability list is also what implementer-side validation tests can codify.

Bundlers that satisfy all three capabilities map to the **non-normative tested-targets list** (maintained in the migration guide):

- **Vite ≥ 4** — primary target; covered by `apps/test-server` migration follow-up and `packages/autoTest`.
- **Webpack ≥ 5** — covered transitively by Next.js App Router / Pages Router (Webpack mode).
- **Rollup ≥ 3** — basis for many SSR pipelines.
- **Rspack ≥ 1** — Webpack-compatible, expected to "just work".
- **esbuild ≥ 0.18 with `splitting: true`** — `apps/test-server` historically used bare esbuild; the migration follow-up needs to enable `splitting: true` to keep the size benefit.

What we treat as **out of scope for v1**:

- **Module Federation**: bridge singleton sharing across federated hosts is not specified; works in practice when SDK is dedupe'd by the bundler, but not part of the v1 contract.
- **Next.js Turbopack**: `next dev --turbo` and `next build --turbo` use a different module resolver; we have no test fixture in this PR. May work but no guarantee.
- **Webpack 4** (and any bundler without `exports` field support): the `exports` field is mandatory; older bundlers cannot resolve our subpaths.
- **CommonJS-only consumer pipelines**: ESM-only by design.

**Peer dependency**: `react: ">=18.0"` and `react-dom: ">=18.0"` (the version that introduced `useSyncExternalStore`). Both peers are **required, not optional** — `peerDependenciesMeta.<peer>.optional` MUST be `false` (or the entries absent). The package does NOT pin a maximum React version; React 19+ works because the `'use client'` directive is also benign in non-RSC environments.

The current `packages/react/package.json` has `peerDependenciesMeta.react.optional = true` and `peerDependenciesMeta["react-dom"].optional = true`, dating from the dual-build era when a consumer might in theory import only the JSX-runtime alias. Lazy-load v1 makes the React surface (facades, hooks, JSX runtime, `useSpatialReady`) the package's primary value — the optional flag is now misleading and contradicts the spec's "Plugin-free integration" Requirement. Rationale captured in `tasks.md §8.7`; flipping to `optional: false` is part of the build-config phase, not this doc-only PR.

**Why hard peer over alternatives** (rejected during pre-implementation review):

- *Keep optional + spec note*: leaves the `react.optional = true` claim on the package alongside a spec that says "React is required for the primary use case". Makes consumer environment diagnosis harder (unmet-peer warning is the cleanest signal).
- *Split a `@webspatial/react-sdk/runtime` subpath that doesn't need React*: would let "React-less consumers" use `bootSpatial`, `WebSpatialRuntime.supports`, `initScene`, etc. without React. Real demand for this is unproven (in-tree consumers all use React; package name itself is `@webspatial/**react**-sdk`). Tracked as a future follow-up if external demand surfaces.

**Code-splitting fallback behavior**: when a consumer's bundler inlines the spatial chunk (because the bundler does not support dynamic-import code-splitting), the SDK still functions correctly. `bootSpatial()` resolves once the inlined chunk's module-level code has executed; facades and hooks behave as if it had been fetched. The size benefit is lost on the consumer's bundle, but the SDK-side `dist/index.js` size budget is still met (it is enforced on the published package, independent of consumer bundling). This is documented in the spec Scenario "Bundler without code-splitting still functions, but loses the size benefit" so users can self-diagnose.

### 12. Stateless utility APIs are independent of the spatial chunk

A subset of the public API is **not** part of the lazy-load architecture. These APIs live in the default entry's static module graph and work without `bootSpatial()` or any bridge / facade / placeholder machinery. The `spatial-lazy-load` spec pins the contract in the "Stateless utility APIs and pure re-exports remain in the default entry" Requirement. Two mechanisms divide them:

**Group B — bridge-session-aware utilities** route through the React SDK bridge (`getSpatialImpl()?.getSession?.()`) after `bootSpatial()` has resolved:

- `initScene(name, callback, options?)` → `getSpatialImpl()?.getSession?.()?.initScene(...)`. Noops when no session.
- `convertCoordinate(position, { from, to })` → bridge session scene conversion when available. Returns input position when no session, with optional `console.warn` (graceful per `runtime-capabilities`'s "Unsupported behavior contracts" MODIFIED Requirement).
- `enableDebugTool()` → `typeof window === 'undefined'` early-return; otherwise attaches diagnostic helpers to `window`. The helpers read the bridge session lazily and throw a descriptive `bootSpatial()`-pointing error when called before boot.

These have no React state to manage and no `useSyncExternalStore` subscription. They also do not need `'use client'` directives because they are not React hooks and have no client-only React API surface (`enableDebugTool` does touch `window`, but is invoked imperatively from app code, not at component render time).

**Subtle consequence worth flagging**: in a WebSpatial runtime, an application that **forgets** to call `bootSpatial()` will see facades render fallback and Group B utilities gracefully degrade because both read from the same unready bridge. This intentionally keeps `bootSpatial()` as the single activation path and keeps the emitted default-entry closure free of core-sdk runtime imports.

**Group C — pure constants, type re-exports, React Context** with no runtime spatial dependency:

- `WebSpatialRuntime.supports(name, tokens?)` — local capability table lookup; pure data, no core-sdk runtime import.
- `WebSpatialRuntimeError` — local `Error` subclass matching the runtime-capability error contract.
- `CapabilityKey` — TypeScript type exported from the local capability helper.
- `SSRProvider` — **removed** in the `remove-ssr-provider` change; `withSSRSupported` gates client-only hosts via `useSyncExternalStore` instead.
- `version` — string constant injected at build time.

> Historical note: `getAbsoluteUrl(url)` (pure URL helper, SSR-safe) was originally listed in this Group C set during the lazy-load v1 design. It was demoted to an internal helper (`src/internal/urlUtils.ts`) and removed from the public surface after the design was published — see the `remove-getabsoluteurl` changeset for the rationale and migration recipe.
- Component / Hook / Entity / Model type-only re-exports (`SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`, etc.).

These count toward both tiers of the size budget: the SDK-side `dist/index.js` proxy (`tasks.md §9.1`) and the typical-case marginal-delta fixture (`tasks.md §9.2`), since Group B / C bytes that the consumer's named-import pattern reaches will land in the application bundle. The largest contributor is the local capability table consumed by `WebSpatialRuntime.supports` (~1–2 KB gzipped after dead-code elimination); everything else in Group C is bytes-level.

**Why not move Group B into the spatial chunk?** The stateless utility names are commonly imported from the default entry and are expected to be callable before `bootSpatial()` in plain web / SSR. They therefore stay in the default entry, but their spatial behavior is bridge-gated: no core-sdk session is touched until the spatial chunk has loaded.

### 13. Size budget framing — typical-case marginal delta as the product contract

The "8 KB" headline number lives in two places in the spec, and they are different measurements with different purposes:

1. **Product-level contract** (the user-facing measurement): the marginal gzipped bytes that `import { Model, bootSpatial }`-style usage of the SDK adds to a downstream application's bundle. The default-entry static graph must not contain runtime imports from `@webspatial/core-sdk`; core-sdk runtime bytes are reserved for the spatial/eager implementation graph. Pinned in spec by the "Marginal bundle delta on a typical consumer" Scenario; enforced by a CI fixture (Vite ≥ 4 minimal consumer per "Plugin-free integration") in `tasks.md §9`.
2. **SDK-side proxy** (the build-time check): the gzipped byte count of `dist/index.js` on its own. This is fast, deterministic, and runs every time tsup rebuilds the SDK. Pinned in spec by the "SDK-side `dist/index.js` size proxy" Scenario.

We keep both because they answer different questions. The proxy catches "did the SDK package itself bloat?" inside the SDK's own test suite, with no fixture infrastructure required. The marginal-delta fixture catches "what does the consumer actually pay?" in a real bundler, while the dist identifier scan separately catches accidental core-sdk runtime leakage from the default entry.

**Why typical case, not worst case?**

- "Worst case" (`import * as W` with non-static access, or `import '@webspatial/react-sdk'` side-effect import, or explicit named imports of every export) projects to roughly 9–11 KB gzipped marginal at the SDK structure pinned by this spec. Hitting 8 KB across all worst-case shapes is **possible** in v2 (would require splitting the capability table or merging facades) but would be significant additional work without proportional product value.
- Typical real-world usage is named-import of one or a few primitives. Per estimation: `import { Model }` → ~3–4 KB; `import { Model, bootSpatial }` → ~3–5 KB; "商品页 with several entities + hooks" → ~5–7 KB. Comfortably within 8 KB.
- A worst-case 8 KB target makes the typical 95% of users pay (in design constraint complexity) for the long-tail 5% of users who write `import *`. We instead pin the typical-case contract and document the worst-case explicitly as informational.

**Why declare `"sideEffects": false`?**

Bundlers default to "if I cannot prove this barrel module has no side effects, I conservatively keep every module reachable from it". For a 19-named-export barrel like ours, that pessimistic default means tree-shaking does almost nothing — `import { Model }` ends up paying for `Reality`, `BoxEntity`, every facade, every hook, every utility. Marginal delta jumps to worst-case territory.

The fix is the published `package.json` `"sideEffects": false` declaration. With it, modern bundlers (Vite ≥ 4, Webpack 5+, Rollup ≥ 3, Rspack ≥ 1, esbuild ≥ 0.18) eliminate every barrel re-export the consumer does not actually use. This is what makes the "typical case 3–5 KB" projection achievable.

For `"sideEffects": false` to be safe, every module in the default-entry static graph must actually be free of top-level side effects — otherwise declaring `false` produces silently broken builds (the side effect runs in some bundlers and not others). The spec's "Tree-shake friendliness" Requirement pins this discipline:

- The current top-level `if (typeof window !== 'undefined') { initPolyfill() }` in `src/index.ts` is the **only** known top-level side effect today; `tasks.md §7.2` already removes it (deferred into the spatial chunk's bootstrap). Once removed, the default entry is side-effect-free.
- Future additions need to follow the same rule: install side effects on demand inside functions, not at module top level.

**Why not measure now (during the spec PR)?**

The lazy-load architecture has zero source code lines yet — only spec / docs in `openspec/changes/lazy-load-spatial-runtime/`. Any size measurement against the current `packages/react/src/` would measure the **old** dual-build SDK (≈ 124 KB), which has no relationship to the lazy-load post-implementation marginal. Three options were considered for getting real numbers:

- Estimate from source-file structure with typical compression ratios (what this design records as "3–5 KB typical / 9–11 KB worst case"). ±30–50% accuracy.
- Build a minimal scaffold of the lazy-load architecture (empty facades, bridge skeleton, boot stub) and measure that. ±10% accuracy, ~half-day work, but introduces source code into the spec PR.
- Wait for the real implementation. Exact numbers, but only available at the end of `tasks.md §1–§9`.

We chose **estimate now, calibrate during implementation**: the 8 KB target enters spec as the design intent, and `tasks.md §12.9` is a pre-v1-release calibration task that runs the fixture against the real build and decides whether to tighten the budget (e.g. to 6 KB if measured at 4 KB) or to surface optimization work (if measured > 8 KB).

### 14. Eager-mode entry and shared distribution hygiene

The lazy-load default entry optimizes the web-first case. A second distribution form, `@webspatial/react-sdk/eager`, optimizes the opposite profile: spatial-only applications where every page load is a WebSpatial runtime and the lazy sequence (main bundle parse → `bootSpatial()` → spatial chunk fetch → second parse) is pure overhead.

The eager entry is intentionally additive. It does not weaken the default entry's 8 KB budget, dynamic-import boundary, or web fallback contract. Instead it:

- Statically imports `./spatial` and calls `__internalSetSpatialImpl(SpatialImpl)` at module-evaluation time so facade-equivalent paths reached through the JSX runtime see the bridge as ready from the first render.
- Re-exports real spatial primitives from `./spatial` (`Model`, `Reality`, the entity / material / asset family, `SceneGraph` / `World`, and `useMetrics`). Factory HOCs remain internal-only; the public marker path is still `enable-xr` / `enable-xr-monitor`.
- Re-exports Group B / C utilities from the same source modules used by `./index`, plus type-only surface from `./index`. This keeps `enableDebugTool`, `convertCoordinate`, `initScene`, `WebSpatialRuntime`, `version`, and `createElement` behavior-aligned between entries while avoiding the default-entry facade chunk in the eager static closure.
- Exposes the lazy-load runtime API as compatibility stubs: `bootSpatial()` resolves immediately, `isSpatialReady()` and `useSpatialReady()` return `true`, `onSpatialLoadError()` registers but never fires, and `WebSpatialBootError` remains importable.
- Has **no** separate product size cap (spatial-only consumers accept the full spatial implementation inline). The default-entry marginal-delta fixture continues to import `@webspatial/react-sdk`, not `@webspatial/react-sdk/eager`, and MUST remain ≤ 8 KB after the eager entry is added.

**Product routing (normative in `spec.md`):** applications that need SSR (or prerender HTML that includes spatial primitives in the React tree) SHOULD use `@webspatial/react-sdk`. The eager entry targets **CSR-only** mounting of spatial primitives (e.g. `dynamic(..., { ssr: false })`); server-rendering eager-imported primitives is **unsupported**.

Consumers MUST pick one root per application bundle. Mixing `@webspatial/react-sdk` and `@webspatial/react-sdk/eager` in the same bundle is unsupported because the same symbol name may refer to different physical implementations (facade vs real implementation). Development builds SHOULD warn if this is detectable, but the migration guide is the primary enforcement mechanism.

The two forms still share packaging hygiene: ESM-only publishing, required React peers, `"sideEffects"` correctness, no observable top-level side effects in published-entry graphs beyond the eager/spatial polyfill bootstrap, **default-entry façade SSR contracts** (`useSpatialReady` snapshots, deterministic fallbacks — see `spec.md` "SSR and hydration safety"), type-only erasure, plugin-free integration, and named re-export discipline. **Eager spatial primitives** do not participate in those SSR guarantees — CSR-gating is the consumer's obligation. Stateless Group B/C symbols re-exported from both roots remain SSR-safe when invoked on the server. Future changes may adjust the distribution forms, but they must explicitly preserve or separately justify changes to these hygiene contracts.

## Risks / Trade-offs

- **[Risk] Old `@webspatial/vite-plugin` configuration not removed in lockstep** → consumer build fails immediately ("Cannot resolve `@webspatial/react-sdk/web`"). **Mitigation**: BREAKING marker at the top of CHANGELOG; first item in the migration guide is the plugin removal diff; coordinated cross-repo deprecation issue filed before SDK release.
- **[Risk] Application forgets to call `bootSpatial()` in a WebSpatial runtime** → all spatial APIs silently render web fallbacks for the entire session. **Mitigation**: dev-mode one-shot console warning when a facade renders before bridge is ready; README "Quick start" example always shows the boot call; integration test in the follow-up in-house migration verifies the boot path.
- **[Risk] Downstream bundlers that do not support code splitting** (older esbuild configs without `splitting: true`, certain CommonJS pipelines) inline the spatial chunk back into the main bundle. The dynamic-import optimization is silently lost. **Mitigation**: pinned in the spec as a normative Scenario ("Bundler without code-splitting still functions, but loses the size benefit") under "Plugin-free integration" — the SDK still functions correctly and the SDK-side `dist/index.js` size budget remains enforced on the published package; only the application's bundle fails to realize the per-application size benefit. The migration guide lists `splitting: true` as the esbuild fix; the in-house migration follow-up will exercise this on `apps/test-server` (currently bare esbuild).
- **[Risk] SSR / hydration mismatch** between server-rendered fallback and client-rendered real implementation on the **lazy default entry** → React logs hydration warnings or visually janks. **Mitigation**: `useSpatialReady` is implemented with `useSyncExternalStore` and a stable `getServerSnapshot` returning `false`; this guarantees the hydration pass renders fallback (matching server output) and only swaps to the real implementation on the next React commit, regardless of whether `bootSpatial()` was awaited before, after, or never relative to `hydrateRoot()`. The migration guide documents both timing options; the "SSR and hydration safety" Requirement pins the contracts (`'use client'` directive on facades, `getServerSnapshot` stability, deterministic-props responsibility, etc.).
- **[Risk] Eager entry used under SSR for spatial primitives** → undefined behavior / hydration divergence. **Mitigation**: normative **`spec.md` entry routing — applications needing SSR SHOULD use `@webspatial/react-sdk` and CSR-gate or avoid eager-imported primitives on the server.
- **[Risk] Dynamic import of the spatial chunk fails over the network** → application enters a "boot rejected" state. **Mitigation**: `bootSpatial()` rejects with the underlying error; `onSpatialLoadError(cb)` lets the application report and recover (e.g. retry or hard-refresh prompt); facades stay in fallback mode (no broken half-state).
- **[Risk] Bundle size budget too aggressive (8KB gzip, both proxy and marginal-delta tiers)** → blocks landing if the initial implementation exceeds either tier. **Mitigation**: the 8KB number is a design intent, not a measured reality; `tasks.md §12.9` is a pre-v1-release calibration follow-up that runs the §9.2 fixture against the real implementation and either tightens the budget (if measured at e.g. 4KB / 6KB) or files targeted optimization issues (if measured > 8KB); decision 13 documents the calibration philosophy. Worst-case namespace / full-barrel imports MAY exceed and are documented as informational, not v1 violations.
- **[Risk] Forgotten top-level side effect breaks `"sideEffects": false` claim** → declaring `"sideEffects": false` while a default-entry module has a top-level side effect produces silently broken builds (the side effect runs in some bundlers and not others). **Mitigation**: spec's "Tree-shake friendliness" Requirement pins both the declaration AND the no-top-level-side-effects rule, with separate Scenarios; `tasks.md §9.5` (declaration check) and §9.6 (top-level side-effect lint) are paired CI gates. The only known top-level side effect today (`if (typeof window !== 'undefined') { initPolyfill() }` in `src/index.ts`) is removed in §7.2 with installation deferred into the spatial chunk's bootstrap.
- **[Risk] In-house apps still alias to source** and therefore do not exercise the published `dist/spatial.js` chunk → regressions in the published chunk go undetected by this change. **Mitigation**: explicit follow-up task to migrate them; this change is intentionally scoped narrowly to keep PR reviewable.
- **[Risk] Mixed default + eager imports create split semantics** → `Model` from the default entry is a facade while `Model` from the eager entry is the real implementation, so mixing roots in one bundle can produce confusing readiness behavior. **Mitigation**: the spec marks mixed imports unsupported, the README / migration guide document "pick one root per bundle", and the eager entry may emit a one-shot development warning if detection is practical.
- **[Trade-off] Bridge singleton makes parallel React roots within the same page share one spatial chunk** — usually desirable, but if two roots have inconsistent boot expectations (one boots, one doesn't), the non-booting root will see the spatial implementation appear once the booting root completes. Acceptable for v1; documented in the spec.

## Migration Plan

**For application developers (single-build SPA, web-first):**

1. Upgrade `@webspatial/react-sdk` to the new version.
2. If `vite.config.ts` includes `@webspatial/vite-plugin`, remove it from the `plugins` array and uninstall the dependency. Old aliases to `@webspatial/react-sdk/web` or `/default` will otherwise fail to resolve.
3. In the application entry (e.g. `main.tsx`), invoke `bootSpatial()`. Both timing patterns are supported because `useSpatialReady` is built on `useSyncExternalStore` and handles the SSR/CSR transition cleanly:

   ```tsx
   // Option A — boot before render (CSR only; no fallback flash; slower TTI in spatial runtimes)
   //
   // SSR caveat: if the page uses `hydrateRoot(...)` instead of `createRoot(...).render(...)`,
   // the hydration pass still renders fallback to match the server-rendered HTML; the swap
   // to real implementations happens on the post-hydration commit. The fallback flash is
   // visible regardless of boot timing in the SSR path.
   import { bootSpatial } from '@webspatial/react-sdk'

   await bootSpatial()
   ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
   ```

   ```tsx
   // Option B — render first, boot after (faster TTI; brief fallback flash before swap)
   //
   // SSR note: behaves identically to Option A under hydrate (both produce a hydration-pass
   // fallback render then swap on the next commit). Differences only show in pure CSR.
   import { bootSpatial } from '@webspatial/react-sdk'

   ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
   void bootSpatial()
   ```

   For SSR / hydration, both options are hydration-safe (the spec requires `useSpatialReady` to render fallback during the hydration pass and only swap to real on the next commit). The SSR fallback-to-real swap is NOT avoidable by either timing — the difference is only that boot-before starts the spatial chunk fetch in parallel with HTML streaming, while boot-after defers the fetch until after the page is interactive.

4. If you need a custom web rendering for a specific facade (e.g. an `<img>` poster instead of the default degraded `<model>` element), write a small wrapper that branches on `useSpatialReady()`:

   ```tsx
   import { Model, useSpatialReady } from '@webspatial/react-sdk'

   export function ProductModel({ posterSrc, ...props }) {
     const ready = useSpatialReady()
     return ready ? <Model {...props} /> : <img src={posterSrc} />
   }
   ```

   Per-facade `fallback` props are intentionally not part of the v1 API — wrappers using `useSpatialReady()` are the supported customization path.

**For applications using the old subpaths directly:**

- `import { ... } from '@webspatial/react-sdk/web'` → `import { ... } from '@webspatial/react-sdk'`
- `import { ... } from '@webspatial/react-sdk/default'` → `import { ... } from '@webspatial/react-sdk'`

**For spatial-only applications:**

- Use `import { ... } from '@webspatial/react-sdk/eager'` when the application bundle only targets WebSpatial runtimes and the extra `bootSpatial()` network round-trip is unwanted.
- **SSR / prerender**: spatial primitives from `@webspatial/react-sdk/eager` MUST be mounted **client-side only** (framework equivalents: Next.js `dynamic(..., { ssr: false })`, conditional mount after `typeof window`). For pages whose server HTML must include façade fallbacks for spatial components, use `@webspatial/react-sdk` instead (see `spec.md` "Entry routing (normative)").
- Migration from the default entry is import-root-only: existing `await bootSpatial()` calls may remain and become no-op compatibility stubs.
- Do not mix default-entry and eager-entry imports in the same application bundle; choose one root consistently.

**Bundler / framework compatibility checklist (per "Plugin-free integration"):**

- ✅ Tested targets: Vite ≥ 4, Webpack ≥ 5 (incl. Next.js App Router and Pages Router in Webpack mode), Rollup ≥ 3, Rspack ≥ 1, esbuild ≥ 0.18 with `splitting: true`.
- ⚠️ Best-effort, not v1 contracts: Next.js Turbopack, Module Federation host-shared SDK, Webpack 4, CommonJS-only consumer pipelines. These environments may work but failures there are tracked as feature requests, not v1 spec violations.
- ❌ Required: ESM-only consumption (`require()` is not supported); React ≥ 18.0 (peer dep on `useSyncExternalStore`).
- 💡 Note for esbuild users: enable `splitting: true` to preserve the lazy-load size benefit; without it the spatial chunk is inlined into the main bundle (functionally correct, but no size win).

**For the in-house repo workflow:**

- `apps/test-server`, `packages/autoTest`, `tests/ci-test` are not modified in this change. They alias `@webspatial/react-sdk` to source, which now resolves to the new lean `src/index.ts`. They will continue to work but will *not* exercise the dynamic-import code-split path (their bundlers inline `src/spatial/index.ts` because it is a relative aliased path inside a single source tree). A follow-up change will migrate them.

**Rollback:**

- Revert the SDK to the previous version. Applications that already removed `@webspatial/vite-plugin` will need to re-add it (and re-add the `XR_ENV=avp vite build` step) to keep the old `dist/default` semantics. Cleaner rollback path: avoid releasing the new SDK to production until the migration guide is published and at least one downstream app has migrated successfully.

## Open Questions

- Final number for the gzip size budget (both tiers). 8 KB is the design target for marginal delta and SDK-side proxy alike; `tasks.md §9.1–§9.2` already assert `≤ 8192 bytes` and `tasks.md §12.9` is the pre-v1-release calibration follow-up that runs the §9.2 fixture against the real implementation and decides whether to tighten the spec budget (e.g. to 6 KB if measured at 4 KB) or to surface optimization work (if measured > 8 KB). Decision 13 explains the framing in detail.
- Whether to expose `getBootStatus(): 'idle' | 'loading' | 'ready' | 'failed'` (a more granular state-machine query) in addition to `isSpatialReady()`. Skipped in v1 — `isSpatialReady()` plus rejection of `bootSpatial()` plus `onSpatialLoadError(cb)` covers known use cases; revisit if applications request finer state.
- Whether `bootSpatial()` should accept a `{ timeoutMs }` option. v1 says no (applications can `Promise.race` themselves); revisit if real-world deployments report hung-import scenarios.
- How aggressively to tighten the size budget after the initial release. A reasonable cadence is to revisit once per minor release based on actual `dist/index.js` measurements.

(Note: a `<SpatialBoundary>` Suspense-style integration is explicitly listed as a Non-Goal for v1; it is not an open question for this change. A follow-up change can add it without breaking current callers if user feedback shows demand.)
