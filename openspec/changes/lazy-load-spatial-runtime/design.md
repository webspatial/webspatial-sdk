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
- JSX runtime web variants strip `enable-xr` / `enable-xr-monitor` / `style.enableXr` / `__enableXr__` className token before delegating to React, eliminating "unknown attribute" warnings in plain browsers.
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
  - `runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`
  - `facades/*.tsx` — facade React components for every spatial component / HOC
  - `hooks-web/useMetrics.ts` — the only public spatial-hook placeholder today (see decision 5 for the reasoning; future public hooks add new files here)
  - JSX runtime web variants (with attribute stripping)
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
- Public API re-exported from the default entry (contracts pinned in the `bootSpatial` Requirement):
  - `isSpatialReady(): boolean`
  - `onSpatialLoadError(cb): () => void` — multi-listener; returns an unsubscribe function. Listeners are stored in a `Set` and notified in registration order.
  - `WebSpatialBootError` — `Error` subclass carrying `cause` (the underlying `import()` error) and `attempt` (1-based count). Stored on `lastError` after each failed attempt.
- Facades subscribe to bridge readiness changes via `useSyncExternalStore` (decision 4). Subscription bookkeeping is tracked in `readinessSubscribers`; the bridge notifies all subscribers on `false → true` transitions and (rarely) on `true → false` if a future feature ever resets readiness — v1 only flips once.
- Internal-only symbols MUST be prefixed (e.g. `__internalGetSpatialImpl`) when re-exported from the package, so external consumers cannot accidentally depend on them.
- The bridge does **not** import React. The `useSyncExternalStore` integration lives inside facades, not in the bridge module — keeping the bridge independently testable and SSR-safe.

### 3. Boot helper as the single activation path

- `bootSpatial(): Promise<void>` exported from the default entry.
- In a WebSpatial runtime: call `loadSpatialImpl()`, `await` resolution, return.
- In a non-WebSpatial runtime (`detectSpatialRuntime() === null`) or SSR (`typeof window === 'undefined'`): return immediately without scheduling any network request.
- **Idempotency within an attempt**: concurrent in-flight calls share one promise; after a successful resolution all subsequent calls return an already-resolved promise without scheduling additional work.
- **Retry-on-demand after failure**: after a rejection, the next `bootSpatial()` invocation MAY initiate a fresh `import()` attempt provided no other retry is currently in flight. The bridge increments `attemptCount` on each fresh attempt; the resulting `WebSpatialBootError` carries that 1-based number.
- **Error wrapping**: rejections are always thrown as `WebSpatialBootError` instances with `name === 'WebSpatialBootError'`, `cause` set to the original `import()` error, and `attempt: number`. This gives error reporters and ErrorBoundary code a stable type to filter on.
- **Multi-listener error reporting**: `onSpatialLoadError(cb): () => void` accepts any number of callbacks; returns an unsubscribe. All listeners are notified in registration order on each failure. Successful retries do not replay earlier errors.
- **No SDK timeout (v1)**: the bridge does not race `import()` against a wall-clock timer. Applications that need a timeout can wrap `bootSpatial()` in their own `Promise.race`. We can revisit if real-world deployments report hung-import scenarios.
- **Console warning**: if a facade is rendered while `isSpatialReady() === false` and `bootSpatial()` has never been called, log a one-shot dev-mode warning. Silenced in production builds.

**Why one path, not two**: introducing `<SpatialBoundary>`/Suspense in the same change doubles the activation contract and complicates the hook story. With `bootSpatial()` as the single front door, the application is responsible for awaiting it before render in the recommended path. Late boot is still supported (facades subscribe to bridge readiness — see decision 4), but hooks deliberately do not switch mid-life: the placeholder a component first sees is the implementation it sees forever, switching only on remount. This eliminates Rules-of-Hooks risk without forcing placeholders to mimic real-hook call sequences.

### 4. Facade pattern for components and HOCs

- For every public spatial React component, the default entry exports a facade with the same TypeScript signature.
- Facades subscribe to bridge readiness through `useSyncExternalStore`, so a `false → true` transition automatically re-renders mounted facades to the real implementation:

  ```tsx
  function useSpatialReady(): boolean {
    return useSyncExternalStore(subscribeReadiness, getReadinessSnapshot, getServerReadinessSnapshot)
  }

  export function Model(props: ModelProps) {
    const ready = useSpatialReady()
    const impl = ready ? getSpatialImpl() : null
    if (!impl) return props.fallback ?? defaultFallback(props)
    return <impl.Model {...props} />
  }
  ```

  - `subscribeReadiness(cb)` adds `cb` to the bridge's `readinessSubscribers` Set and returns the unsubscribe.
  - `getServerReadinessSnapshot()` returns `false` so SSR always renders fallback (consistent with the SSR/hydration Requirement).
- HOCs (`withSpatialized2DElementContainer`, `withSpatialMonitor`) return facade components that delegate to the real HOC's output via the bridge. Wrapper-cache contract (same `Comp` → same wrapper reference) is preserved by caching the facade wrapper; the real HOC's own cache lives inside the spatial chunk.
- Per-component default fallback:
  - `Model`, `*Entity`, `Material*`, `*Asset` → `null`
  - `Reality` → a single `<div aria-hidden="true">` that preserves layout (matches the existing `runtime-capabilities` Reality fallback contract; not focusable, not in a11y tree, no children rendered).
  - HOC-wrapped components → render the original `Comp` with passthrough props (the wrapper becomes a no-op identity in web mode).
- Each facade accepts an optional `fallback?: ReactNode` prop that overrides the default. This is documented per component.
- Facades MUST NOT use the `useSpatialReady` subscription to swap hook implementations — only the rendered component subtree. Hooks (decision 5) explicitly do not switch mid-life.

### 5. Hook placeholder protocol

**Public hook surface**: the only spatial hook publicly exported from the default entry today is `useMetrics`. The reality-side hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) are **internal** — `packages/react/src/reality/index.tsx` does not re-export them, and a sweep of the in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) confirms no caller imports them directly. They are consumed only by spatial components (`Reality`, `*Entity`, `Model`).

Therefore:

- The `useEntity*` / `useRealityEvents` / `useForceUpdate` family ships **inside the spatial chunk** alongside the components that consume them. They have no placeholder and are not reachable from the default entry.
- Only `useMetrics` needs a placeholder.

**`useMetrics` placeholder design**:

- Implemented as `packages/react/src/hooks-web/useMetrics.ts`.
- Returns a frozen module-level singleton `{ pointToPhysical, physicalToPoint }` whose two function references are also module-level constants:
  - `pointToPhysical(pt) => pt / 1360`
  - `physicalToPoint(m) => m * 1360`
- The `1/1360` ratio matches today's `noRuntime.ts` web fallback (`packages/react/src/noRuntime.ts`) so consumers see no behavior change on upgrade.
- Both function identities are stable for the lifetime of the page across all renders and across `bootSpatial()` calls. Consumers using these in `useEffect` dependency arrays do not get re-runs.
- SSR-safe: the placeholder does not touch `window`, does not subscribe via `useSyncExternalStore`. The real `useMetrics` (in the spatial chunk) does subscribe; that's fine because by the time the spatial hook is invoked, `bootSpatial()` has resolved and `window` is available.

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

### 6. JSX runtime web variants strip spatial markers

- `jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` currently re-export `react/jsx-runtime` directly, leaving WebSpatial-only props on the element. Plain browsers warn about unknown attributes, and `style.enableXr` leaks through to the DOM.
- New behavior: a small inline helper strips, in this order:
  1. `enable-xr` from props
  2. `enable-xr-monitor` from props
  3. `enableXr` key from `style` if `style` is an object
  4. `__enableXr__` token from `className` if it appears as a whitespace-delimited token
- Mutation policy: **mutate the props object in place**, matching the existing AVP-side `replaceToSpatialPrimitiveType` behavior (see `packages/react/src/jsx/jsx-shared.ts`). Both runtimes treat props as freshly constructed by React's JSX transform; this is the convention already in use.
- After stripping, delegate to `react/jsx-runtime`'s `jsx`, `jsxs`, `jsxDEV`, `Fragment` exports unchanged.

### 7. Spatial runtime detection

- A single `detectSpatialRuntime(): 'visionos' | 'picoos' | null` helper in `runtime/detect.ts`, thin wrapper over the existing core-sdk runtime snapshot.
- Synchronous; no `await`, no network. Safe to call during SSR (returns `null` when `window` is unavailable).
- Called only inside `bootSpatial()` (and inside a one-shot warning on first facade render in dev mode). Facades themselves never call `detectSpatialRuntime()` per render — they only consult the bridge.
- The result is treated as stable for the page lifetime, consistent with the existing `runtime-capabilities` decisions.

### 8. tsup configuration changes

- `packages/react/tsup.config.ts` reduces from four entries to three:
  - Main entry: `src/index.ts` → `dist/index.js`
  - Spatial entry: `src/spatial/index.ts` → `dist/spatial.js` (separate output file so dynamic `import('./spatial')` resolves to a distinct chunk that downstream bundlers can keep separate)
  - JSX runtime entries: `src/jsx/jsx-runtime.ts`, `src/jsx/jsx-dev-runtime.ts` (web variants only — there is only one runtime path now) → `dist/jsx/*.js`
- Delete the `dist/web` and `dist/default` configurations entirely.
- Delete the `XR_ENV` lines from the banners; only `react-sdk-version` remains.
- The dynamic `import('../spatial')` inside `bridge.ts` resolves at runtime to `@webspatial/react-sdk/spatial` (the published subpath), so consumer bundlers see a real subpath import and can split the chunk.
- The spatial entry has `noExternal` for any spatial-only internal deps but keeps `@webspatial/core-sdk` and `react` external (consumer-provided).

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
3. In the application entry (e.g. `main.tsx`), wrap rendering in `await bootSpatial()`:

   ```tsx
   import { bootSpatial } from '@webspatial/react-sdk'

   await bootSpatial()
   ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
   ```

4. If any facade prop is missing a sensible default fallback, pass `fallback={<Poster />}` or similar.

**For applications using the old subpaths directly:**

- `import { ... } from '@webspatial/react-sdk/web'` → `import { ... } from '@webspatial/react-sdk'`
- `import { ... } from '@webspatial/react-sdk/default'` → `import { ... } from '@webspatial/react-sdk'`

**For the in-house repo workflow:**

- `apps/test-server`, `packages/autoTest`, `tests/ci-test` are not modified in this change. They alias `@webspatial/react-sdk` to source, which now resolves to the new lean `src/index.ts`. They will continue to work but will *not* exercise the dynamic-import code-split path (their bundlers inline `src/spatial/index.ts` because it is a relative aliased path inside a single source tree). A follow-up change will migrate them.

**Rollback:**

- Revert the SDK to the previous version. Applications that already removed `@webspatial/vite-plugin` will need to re-add it (and re-add the `XR_ENV=avp vite build` step) to keep the old `dist/default` semantics. Cleaner rollback path: avoid releasing the new SDK to production until the migration guide is published and at least one downstream app has migrated successfully.

## Open Questions

- Final number for the gzip size budget. 8KB is the design target; the test will be added with the *measured* number once the implementation lands, with an assertion comment that the design target is 8KB.
- Whether `<SpatialBoundary>` should be added in a follow-up change. Not required by current product needs; track as a separate issue if user feedback shows demand.
- Whether to expose `getBootStatus(): 'idle' | 'loading' | 'ready' | 'failed'` (a more granular state-machine query) in addition to `isSpatialReady()`. Skipped in v1 — `isSpatialReady()` plus rejection of `bootSpatial()` plus `onSpatialLoadError(cb)` covers known use cases; revisit if applications request finer state.
- Whether `bootSpatial()` should accept a `{ timeoutMs }` option. v1 says no (applications can `Promise.race` themselves); revisit if real-world deployments report hung-import scenarios.
- How aggressively to tighten the size budget after the initial release. A reasonable cadence is to revisit once per minor release based on actual `dist/index.js` measurements.
