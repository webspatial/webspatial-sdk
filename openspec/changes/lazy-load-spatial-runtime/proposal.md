## Why

Product positioning is **web-first, spatial as enhancement**: most page loads happen in regular browsers, only a minority enter a WebSpatial runtime (visionOS / Pico OS). The current "dual build (`dist/web` vs `dist/default`) + `@webspatial/vite-plugin` alias switching" architecture under-delivers on its size promise and adds operational tax:

- `dist/web/index.js` is ~124KB (≈ `dist/default/index.js`); only `initScene` and the JSX runtime have `.web.ts` placeholders. All heavyweight modules (`Spatialized*Container*`, `withSpatialMonitor`, `Reality`, `*Entity`, real `Model`, reality hooks) ship in the web bundle anyway.
- The size optimization is conditional on adopting `@webspatial/vite-plugin`, running `concurrently`, and ordering `web → avp` builds correctly. Any missing piece silently degrades.
- The three in-house consumers (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) all bypass the plugin and alias `@webspatial/react-sdk` directly to source, so the dual-build contract has zero in-tree end-to-end coverage.
- Two parallel `XR_ENV` injection mechanisms exist (tsup banner writes `__webspatialsdk__.XR_ENV`; the plugin defines `window.XR_ENV`), creating inconsistent runtime semantics.

A simpler, web-first-aligned architecture is to **defer spatial code from build time to run time**: ship one tiny default bundle for everyone, dynamically `import()` the spatial implementation only inside a WebSpatial runtime.

## What Changes

- **BREAKING** Remove the `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` subpath exports. Only `'.'`, `./jsx-runtime`, `./jsx-dev-runtime`, and the new `./spatial` remain.
- **BREAKING** The default entry no longer ships spatial implementations. Applications running in a WebSpatial runtime MUST `await bootSpatial()` before initial render to load the spatial chunk; otherwise all spatial APIs render as web fallbacks.
- Introduce a runtime **bridge singleton** (`getSpatialImpl()` / `loadSpatialImpl()` / `isSpatialReady()`) and a **boot helper** (`bootSpatial()`) in the default entry. The bridge dynamically imports `@webspatial/react-sdk/spatial` exactly once when invoked in a WebSpatial runtime.
- Replace every public spatial component / HOC / hook export in the default entry with a **lightweight facade / placeholder**. Facades render fallback (`props.fallback` or per-component default) until `bootSpatial()` resolves; hooks return documented stable defaults.
- Move all real implementations (`Spatialized*Container*`, `withSpatial*`, `Reality`, `*Entity`, real `Model`, reality hooks) into `packages/react/src/spatial/` and expose them via a new `@webspatial/react-sdk/spatial` subpath that the bridge dynamically imports.
- Patch the JSX runtime web variants (`jsx-runtime.web.ts`, `jsx-dev-runtime.web.ts`) to **strip** WebSpatial-only markers (`enable-xr`, `enable-xr-monitor`, `style.enableXr`, `__enableXr__` className token) before delegating to `react/jsx-runtime`, so plain browsers no longer warn about unknown attributes.
- Delete the `dist/web` and `dist/default` build entries from `tsup.config.ts`; remove the `XR_ENV` `window.__webspatialsdk__` writes from banners (only version banners remain).
- Add a hard size budget: `dist/index.js` gzip ≤ 8KB, enforced by a unit test.
- Document that **`@webspatial/vite-plugin` is no longer required**. Old plugin configurations that alias `@webspatial/react-sdk` to `/web` or `/default` will fail to resolve after this change; users must remove or upgrade the plugin in lockstep with the SDK upgrade.

## Capabilities

### New Capabilities

- `spatial-lazy-load`: Default-entry size budget; bridge / boot contract; facade and hook placeholder behavior; spatial chunk exposure and load semantics; JSX runtime web-variant attribute stripping; SSR / hydration behavior; plugin-free integration.

### Modified Capabilities

- `runtime-capabilities`: Internal runtime snapshot retrieval MUST be synchronous and SSR-safe so the bridge can decide without `await`; spatial-dependent capability keys MUST resolve to `false` in non-WebSpatial browsers (re-asserted across the broader key set used by lazy-load).

## Impact

- **`@webspatial/react-sdk`**
  - New: `runtime/bridge.ts`, `runtime/boot.ts`, `runtime/detect.ts`, `facades/*.tsx`, `hooks-web/*`, `spatial/index.ts`.
  - Rewritten: `src/index.ts` to export only facades, hook placeholders, bridge, boot, JSX runtime, and types.
  - `tsup.config.ts`: collapse to a single main entry plus a `spatial` entry; delete `dist/web` and `dist/default` configs; remove `XR_ENV` banner writes.
  - `package.json` `exports`: hard remove `./web` and `./default`; add `./spatial`.
  - JSX runtime web variants gain attribute-stripping logic.
- **`@webspatial/core-sdk`**
  - No structural change. `noRuntime.ts` shim is no longer needed by react-sdk after this change but is left in place; cleanup is out of scope.
- **In-house apps & tests** (`apps/test-server`, `packages/autoTest`, `tests/ci-test`)
  - **Not modified in this change.** They continue to alias `@webspatial/react-sdk` → `packages/react/src` (source-level), which still works because the source-level `index.ts` is the new lean entry. A follow-up change will migrate them to consume `dist` plus `bootSpatial()` for end-to-end size validation.
- **`@webspatial/vite-plugin`** (separate repo `webspatial/web-builder-plugins`)
  - Becomes redundant. Users on the new SDK MUST remove the plugin from `vite.config.ts` (alias rewrite to removed subpaths will otherwise break the build). Cross-repo deprecation is tracked as a follow-up issue and is **not blocking** this change.
- **Documentation**
  - New migration guide covering: removed subpaths, plugin removal, mandatory `bootSpatial()` adoption, per-component fallback semantics.
  - Public API docs updated to describe each component's web fallback behavior.
