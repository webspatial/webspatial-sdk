---
'@webspatial/react-sdk': patch
---

Build configuration + size-budget enforcement for `openspec/lazy-load-spatial-runtime` (PR 5 of 6). No public API change beyond what PR 4 already shipped (the BREAKING was counted there); this PR locks the published shape and adds the regression guards that PR 1 / 2 / 3 / 4 promised.

**Build pipeline (`tsup.config.ts`)**:

- Single unified `tsup` pass with `splitting: true` over three logical entries: `src/index.ts → dist/index.js` (lean default), `src/spatial/index.ts → dist/spatial.js` (dynamic-import target), `src/jsx/jsx-{runtime,dev-runtime}.ts → dist/jsx/*.js` (single unified JSX runtime). `esbuild` hoists the facade module + `replaceToSpatialPrimitiveType` into a shared chunk used by both the default entry and the JSX runtimes — no duplicate facade copy ships per JSX bundle.
- Drops the legacy dual-build (`dist/web` + `dist/default`) and all `*.web.*` entries.
- Drops the `XR_ENV` global write from the tsup banner; only the `react-sdk-version` window stamp remains.
- Marks `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom/client`, and `@webspatial/core-sdk` as external — `core-sdk` is now a real peer dependency (the legacy `noRuntime.ts` web-build alias was dropped with the unified layout and the stub files were deleted in follow-up cleanup).

**Published `package.json`**:

- `main` → `./dist/index.js`, `types` → `./dist/index.d.ts`, `sideEffects: false`.
- `exports` rewritten to four clean subpaths: `.`, `./spatial`, `./jsx-runtime`, `./jsx-dev-runtime`. **Hard-removed** all `./web`, `./default`, `./web/*`, `./default/*` subpaths AND the `react-server` conditional sub-key on the JSX exports — the unified JSX runtime serves plain web, AVP, SSR, and RSC consumers identically.
- `peerDependencies.react` and `peerDependencies["react-dom"]` pinned to `">=18.0"` (the `useSyncExternalStore` baseline `useSpatialReady` requires).
- `peerDependenciesMeta.react.optional` and `peerDependenciesMeta["react-dom"].optional` flipped to `false` (hard peer). Implements `tasks.md §8.7` — installing `@webspatial/react-sdk` without React is no longer silently allowed.
- `tsconfig.json` `paths` confirmed clean (no legacy `@webspatial/react-sdk/web` or `/default` aliases).

**Source-tree cleanup**:

- Physically deletes `packages/react/src/jsx/jsx-runtime.web.ts` and `packages/react/src/jsx/jsx-dev-runtime.web.ts` (PR 3 left these as transitional shims; PR 5's unified runtime makes them unreachable).
- Follow-up cleanup also deletes the unused dual-build stubs `packages/react/src/noRuntime.ts`, `noRuntime.test.ts`, and `initScene.web.ts` once the unified tsup layout is stable (see openspec `tasks.md §12.10`).
- Keeps the relative import `from '../facades'` in `packages/react/src/jsx/jsx-shared.ts` (instead of switching back to `from '@webspatial/react-sdk'` — both resolution targets land in the same shared chunk under `splitting: true`, so the relative form avoids the `@ts-ignore` that the self-import previously needed). `packages/react/src/jsx/README.md` documents the rationale.
- `src/index.ts` switched `export * from './initScene'` to `export { initScene } from './initScene'` to satisfy the new named-re-export preference (`tasks.md §9.7`).
- Adds `/* @__PURE__ */` annotations to the `createEntityRefFacade` / `createNullFacade` calls in `src/facades/entities.tsx` and `src/facades/resources.tsx` so the side-effect lint and downstream bundlers can prove the call expressions are tree-shakable.
- Source-tree physical relocation of spatial implementation modules under `src/spatial/` (`tasks.md §3.1`) remains deferred to a follow-up cosmetic cleanup PR — PR 5 only locks the build / size contract.

**Size-budget + tree-shake regression guards (`tasks.md §9`)**:

- `packages/react/src/__tests__/size-budget.test.ts` — SDK-side proxy. Asserts `dist/index.js` gzipped ≤ 8192 bytes; current measurement is 1290 bytes (6902 bytes of headroom). Logs `dist/spatial.js` gzipped size as informational telemetry (currently 23742 bytes).
- `packages/react/src/__tests__/dist-identifier-scan.test.ts` — scans `dist/index.js` and every chunk statically reachable from it (BFS over `import` statements; `dist/spatial.js` is **excluded** because the bridge reaches it via dynamic `import()`) for the spatial-only identifier list pinned by the spec (`Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`, `ResourceRegistry`, `AttachmentRegistry`, internal reality-hook implementation symbols, etc.). Includes a positive-control assertion that `dist/spatial.js` does contain those identifiers, so a broken build pipeline that emitted an empty `dist/spatial.js` would also fail the test.
- `packages/react/src/__tests__/published-package-shape.test.ts` — asserts `peerDependenciesMeta.{react,react-dom}.optional !== true`, `sideEffects === false`, `main`/`types` point at the new flat layout, and the four `exports` subpaths match the published contract.
- `packages/react/src/__tests__/default-entry-export-shape.test.ts` — lints `src/index.ts` so wildcard re-exports of runtime values cannot be reintroduced (`export * from './x'` is rejected for runtime modules; `export type * from ...` is permitted).
- `packages/react/src/__tests__/default-entry-side-effects.test.ts` — Babel-AST-based scan over every module reachable from `src/index.ts`. **Rejects** writes to `window` / `globalThis`, conditional `initPolyfill()`-style calls, side-effect-only `import 'x'` statements. **Permits** module-private pure initialization: `forwardRef` / `memo` / `createContext` / `lazy`, `new Map()` / `new Set()` / `new WeakMap()`, `Object.freeze` / `Object.assign` / `Object.create` over pure arguments, `/* @__PURE__ */`-annotated calls, and `Component.displayName = '...'` assignments on locally declared components (the React metadata pattern bundlers already understand). Self-tests at the bottom of the file lock the classifier itself.
- `tests/marginal-delta-vite/` — new Vite-based consumer fixture per `tasks.md §9.2 / §9.3`. Builds three apps from one shared Vite ≥ 4 config: `app-base` (no SDK import), `app-typical` (`import { Model, bootSpatial }` + minimal usage), `app-namespace` (`import * as W` + `console.log(W)`). Measures only synchronously reachable chunks gzipped (the `spatial.js` chunk is reached via dynamic `import()` from the bridge and is reported as informational telemetry but **not** counted toward the marginal delta).
  - Tree-shake check (`tasks.md §9.3`) — asserts `app-namespace` sync delta is **strictly larger** than `app-typical` sync delta. Current ratio: 1.11× (21521 vs 19433 bytes); per `tasks.md §9.3` a 2–3× ratio is the healthy target — the §12.9 follow-up will both tighten the budget AND extract the capability table from `core-sdk` so the ratio widens.
  - Marginal-delta assertion (`tasks.md §9.2 + §12.9 calibration bridge`) — the strict spec budget is 8192 bytes gzipped, but the current measured `app-typical` delta is 19433 bytes (mostly `@webspatial/core-sdk`'s UA parser + capability table + `Spatial` / `SpatialSession` runtime classes pulled in via `getSession()`). `tasks.md §12.9` ("Pre-v1 budget calibration") and the `spec.md` "8192-byte number is a design intent, not a measured reality" wording acknowledge this gap. PR 5 implements a **regression-guard bridge**: the test enforces a temporary `REGRESSION_GUARD_BYTES = 24576` ceiling (~25 % over today's measurement, catches new growth) while logging the strict-budget gap (`strict-headroom = -11241 bytes`) on every run as informational telemetry. The §12.9 follow-up closes the gap before v1 is tagged — either by optimizing the SDK / `core-sdk` until the strict budget holds, or by opening a deferred-budget exception with explicit sign-off from the v1 release approver.

**CI wiring**:

- `packages/react/package.json` `test` script now runs `tsc -p ./tsconfig.json && tsup && vitest run` — every test run uses fresh build artifacts (the size / identifier / package-shape tests can no longer drift against a stale `dist/`).
- New `test:size-budget` script at the repo root rebuilds the SDK and runs the marginal-delta fixture.
- `.github/workflows/ci.yml` runs `pnpm run test:size-budget` after `test:react-compat` so size regressions block the merge gate alongside the existing test suites.
- `@babel/parser` and `@babel/types` added to `packages/react/devDependencies` so the AST-based side-effect lint resolves under pnpm's strict workspace linking.
