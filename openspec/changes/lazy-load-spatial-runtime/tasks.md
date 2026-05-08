## 1. Spec alignment and contract pinning

- [ ] 1.1 Pre-implementation review checkpoint: confirm `specs/spatial-lazy-load/spec.md` covers every public spatial component, HOC, and hook in the current default entry; the per-component default fallback table (Component facades Requirement) and the public-hook table (Hook placeholders Requirement) are both normative within the spec and MUST be referenced from the README and migration guide (§10) rather than maintained as separate addenda
- [ ] 1.2 Confirm `specs/runtime-capabilities/spec.md` delta is consistent with `core-sdk` `getRuntime()` / `Spatial.runInSpatialWeb()` semantics; in particular, the synchronous-snapshot guarantee MUST hold without code changes in core-sdk for v1

## 2. Runtime building blocks (bridge / boot / detect)

- [ ] 2.1 Add `packages/react/src/runtime/detect.ts` exposing `detectSpatialRuntime(): 'visionos' | 'picoos' | null`; SSR-safe, synchronous; thin wrapper over `core-sdk` snapshot
- [ ] 2.2 Add `packages/react/src/runtime/bridge.ts` with module-level singleton: `getSpatialImpl()`, `loadSpatialImpl()`, `isSpatialReady()`, `onSpatialLoadError(cb)`; dynamic import target is `@webspatial/react-sdk/spatial`. Bridge MUST also expose internal readiness subscription primitives (`__internalSubscribeReadiness`, `__internalGetReadinessSnapshot`) backing a `readinessSubscribers: Set<() => void>`; on `false → true` (and reverse if ever applicable) transitions all subscribers MUST be notified. These primitives are consumed by `runtime/useSpatialReady.ts` (§4.1) and MUST NOT be part of the documented public API
- [ ] 2.3 Add `packages/react/src/runtime/boot.ts` exposing `bootSpatial(): Promise<void>`; web/SSR mode resolves immediately without scheduling any dynamic import; spatial mode awaits `loadSpatialImpl()`. Implements idempotency-within-attempt + retry-on-demand-after-failure semantics per the `bootSpatial` Requirement
- [ ] 2.4 Add the `WebSpatialBootError` class (e.g. `packages/react/src/runtime/errors.ts` or co-located with bridge): `Error` subclass; instances satisfy `name === 'WebSpatialBootError'`, set `cause` to the underlying `import()` error, expose `attempt: number` (1-based). Re-export from default entry as part of the public API surface
- [ ] 2.5 Unit tests for the bridge: SSR safety (no `window`), concurrent loads share one promise, load failure invokes every registered `onSpatialLoadError` listener exactly once and leaves `isSpatialReady() === false`, `__internalSubscribeReadiness` notifies subscribers in registration order on `false → true` transitions
- [ ] 2.6 Unit tests for `bootSpatial`: idempotent across awaits, no network in non-WebSpatial browser, resolves only after spatial chunk lands in spatial mode (use a mocked dynamic import); rejection is wrapped in `WebSpatialBootError` carrying `cause` and 1-based `attempt`; retry after rejection initiates a fresh `import()` and increments `attempt`

## 3. Spatial implementation subpath

- [ ] 3.1 Create `packages/react/src/spatial/index.ts` as the consolidated spatial implementation barrel
- [ ] 3.2 Move (or re-export from existing locations) the real implementations into the spatial barrel: `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `PortalSpatializedContainer`, `SpatializedContainer`, `StandardSpatializedContainer`, real `withSpatialized2DElementContainer`, real `withSpatialMonitor`, `SpatialMonitor`, real `Model`, `Reality` and all `*Entity` components, `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset`, real reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useRealityEvents`, `useEntityId`, `useForceUpdate`), real `useMetrics`
- [ ] 3.3 Verify the spatial barrel does not import the bridge or any facade (one-way dependency: bridge → spatial, never the other way)

## 4. Facade components

- [ ] 4.1 Add `packages/react/src/runtime/useSpatialReady.ts` exporting the `useSpatialReady(): boolean` public hook. The file MUST begin with `'use client'`. Internally: decide once per component instance via `useState` initializer reading `detectSpatialRuntime()`; non-WebSpatial branches use a module-level no-op subscriber + a module-level `alwaysFalse` constant function; WebSpatial branches subscribe via the bridge. The same `alwaysFalse` MUST be passed as `getServerSnapshot` so it is referentially stable (per the SSR Requirement). Re-export from default entry. Both facades and user wrappers use this hook
- [ ] 4.2 Add `packages/react/src/facades/Model.tsx` — facade matching real `Model` props (`ModelProps`). Default fallback: render `<model ref={ref} {...modelProps}/>` after stripping spatial-only event props (`onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`) and `spatialEventOptions`. **Do NOT accept** a `props.fallback` prop in v1
- [ ] 4.3 Add facade modules with documented per-component default fallback (per spec table) for: `Reality`, `BoxEntity`/`Box`, `SphereEntity`/`Sphere`, `ConeEntity`/`Cone`, `CylinderEntity`/`Cylinder`, `PlaneEntity`/`Plane`, `ModelEntity`, `AttachmentEntity`, `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset`, `SceneGraph`/`World`. None accept a `fallback` prop
- [ ] 4.4 Implement `Reality` facade fallback as a single `<div aria-hidden="true" ref>` host preserving className/style and excluding children (matches existing `runtime-capabilities` Reality fallback contract)
- [ ] 4.5 Add HOC facades for `withSpatialized2DElementContainer` and `withSpatialMonitor`; cache wrapper components per input `Comp` reference (raw identity, no normalization) to preserve identity contract; in fallback mode the wrapper renders `<Comp {...passthrough} ref={ref}/>` (passthrough). Wrapper `displayName` follows the `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` convention
- [ ] 4.6 Set facade `displayName` to match the public exported name (`Model`, `Reality`, `BoxEntity`, etc.). Do **not** wrap any facade in `React.memo`. Every facade source file MUST begin with `'use client'` (required for React Server Components compatibility — facades use the `useSpatialReady` hook). Verify the directive is preserved in the published `dist/` files (tsup / esbuild preserve top-level string directives by default)
- [ ] 4.7 Add a one-shot dev-mode console warning helper used by facades when first rendered with `isSpatialReady() === false` and `bootSpatial()` has never been called. Gate the warning on `detectSpatialRuntime() !== null` (do not warn in plain web). Production builds tree-shake the warning code
- [ ] 4.8 Audit each facade implementation: assert no static or dynamic import from `src/spatial/`, no `new Spatial()` / `new SpatialScene()` / similar core-sdk runtime constructions, no top-level access to `@webspatial/core-sdk` runtime values. Codify this as a unit test that scans `dist/index.js` for forbidden symbols
- [ ] 4.9 Unit tests per facade: renders documented per-component fallback when `isSpatialReady()` is `false`; mounts real implementation when bridge populated (use a mocked spatial namespace); ref forwarding works in both modes; `displayName` matches public name
- [ ] 4.10 Unit test for `useSpatialReady`: in plain web (`detectSpatialRuntime() === null`), the hook does NOT register a subscription with the bridge (verify via spy on `__internalSubscribeReadiness`); always returns `false`. In WebSpatial runtime, registers a subscription and reflects bridge readiness flips

## 5. Hook placeholders

- [ ] 5.1 Add `packages/react/src/hooks-web/useMetrics-placeholder.ts` (no React hooks, no `'use client'` directive — pure constants module). Export the frozen module-level singleton `{ pointToPhysical, physicalToPoint }` whose two function references are also module-level constants: `pointToPhysical(pt) => pt / 1360`, `physicalToPoint(m) => m * 1360`. SSR-safe (no `window` access, no `useSyncExternalStore` subscription)
- [ ] 5.2 Add `packages/react/src/hooks-web/useMetrics.ts` (the public default-entry hook). The file MUST begin with `'use client'`. Implement selection between placeholder and real implementation **once per component instance** via a `useState` initializer reading `isSpatialReady()` at first render; never flips for that instance's lifetime. Import the placeholder from §5.1 and the real hook lazily via `getSpatialImpl()`
- [ ] 5.3 Confirm internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) are NOT exported from `src/index.ts` or `src/reality/index.tsx` (current state), and ensure they ship inside `src/spatial/` along with the components that consume them. Add a unit test that asserts these names are not present in `dist/index.js`
- [ ] 5.4 Unit tests for `useMetrics` placeholder: returns documented constants (assertion-grade values: `pointToPhysical(0) === 0`, `pointToPhysical(1360) === 1`, `physicalToPoint(1) === 1360`); function identities `===` stable across renders; SSR invocation via `renderToString` does not throw and returns the same constants
- [ ] 5.5 Document in `packages/react/README.md` and/or migration guide: `useMetrics` resolves to placeholder unless `bootSpatial()` is awaited before the consuming component first mounts; remount required to switch to real implementation

## 6. JSX runtime: unify, strip, and wrap with facade HOCs

- [ ] 6.1 **Delete** `packages/react/src/jsx/jsx-runtime.web.ts` and `packages/react/src/jsx/jsx-dev-runtime.web.ts`. The single unified runtime serves all environments (plain web, AVP, SSR, RSC); a separate strip-only sibling is no longer needed
- [ ] 6.2 Update `packages/react/src/jsx/jsx-shared.ts` so that `withSpatialized2DElementContainer`, `withSpatialMonitor`, and `Model` resolve to the **facade** versions (already exported from the default entry by §4). The `replaceToSpatialPrimitiveType` function performs strip + wrap-with-facade in a single pass; the `if (type === Model) return type;` bypass is preserved
- [ ] 6.3 Fix the style sub-object mutation bug in `replaceToSpatialPrimitiveType`: instead of `delete propsObject.style.enableXr` (which mutates the user-supplied / memoized / `Object.freeze`d style object), spread-clone the style and reassign: `propsObject.style = (({ enableXr, ...rest }) => rest)(propsObject.style)`. Top-level `props` mutation (delete `enable-xr`, reassign `className`) remains acceptable because React creates a fresh `props` object per call
- [ ] 6.4 Cover all JSX call sites: `jsx`, `jsxs`, `jsxDEV`. Confirm `Fragment` re-export is preserved
- [ ] 6.5 Confirm `props.class` (HTML attribute spelling) is **not** recognized as a marker source — only `props.className` is checked. Document this in code comment
- [ ] 6.6 Unit tests covering: (a) each marker independently triggers strip + facade wrap; (b) combined markers are all stripped; (c) `props.style` reference is unchanged after the JSX call when `enableXr` was present (and after `Object.freeze`d input); (d) `className` ordering preserved with `__enableXr__` removed; (e) `props.class` containing `__enableXr__` is **not** treated as a marker; (f) `Model` type bypasses both strip and wrap; (g) absent markers cause zero allocation churn (no `style` clone, no className split); (h) SSR invocation produces identical strip + wrap behavior

## 7. Default entry rewrite

- [ ] 7.1 Rewrite `packages/react/src/index.ts` to export only: `WebSpatialRuntime`, `WebSpatialRuntimeError`, `CapabilityKey`, `enableDebugTool`, `convertCoordinate`, `useMetrics` (the placeholder-or-real selector defined in §5.2), all facades, `bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`, JSX-related types, `version`. Internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) MUST NOT be exported here. The `props.fallback` prop is intentionally NOT part of the facade public API in v1
- [ ] 7.2 Remove the top-level side-effect `if (typeof window !== 'undefined') initPolyfill()` from the default entry; polyfill installation moves into the spatial chunk's bootstrap (executed when the chunk loads)
- [ ] 7.3 Verify no static import path from `src/index.ts` reaches `src/spatial/`; only the bridge's dynamic `import()` may
- [ ] 7.4 The self-import in `packages/react/src/jsx/jsx-shared.ts` (`from '@webspatial/react-sdk'`) MUST resolve to the default entry's facade exports for `withSpatialized2DElementContainer`, `withSpatialMonitor`, `Model` (already the case after §4 lands). Reconcile any `@ts-ignore` comments and ensure the import path is no longer marked external in the JSX bundle's tsup config (the facades are part of the same default-entry static module graph)

## 8. Build configuration (tsup) and package exports

- [ ] 8.1 Replace `packages/react/tsup.config.ts` with a configuration that produces three outputs: main entry (`src/index.ts` → `dist/index.js`), spatial entry (`src/spatial/index.ts` → `dist/spatial.js`), JSX runtime entries (`src/jsx/jsx-runtime.ts`, `src/jsx/jsx-dev-runtime.ts` → `dist/jsx/*.js`, single unified runtime); delete all `dist/web` / `dist/default` / `*.web.*` configurations
- [ ] 8.2 Remove `XR_ENV` writes from the tsup banner; only `react-sdk-version` remains
- [ ] 8.3 Update `packages/react/package.json` `exports`:
  - `'.'` → `./dist/index.js`
  - `./jsx-runtime` → `./dist/jsx/jsx-runtime.js` (single mapping; **drop** the `react-server` conditional sub-key)
  - `./jsx-dev-runtime` → `./dist/jsx/jsx-dev-runtime.js` (single mapping; **drop** the `react-server` conditional sub-key)
  - `./spatial` → `./dist/spatial.js`
  - **Hard remove** `./web`, `./default`, `./web/*`, `./default/*` subpaths
- [ ] 8.4 Update `packages/react/package.json` `main` and `types` to point at the new `dist/index.js` and `dist/index.d.ts`
- [ ] 8.5 Verify `tsup` emits `dist/spatial.js` as a separate file (not inlined into `dist/index.js`) and that the dynamic `import()` from the bridge resolves to the published subpath
- [ ] 8.6 Update `packages/react/tsconfig.json` `paths` to remove any `@webspatial/react-sdk/web` or `/default` entries; ensure `@webspatial/react-sdk` resolves to `./src` (unchanged)
- [ ] 8.7 Declare the `peerDependencies` contract in `packages/react/package.json`: `react: ">=18.0"`, `react-dom: ">=18.0"` (matches the `useSyncExternalStore` baseline required by `useSpatialReady` per the "Plugin-free integration" Requirement). Verify `peerDependenciesMeta` reflects whether either peer is optional (today both are marked optional; revisit if RSC contracts require otherwise)

## 9. Size budget enforcement

- [ ] 9.1 Add `packages/react/src/__tests__/size-budget.test.ts` (or similar location) that builds the package and asserts gzipped `dist/index.js` size is at most 8192 bytes; if first measurement exceeds 8KB, land at measured size with a TODO and follow-up to tighten
- [ ] 9.2 Add a structural assertion in the same test that scans `dist/index.js` for spatial-only identifier names (`Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `RealityRoot`, etc.) and fails if any appear
- [ ] 9.3 Hook the size-budget test into `pnpm test` for `packages/react` so CI fails on regression
- [ ] 9.4 Print `dist/spatial.js` size in the test output as informational telemetry

## 10. Documentation and migration guide

- [ ] 10.1 Add a "Web-first + spatial enhancement" section to `packages/react/README.md` covering: `bootSpatial()` quick-start, the per-component default fallback table, hook fallback semantics, the dev-mode warning behavior (including its WebSpatial-runtime-only gate), and a worked example of a user-side wrapper using `useSpatialReady()` for custom web rendering (e.g. poster-image override for `Model`)
- [ ] 10.2 Add `docs/migration/lazy-load-spatial-runtime.md` covering: removed subpaths (`/web`, `/default`); required removal/uninstall of `@webspatial/vite-plugin`; mandatory `await bootSpatial()` in the application entry; SSR / hydration guidance; per-component fallback table; "how to customize web rendering" recipe showing the `useSpatialReady()` wrapper pattern
- [ ] 10.3 Update public API documentation for each spatial component to describe its documented web fallback behavior. **Do NOT** document a `fallback` prop — it is intentionally not part of the v1 API
- [ ] 10.4 Add a CHANGELOG entry marked **BREAKING** at the top, summarizing the subpath removal, the plugin retirement, the boot requirement, and the public API list (`bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`)
- [ ] 10.5 Maintain a "Bundler compatibility" section in `docs/migration/lazy-load-spatial-runtime.md` (and link from `packages/react/README.md`) listing: the three normative capability requirements (ESM, `exports`, dynamic-import code-splitting); the tested-targets list (Vite ≥ 4, Webpack ≥ 5, Rollup ≥ 3, Rspack ≥ 1, esbuild ≥ 0.18 + splitting); Next.js App Router / Pages Router as canonical framework targets; the out-of-scope list (Turbopack, Module Federation, Webpack 4, CommonJS-only consumers); the esbuild splitting note (function correct without `splitting: true`, size benefit lost)

## 11. Cross-repo coordination (non-blocking)

- [ ] 11.1 Open a tracking issue in `webspatial/web-builder-plugins` announcing `@webspatial/vite-plugin` deprecation due to SDK lazy-load architecture
- [ ] 11.2 Recommend the plugin ship a final version that no-ops gracefully (alias / outDir / base ignored, deprecation warning logged once)
- [ ] 11.3 Cross-link the SDK migration guide from the plugin's README

## 12. Follow-ups (non-blocking)

- [ ] 12.1 Migrate `apps/test-server` to consume `dist` and call `bootSpatial()`; switch from bare `esbuild` to a build pipeline that supports code splitting, or accept inlined spatial chunk
- [ ] 12.2 Migrate `packages/autoTest` to use `bootSpatial()` and add Puppeteer cases asserting (a) web mode never requests `dist/spatial.js`, (b) AVP mode requests it exactly once
- [ ] 12.3 Migrate `tests/ci-test` to consume `dist` and validate spatial behavior in the AVP simulator with the new boot path
- [ ] 12.4 Evaluate splitting the spatial chunk further (reality / container / model) once real-world load profiles are measured
- [ ] 12.5 Evaluate adding a `<SpatialBoundary>` Suspense-style integration in a future change if user feedback shows demand
- [ ] 12.6 Add a minimal Webpack 5 (or Rspack) consumer fixture under `tests/` that builds the SDK and asserts (a) the spatial chunk emits as a separate output, (b) `bootSpatial()` triggers a chunk fetch only in spatial runtime, (c) the build succeeds without `@webspatial/vite-plugin`. Vite is already covered by `packages/autoTest`; this fixture closes the Webpack-side gap declared in the "Plugin-free integration" Requirement
- [ ] 12.7 Investigate Next.js Turbopack compatibility (`next dev --turbo`, `next build --turbo`); if compatible, lift it from "out of scope" to a tested target in a follow-up change. If incompatible, document the specific incompatibility (e.g. dynamic-import quirk, `'use client'` handling) and link the upstream Next.js / Turbopack issue
- [ ] 12.8 Investigate Module Federation host-shared SDK behavior (single bridge singleton across federated hosts vs per-host singletons); if there is real consumer demand, write a fixture and lift from "out of scope" in a follow-up change

## 13. SSR / hydration validation

- [ ] 13.1 Build-output assertion: scan every published facade file in `dist/` and assert each begins with the `'use client'` directive (preserved by tsup / esbuild). Same assertion for `dist/jsx/...` only if those files use hooks (they do not in v1; verify they do not carry the directive). `dist/runtime/useSpatialReady.js` and `dist/hooks-web/useMetrics.js` MUST carry the directive; `dist/hooks-web/useMetrics-placeholder.js`, `dist/runtime/bridge.js`, `dist/runtime/boot.js`, `dist/runtime/detect.js`, `dist/runtime/errors.js` MUST NOT carry it
- [ ] 13.2 Unit test (`renderToString`): render a tree containing `Model`, `Reality`, `BoxEntity`, and a component using `useMetrics`. Assert (a) no spatial chunk is requested (mock `import()` to detect calls), (b) facade outputs match documented per-component fallback HTML, (c) any `onSpatialLoadError` listener registered before SSR is NOT invoked, (d) `bootSpatial()` invoked during the render resolves synchronously without scheduling work
- [ ] 13.3 Unit test (`renderToPipeableStream` / `renderToReadableStream`): same assertions as §13.2 but exercising the streaming pipeline; confirm no Suspense boundary is auto-introduced by facades and no chunk is requested across all stream chunks
- [ ] 13.4 Unit test (`getServerSnapshot` stability): spy on the `useSyncExternalStore` `getServerSnapshot` argument used by `useSpatialReady`; assert it is the same module-level reference across renders and within a single SSR pass; assert it returns `false` consistently
- [ ] 13.5 Integration test (hydration round-trip — boot AFTER hydrate): `renderToString` → `hydrateRoot` (without `await bootSpatial()`) → assert (a) first client render produces DOM identical to server render (use `getByText` / serialized DOM), (b) hydration completes without React hydration-mismatch warnings (intercept `console.error`), (c) call `bootSpatial()` with mocked successful import → next render commits real spatial implementations and the swap is NOT attributed to a hydration mismatch
- [ ] 13.6 Integration test (hydration round-trip — boot BEFORE hydrate): `renderToString` → `await bootSpatial()` (mocked successful import) → `hydrateRoot` → assert (a) hydration first render uses `getServerSnapshot`'s `false` value (facade renders fallback) → matches server render with no mismatch, (b) post-hydration commit swaps to real implementations, (c) no hydration-mismatch warning is logged
- [ ] 13.7 Integration test (RSC-style client-component import): verify that facade source files compile under a Next.js App Router-style RSC build configuration without "hooks in Server Component" errors. May be exercised via a minimal fixture or via static analysis of the `'use client'` directive presence (covered by §13.1)
- [ ] 13.8 Hook the SSR test suite into `pnpm test` for `packages/react` so CI fails on regression

## 14. Stateless utility validation

- [ ] 14.1 Unit test (`initScene` graceful): in a non-WebSpatial / SSR / pre-boot environment, calling `initScene('main', cb)` returns `undefined` without side effects, without scheduling any dynamic import, and without throwing
- [ ] 14.2 Unit test (`convertCoordinate` graceful): in a non-WebSpatial / pre-boot environment, calling `convertCoordinate({ x: 1, y: 2, z: 3 }, { from, to })` resolves with the input position unchanged (referential equality) and does NOT throw; allow at most one `console.warn` per page lifetime per the `runtime-capabilities` "Unsupported behavior contracts" MODIFIED Requirement
- [ ] 14.3 Unit test (`enableDebugTool` SSR safe): calling `enableDebugTool()` under `renderToString` (no `window`) returns immediately without throwing and without side effects; in a WebSpatial runtime it attaches `inspectCurrentSpatialScene` and `getSpatialized2DElement` to `window`
- [ ] 14.4 Unit test (`WebSpatialRuntime.supports` independent of bootSpatial): without ever calling `bootSpatial()`, `WebSpatialRuntime.supports('Model')` returns synchronously and reflects the `core-sdk` capability table; in a non-WebSpatial browser the result is `false` per the `runtime-capabilities` ADDED Requirement
- [ ] 14.5 Unit test (`getAbsoluteUrl` SSR safe + pure): `getAbsoluteUrl('a/b')` under `typeof window === 'undefined'` returns `'a/b'` unchanged; in a browser context with `window.location.href === 'http://localhost/x/'` returns `'http://localhost/a/b'`
- [ ] 14.6 Build-output assertion (Group C type-only re-exports vanish): the published `dist/index.js` MUST NOT contain runtime references to type-only names (`SpatializedElementRef`, `EntityRef`, `ModelRef`, `ModelProps`, `CapabilityKey`); only their `dist/index.d.ts` declarations should mention them
- [ ] 14.7 Build-output assertion (Group B/C size budget membership): the §9.1 size-budget measurement of `dist/index.js` includes the implementations of `initScene`, `convertCoordinate`, `enableDebugTool`, `WebSpatialRuntime.supports`, `getAbsoluteUrl`, `SSRProvider`, `version`, `WebSpatialRuntimeError` re-export — they MUST be measured as part of the 8KB gzip cap, not split into a separate chunk
- [ ] 14.8 Documentation: README and migration guide cross-reference the "Stateless utility APIs and pure re-exports" Requirement so consumers understand which APIs do NOT require `bootSpatial()` and behave correctly in plain web by graceful degradation
