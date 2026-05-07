## Context

Today `@webspatial/react-sdk` ships two near-identical bundles (`dist/web` ≈ `dist/default` ≈ 124KB) and relies on a separate `@webspatial/vite-plugin` (in repo `webspatial/web-builder-plugins`) to alias `@webspatial/react-sdk` to one of those subpaths based on `XR_ENV`. The intended outcome — "web users do not pay for spatial code" — does not actually hold today: only `initScene` and the JSX runtime have `.web.ts` placeholders, while every heavyweight spatial module (containers, monitors, reality, entities, real `Model`, reality hooks) still ends up in the web bundle.

Two parallel `XR_ENV` injection mechanisms (tsup banner writes `window.__webspatialsdk__.XR_ENV`; the plugin defines `window.XR_ENV`) further muddy runtime detection. None of the in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) actually use the plugin — they all alias `@webspatial/react-sdk` straight to source — so the dual-build contract has no end-to-end coverage in this repo.

Product positioning is now explicitly **web-first, spatial as enhancement**: most page loads are in regular browsers; only WebSpatial-runtime sessions need the spatial implementation. A simpler, web-first-aligned architecture is to **defer spatial code from build time to run time**: keep one tiny default bundle, dynamically `import()` the spatial implementation only inside a WebSpatial runtime, and gate that load on a single explicit `bootSpatial()` call.

## Goals / Non-Goals

**Goals:**

- Keep the published default `@webspatial/react-sdk` entry small enough to be a non-issue for web users (gzip ≤ 8KB on `dist/index.js`, asserted by a unit test).
- Preserve application-level import ergonomics: `import { Model, Reality, useEntity } from '@webspatial/react-sdk'` continues to work in source.
- Spatial implementations are loaded over the network **only** in a WebSpatial runtime, **only once** per page lifetime, and **only** via `bootSpatial()`.
- Hooks in the default entry are safe to call unconditionally and return documented stable defaults in web mode (no Rules-of-Hooks violations).
- The unified JSX runtime strips `enable-xr` / `enable-xr-monitor` / `style.enableXr` / `__enableXr__` className token AND wraps the element type with the corresponding facade HOC, eliminating "unknown attribute" warnings in plain browsers and preserving today's AVP-side `<div enable-xr/>` → spatial-container behavior.
- The package works correctly **without** any build plugin; `@webspatial/vite-plugin` is no longer a required dependency.

**Non-Goals:**

- Splitting the spatial chunk further (e.g. reality / container / model into separate sub-chunks). Land one spatial chunk first; revisit after measuring real-world load profiles.
- Server-side or RSC-time spatial implementations. SSR always renders web fallbacks; the bridge stays inert until client-side hydration completes and `bootSpatial()` is awaited.
- Introducing `<SpatialBoundary>` / Suspense-style integration in this change. `bootSpatial()` is the single supported activation path; a Suspense path can be added in a future change without breaking current callers.
- Migrating in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) to consume `dist` + `bootSpatial()`. Tracked as a follow-up. Their current alias-to-source workflow continues to work because the new `src/index.ts` is the lean entry.
- Rewriting or restructuring `@webspatial/core-sdk`. `noRuntime.ts` becomes unused by react-sdk after this change but is left in place; cleanup is out of scope.
- Removing or rewriting `@webspatial/vite-plugin`. The plugin lives in another repo; we only document the recommendation that users uninstall it.

## Decisions

### 1. Package structure and entry layout

- `@webspatial/react-sdk` `'.'` (default entry) contains only:
  - `runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `runtime/useSpatialReady.ts`, plus the `WebSpatialBootError` class (co-located with bridge or in `runtime/errors.ts`)
  - `facades/*.tsx` — facade React components for every public spatial component / HOC
  - `hooks-web/useMetrics.ts` — the only public spatial-hook placeholder today (see decision 5 for the reasoning; future public hooks add new files here)
  - JSX runtime: unified `jsx-runtime.ts` / `jsx-dev-runtime.ts` (with marker stripping AND facade-HOC wrapping; see decision 6)
  - Type-only exports (props, refs, event types)
- `@webspatial/react-sdk/spatial` is a new subpath whose module is the single source of truth for the real spatial implementation: `Spatialized*Container*`, real `withSpatialMonitor`, real `withSpatialized2DElementContainer`, `Reality`, all `*Entity` components, real `Model`, real `useMetrics`, and all internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useRealityEvents`, `useEntityId`, `useForceUpdate`). Internal reality hooks are not re-exported from the spatial barrel either — they are consumed by the spatial components within the same chunk.
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
  - `WebSpatialBootError` — `Error` subclass carrying `cause` (the underlying `import()` error) and `attempt` (1-based count). Stored on `lastError` after each failed attempt.
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

### 4. Facade pattern for components and HOCs

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
- HOCs (`withSpatialized2DElementContainer`, `withSpatialMonitor`) return facade components that delegate to the real HOC's output via the bridge. Wrapper-cache contract (same `Comp` → same wrapper reference) is preserved by caching the facade wrapper using the raw `Comp` reference as the key; the real HOC's own cache lives inside the spatial chunk.
- Per-component default fallback (full table is normative in the spec; summary here):
  - `Model` → `<model ref {...modelProps}>` (degraded HTML element; spatial-only event props stripped) — preserves today's plain-browser behavior.
  - `Reality` → single `<div aria-hidden="true">` placeholder; children NOT mounted (matches `runtime-capabilities` Reality fallback contract).
  - `*Entity`, `Material*`, `Texture`, `*Asset` → `null`.
  - `SceneGraph` / `World` → `<>{children}</>` (transparent container).
  - HOC-wrapped components → `<Comp/El {...passthrough} ref/>` (transparent passthrough).
- **Facade conventions**: `displayName` matches the public name (`Model`, `Reality`, `BoxEntity`); HOC wrapper facades follow the existing `WithSpatialMonitor(<inner>)` / `WithSpatialized2DElementContainer(<inner>)` naming. Facades are NOT wrapped in `React.memo`. In fallback paths that render `null` or a Fragment, forwarded `ref.current` is `null` (React-natural).
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
// packages/react/src/index.ts (default-entry public export)
import { useMetrics as useMetricsPlaceholder } from './hooks-web/useMetrics'
import { getSpatialImpl, isSpatialReady } from './runtime/bridge'

export function useMetrics(): ReturnType<typeof useMetricsPlaceholder> {
  // Decided once at first render of the component instance; never flips mid-life.
  const [impl] = useState(() => (isSpatialReady() ? getSpatialImpl()!.useMetrics : useMetricsPlaceholder))
  return impl()
}
```

If `bootSpatial()` is not awaited (misuse): `useMetrics` remains in placeholder mode for the entire page lifetime — consistent web-fallback behavior, no runtime crash. Facades will still flip (decision 4), but `useMetrics` inside any already-mounted component keeps returning the placeholder values until that component remounts.

**Future hooks**: if a future SDK version adds a new publicly exported spatial hook, the spec table in "Requirement: Hook placeholders" MUST be updated and a corresponding placeholder + tests landed in the same change.

### 6. JSX runtime: single unified runtime that strips and wraps with facade HOCs

**Today's split**: there are two JSX runtime files. `jsx-runtime.ts` (delegated to `jsx-shared.ts`) strips markers AND wraps with the **real** HOCs (`withSpatialized2DElementContainer` / `withSpatialMonitor`). `jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` simply re-export `react/jsx-runtime` and do nothing — leaking markers to the DOM in plain browsers (today's silent bug, primarily affecting RSC users via the `react-server` exports condition).

**After this change**: a **single** unified runtime serves all environments. The previously split `*.web.ts` files are deleted.

- The unified runtime lives at `packages/react/src/jsx/jsx-runtime.ts` and `jsx-dev-runtime.ts` (or its current shared module `jsx-shared.ts`). It performs strip + wrap in the same pass; the HOC targets become the **facade** versions (already exported from the default entry by "Component facades"). The facade chooses between web fallback and real spatial container at render time via the bridge — so the JSX runtime no longer needs an environment-aware variant.
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
- **SSR**: the runtime contains no `window` access; strip + wrap work the same on server and client. Because `useSpatialReady()` returns `false` during SSR, the wrapped facade renders its documented fallback — server HTML is clean, client hydration matches.
- **`react-server` exports condition**: removed in `package.json`. The unified runtime IS RSC-safe (no `window` touch, no spatial chunk static import); a separate `react-server` mapping is no longer needed and would only add maintenance surface.
- **A1 (today's `*.web.ts` does not strip) auto-resolves**: the buggy file is deleted; nothing on `react-server` path remains to leak markers. No separate bug-fix PR is needed.

### 7. Spatial runtime detection

- A single `detectSpatialRuntime(): 'visionos' | 'picoos' | null` helper in `runtime/detect.ts`, thin wrapper over the existing core-sdk runtime snapshot.
- Synchronous; no `await`, no network. Safe to call during SSR (returns `null` when `window` is unavailable).
- Called by `bootSpatial()` to decide whether to schedule the dynamic import, by `useSpatialReady()` once per component instance (via `useState` initializer) to choose the no-op vs real subscriber path, and by the dev-mode forgot-to-boot warning gate. Facades themselves never call `detectSpatialRuntime()` per render — they only consult `useSpatialReady()`.
- The result is treated as stable for the page lifetime, consistent with the existing `runtime-capabilities` decisions.
- The dev-mode "boot was forgotten" warning is gated on `detectSpatialRuntime() !== null`; non-WebSpatial browsers never see this warning because the rendered fallback IS their final intended display.

### 8. tsup configuration changes

- `packages/react/tsup.config.ts` reduces from four entries to three:
  - Main entry: `src/index.ts` → `dist/index.js`
  - Spatial entry: `src/spatial/index.ts` → `dist/spatial.js` (separate output file so dynamic `import('./spatial')` resolves to a distinct chunk that downstream bundlers can keep separate)
  - JSX runtime entries: `src/jsx/jsx-runtime.ts`, `src/jsx/jsx-dev-runtime.ts` → `dist/jsx/*.js` (single unified runtime — see decision 6; `*.web.ts` siblings are deleted)
- Delete the `dist/web` and `dist/default` configurations entirely.
- Delete the `XR_ENV` lines from the banners; only `react-sdk-version` remains.
- The dynamic `import('../spatial')` inside `bridge.ts` resolves at runtime to `@webspatial/react-sdk/spatial` (the published subpath), so consumer bundlers see a real subpath import and can split the chunk.
- The spatial entry has `noExternal` for any spatial-only internal deps but keeps `@webspatial/core-sdk` and `react` external (consumer-provided).
- `package.json` `exports` for `./jsx-runtime` and `./jsx-dev-runtime` collapse to a single mapping each (no `react-server` conditional sub-key), since the unified runtime is RSC-safe and there is no longer a "stripped-only" companion file to point at.

### 9. Size budget enforcement

- `packages/react/src/__tests__/size-budget.test.ts` runs after build. It:
  - Computes gzip size of `dist/index.js` and asserts ≤ 8192 bytes (initial budget; tighten in follow-up changes if measurement allows).
  - Asserts the file does not contain spatial-only identifier names (`Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `RealityRoot`, etc.) as a structural check that nothing leaked.
- `dist/spatial.js` size is reported as informational telemetry only; not budgeted in this change.

### 10. Plugin compatibility (cross-repo coordination)

- After this change, `@webspatial/vite-plugin` (in `webspatial/web-builder-plugins`) provides no value over plain Vite + `@webspatial/react-sdk`. Its remaining responsibilities (alias switching, dual outDir, `XR_ENV` define, `__XR_ENV_BASE__` define, base path appending) are either obsolete (alias / outDir / base) or trivially replaceable by user-side `define` (one liner).
- A plugin configuration that aliases `@webspatial/react-sdk` to `/web` or `/default` will **break the build** against the new SDK because those subpaths no longer exist. This is loud and intentional: it forces the upgrade conversation rather than letting the lazy-load optimization be silently bypassed.
- This change does not modify the plugin repo. A follow-up cross-repo issue will:
  - Announce the plugin as deprecated.
  - Recommend users remove `@webspatial/vite-plugin` from `vite.config.ts` and uninstall it.
  - Ship a final plugin version that no-ops gracefully (alias/outDir/base ignored, deprecation warning logged) for users who upgrade in two steps.

## Risks / Trade-offs

- **[Risk] Old `@webspatial/vite-plugin` configuration not removed in lockstep** → consumer build fails immediately ("Cannot resolve `@webspatial/react-sdk/web`"). **Mitigation**: BREAKING marker at the top of CHANGELOG; first item in the migration guide is the plugin removal diff; coordinated cross-repo deprecation issue filed before SDK release.
- **[Risk] Application forgets to call `bootSpatial()` in a WebSpatial runtime** → all spatial APIs silently render web fallbacks for the entire session. **Mitigation**: dev-mode one-shot console warning when a facade renders before bridge is ready; README "Quick start" example always shows the boot call; integration test in the follow-up in-house migration verifies the boot path.
- **[Risk] Downstream bundlers that do not support code splitting** (older esbuild configs without `splitting: true`, certain CommonJS pipelines) inline the spatial chunk back into the main bundle. The dynamic-import optimization is silently lost. **Mitigation**: document the requirement (Vite, Rollup, Webpack 5+, Rspack work out-of-box; bare esbuild needs `splitting: true`); the in-house migration follow-up will exercise this on `apps/test-server` (currently bare esbuild).
- **[Risk] SSR / hydration mismatch** between server-rendered fallback and client-rendered real implementation → React logs hydration warnings or visually janks. **Mitigation**: contract that the first client render after hydration MUST still render fallback (i.e. `bootSpatial()` is awaited *before* `ReactDOM.hydrateRoot`); migration guide flags this; spec includes a hydration scenario.
- **[Risk] Dynamic import of the spatial chunk fails over the network** → application enters a "boot rejected" state. **Mitigation**: `bootSpatial()` rejects with the underlying error; `onSpatialLoadError(cb)` lets the application report and recover (e.g. retry or hard-refresh prompt); facades stay in fallback mode (no broken half-state).
- **[Risk] Bundle size budget too aggressive (8KB gzip)** → blocks landing if the initial implementation exceeds it slightly. **Mitigation**: budget is enforced by a test that can be tightened over time; if first measurement is e.g. 9KB, land at the measured value and tighten in a follow-up; `Goals` section commits to ≤ 8KB as the *target*, not a launch blocker.
- **[Risk] In-house apps still alias to source** and therefore do not exercise the published `dist/spatial.js` chunk → regressions in the published chunk go undetected by this change. **Mitigation**: explicit follow-up task to migrate them; this change is intentionally scoped narrowly to keep PR reviewable.
- **[Trade-off] Bridge singleton makes parallel React roots within the same page share one spatial chunk** — usually desirable, but if two roots have inconsistent boot expectations (one boots, one doesn't), the non-booting root will see the spatial implementation appear once the booting root completes. Acceptable for v1; documented in the spec.

## Migration Plan

**For application developers (single-build SPA, web-first):**

1. Upgrade `@webspatial/react-sdk` to the new version.
2. If `vite.config.ts` includes `@webspatial/vite-plugin`, remove it from the `plugins` array and uninstall the dependency. Old aliases to `@webspatial/react-sdk/web` or `/default` will otherwise fail to resolve.
3. In the application entry (e.g. `main.tsx`), invoke `bootSpatial()`. Both timing patterns are supported because `useSpatialReady` is built on `useSyncExternalStore` and handles the SSR/CSR transition cleanly:

   ```tsx
   // Option A — boot before render (no fallback flash; slower TTI in spatial runtimes)
   import { bootSpatial } from '@webspatial/react-sdk'

   await bootSpatial()
   ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
   ```

   ```tsx
   // Option B — render first, boot after (faster TTI; brief fallback flash before swap)
   import { bootSpatial } from '@webspatial/react-sdk'

   ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
   void bootSpatial()
   ```

   For SSR / hydration, Option A awaited before `hydrateRoot()` is hydration-safe (the spec requires `useSpatialReady` to render fallback during the hydration pass and only swap to real on the next commit). Option B with `bootSpatial()` invoked after `hydrateRoot()` is also safe and trades initial-hydrate speed for a one-render fallback flash.

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

**For the in-house repo workflow:**

- `apps/test-server`, `packages/autoTest`, `tests/ci-test` are not modified in this change. They alias `@webspatial/react-sdk` to source, which now resolves to the new lean `src/index.ts`. They will continue to work but will *not* exercise the dynamic-import code-split path (their bundlers inline `src/spatial/index.ts` because it is a relative aliased path inside a single source tree). A follow-up change will migrate them.

**Rollback:**

- Revert the SDK to the previous version. Applications that already removed `@webspatial/vite-plugin` will need to re-add it (and re-add the `XR_ENV=avp vite build` step) to keep the old `dist/default` semantics. Cleaner rollback path: avoid releasing the new SDK to production until the migration guide is published and at least one downstream app has migrated successfully.

## Open Questions

- Final number for the gzip size budget. 8KB is the design target; the test will be added with the *measured* number once the implementation lands, with an assertion comment that the design target is 8KB.
- Whether to expose `getBootStatus(): 'idle' | 'loading' | 'ready' | 'failed'` (a more granular state-machine query) in addition to `isSpatialReady()`. Skipped in v1 — `isSpatialReady()` plus rejection of `bootSpatial()` plus `onSpatialLoadError(cb)` covers known use cases; revisit if applications request finer state.
- Whether `bootSpatial()` should accept a `{ timeoutMs }` option. v1 says no (applications can `Promise.race` themselves); revisit if real-world deployments report hung-import scenarios.
- How aggressively to tighten the size budget after the initial release. A reasonable cadence is to revisit once per minor release based on actual `dist/index.js` measurements.

(Note: a `<SpatialBoundary>` Suspense-style integration is explicitly listed as a Non-Goal for v1; it is not an open question for this change. A follow-up change can add it without breaking current callers if user feedback shows demand.)
