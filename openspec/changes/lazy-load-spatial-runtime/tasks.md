## 1. Spec alignment and contract pinning

- [ ] 1.1 Confirm `specs/spatial-lazy-load/spec.md` covers every public spatial component, HOC, and hook in the current default entry; reconcile any gaps before implementation starts
- [ ] 1.2 Confirm `specs/runtime-capabilities/spec.md` delta is consistent with `core-sdk` getRuntime / `Spatial.runInSpatialWeb` semantics
- [ ] 1.3 Document the per-component default fallback table (component → fallback render output) as an addendum to `proposal.md` or a referenced doc, used by both spec scenarios and tests
- [ ] 1.4 Document the per-hook default-value table (hook → return value, ref/subscriber semantics) as an addendum used by both spec scenarios and tests

## 2. Runtime building blocks (bridge / boot / detect)

- [ ] 2.1 Add `packages/react/src/runtime/detect.ts` exposing `detectSpatialRuntime(): 'visionos' | 'picoos' | null`; SSR-safe, synchronous; thin wrapper over `core-sdk` snapshot
- [ ] 2.2 Add `packages/react/src/runtime/bridge.ts` with module-level singleton: `getSpatialImpl()`, `loadSpatialImpl()`, `isSpatialReady()`, `onSpatialLoadError(cb)`; dynamic import target is `@webspatial/react-sdk/spatial`
- [ ] 2.3 Add `packages/react/src/runtime/boot.ts` exposing `bootSpatial(): Promise<void>`; web mode resolves immediately, spatial mode awaits `loadSpatialImpl()`
- [ ] 2.4 Unit tests for the bridge: SSR safety (no `window`), concurrent loads share one promise, load failure invokes `onSpatialLoadError` once and leaves `isSpatialReady() === false`
- [ ] 2.5 Unit tests for `bootSpatial`: idempotent across awaits, no network in non-WebSpatial browser, resolves only after spatial chunk lands in spatial mode (use a mocked dynamic import)

## 3. Spatial implementation subpath

- [ ] 3.1 Create `packages/react/src/spatial/index.ts` as the consolidated spatial implementation barrel
- [ ] 3.2 Move (or re-export from existing locations) the real implementations into the spatial barrel: `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `PortalSpatializedContainer`, `SpatializedContainer`, real `withSpatialized2DElementContainer`, real `withSpatialMonitor`, real `Model`, `Reality` and all `*Entity` components, `UnlitMaterial`, `ModelAsset`, real reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useRealityEvents`, `useEntityId`), real `useMetrics`
- [ ] 3.3 Verify the spatial barrel does not import the bridge or any facade (one-way dependency: bridge → spatial, never the other way)

## 4. Facade components

- [ ] 4.1 Add `packages/react/src/runtime/useSpatialReady.ts` exporting the `useSpatialReady(): boolean` public hook. Internally: decide once per component instance via `useState` initializer reading `detectSpatialRuntime()`; non-WebSpatial branches use no-op subscriber + `() => false` snapshot; WebSpatial branches subscribe via the bridge. Re-export from default entry. Both facades and user wrappers use this hook
- [ ] 4.2 Add `packages/react/src/facades/Model.tsx` — facade matching real `Model` props (`ModelProps`). Default fallback: render `<model ref={ref} {...modelProps}/>` after stripping spatial-only event props (`onSpatialTap`, `onSpatialDragStart`, `onSpatialDrag`, `onSpatialDragEnd`, `onSpatialRotate`, `onSpatialRotateEnd`, `onSpatialMagnify`, `onSpatialMagnifyEnd`) and `spatialEventOptions`. **Do NOT accept** a `props.fallback` prop in v1
- [ ] 4.3 Add facade modules with documented per-component default fallback (per spec table) for: `Reality`, `BoxEntity`/`Box`, `SphereEntity`/`Sphere`, `ConeEntity`/`Cone`, `CylinderEntity`/`Cylinder`, `PlaneEntity`/`Plane`, `ModelEntity`, `AttachmentEntity`, `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset`, `SceneGraph`/`World`. None accept a `fallback` prop
- [ ] 4.4 Implement `Reality` facade fallback as a single `<div aria-hidden="true" ref>` host preserving className/style and excluding children (matches existing `runtime-capabilities` Reality fallback contract)
- [ ] 4.5 Add HOC facades for `withSpatialized2DElementContainer` and `withSpatialMonitor`; cache wrapper components per input `Comp` reference (raw identity, no normalization) to preserve identity contract; in fallback mode the wrapper renders `<Comp {...passthrough} ref={ref}/>` (passthrough). Wrapper `displayName` follows the `WithSpatialized2DElementContainer(<inner>)` / `WithSpatialMonitor(<inner>)` convention
- [ ] 4.6 Set facade `displayName` to match the public exported name (`Model`, `Reality`, `BoxEntity`, etc.). Do **not** wrap any facade in `React.memo`
- [ ] 4.7 Add a one-shot dev-mode console warning helper used by facades when first rendered with `isSpatialReady() === false` and `bootSpatial()` has never been called. Gate the warning on `detectSpatialRuntime() !== null` (do not warn in plain web). Production builds tree-shake the warning code
- [ ] 4.8 Audit each facade implementation: assert no static or dynamic import from `src/spatial/`, no `new Spatial()` / `new SpatialScene()` / similar core-sdk runtime constructions, no top-level access to `@webspatial/core-sdk` runtime values. Codify this as a unit test that scans `dist/index.js` for forbidden symbols
- [ ] 4.9 Unit tests per facade: renders documented per-component fallback when `isSpatialReady()` is `false`; mounts real implementation when bridge populated (use a mocked spatial namespace); ref forwarding works in both modes; `displayName` matches public name
- [ ] 4.10 Unit test for `useSpatialReady`: in plain web (`detectSpatialRuntime() === null`), the hook does NOT register a subscription with the bridge (verify via spy on `__internalSubscribeReadiness`); always returns `false`. In WebSpatial runtime, registers a subscription and reflects bridge readiness flips

## 5. Hook placeholders

- [ ] 5.1 Add `packages/react/src/hooks-web/useMetrics.ts`. Export a frozen module-level singleton `{ pointToPhysical, physicalToPoint }` whose two function references are also module-level constants: `pointToPhysical(pt) => pt / 1360`, `physicalToPoint(m) => m * 1360`. SSR-safe (no `window` access, no `useSyncExternalStore` subscription)
- [ ] 5.2 Update the default-entry `useMetrics` re-export so that selection between placeholder and real implementation happens **once per component instance** (e.g. `useState` initializer reading `isSpatialReady()` at first render) and never flips for that instance's lifetime
- [ ] 5.3 Confirm internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) are NOT exported from `src/index.ts` or `src/reality/index.tsx` (current state), and ensure they ship inside `src/spatial/` along with the components that consume them. Add a unit test that asserts these names are not present in `dist/index.js`
- [ ] 5.4 Unit tests for `useMetrics` placeholder: returns documented constants (assertion-grade values: `pointToPhysical(0) === 0`, `pointToPhysical(1360) === 1`, `physicalToPoint(1) === 1360`); function identities `===` stable across renders; SSR invocation via `renderToString` does not throw and returns the same constants
- [ ] 5.5 Document in `packages/react/README.md` and/or migration guide: `useMetrics` resolves to placeholder unless `bootSpatial()` is awaited before the consuming component first mounts; remount required to switch to real implementation

## 6. JSX runtime web variants strip spatial markers

- [ ] 6.1 Update `packages/react/src/jsx/jsx-runtime.web.ts` and `jsx-dev-runtime.web.ts` to strip `enable-xr`, `enable-xr-monitor`, `style.enableXr`, and the `__enableXr__` `className` token from props before delegating to `react/jsx-runtime`
- [ ] 6.2 Mutate the props object in place (matching the existing AVP-side `replaceToSpatialPrimitiveType` convention in `jsx-shared.ts`); add a comment explaining the convention
- [ ] 6.3 Cover `jsx`, `jsxs`, and `jsxDEV` call sites; verify `Fragment` re-export is preserved
- [ ] 6.4 Unit tests: each marker is stripped independently; combined markers are all stripped; non-marker props pass through unchanged; absent markers are a no-op (no allocation churn)

## 7. Default entry rewrite

- [ ] 7.1 Rewrite `packages/react/src/index.ts` to export only: `WebSpatialRuntime`, `WebSpatialRuntimeError`, `CapabilityKey`, `enableDebugTool`, `convertCoordinate`, `useMetrics` (the placeholder-or-real selector defined in §5.2), all facades, `bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`, JSX-related types, `version`. Internal reality hooks (`useEntity`, `useEntityRef`, `useEntityTransform`, `useEntityEvent`, `useEntityId`, `useRealityEvents`, `useForceUpdate`) MUST NOT be exported here. The `props.fallback` prop is intentionally NOT part of the facade public API in v1
- [ ] 7.2 Remove the top-level side-effect `if (typeof window !== 'undefined') initPolyfill()` from the default entry; polyfill installation moves into the spatial chunk's bootstrap (executed when the chunk loads)
- [ ] 7.3 Verify no static import path from `src/index.ts` reaches `src/spatial/`; only the bridge's dynamic `import()` may
- [ ] 7.4 Update `packages/react/src/jsx/jsx-shared.ts` to reflect that the AVP-side runtime no longer needs to externally import facades (the JSX-runtime web variant is now the only path; AVP-side spatializing happens via real components from `src/spatial/`); reconcile the existing self-import of `@webspatial/react-sdk` accordingly

## 8. Build configuration (tsup) and package exports

- [ ] 8.1 Replace `packages/react/tsup.config.ts` with a configuration that produces three outputs: main entry (`src/index.ts` → `dist/index.js`), spatial entry (`src/spatial/index.ts` → `dist/spatial.js`), JSX runtime entries (`src/jsx/jsx-runtime.ts`, `src/jsx/jsx-dev-runtime.ts` → `dist/jsx/*.js`); delete all `dist/web` and `dist/default` configurations
- [ ] 8.2 Remove `XR_ENV` writes from the tsup banner; only `react-sdk-version` remains
- [ ] 8.3 Update `packages/react/package.json` `exports` to: `'.'`, `./jsx-runtime`, `./jsx-dev-runtime`, `./spatial`; **hard remove** `./web`, `./default`, and the `./web/*` and `./default/*` subpaths
- [ ] 8.4 Update `packages/react/package.json` `main` and `types` to point at the new `dist/index.js` and `dist/index.d.ts`
- [ ] 8.5 Verify `tsup` emits `dist/spatial.js` as a separate file (not inlined into `dist/index.js`) and that the dynamic `import()` from the bridge resolves to the published subpath
- [ ] 8.6 Update `packages/react/tsconfig.json` `paths` to remove any `@webspatial/react-sdk/web` or `/default` entries; ensure `@webspatial/react-sdk` resolves to `./src` (unchanged)

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
