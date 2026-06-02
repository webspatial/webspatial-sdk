---
'@webspatial/core-sdk': patch
---

`createPlatformSync()` (and async `createPlatform()`) now **throw** when `isSSREnv()` is true (`typeof window === 'undefined'`) instead of returning an internal `SSRPlatform` that no-op'd JSB and `openSpatialSceneSync` with `{ success: true }`.

**Why:** Server-side execution of platform / JSB APIs is not a supported integration path (use `@webspatial/react-sdk` default entry facades, or CSR-gate spatial UI). Silent success masked misconfiguration; fail-fast aligns with runtime-gated APIs such as `useMetrics` / `convertCoordinate`, which throw when invoked without a browser runtime.

**Migration:** If SSR accidentally called into `getPlatformSync()` / `JSBCommand.execute()` / `openSpatialSceneSync()`, fix the app to avoid importing or executing `@webspatial/core-sdk` spatial runtime on the server. Recommended SSR pages use the React SDK default entry only; spatial chunk and polyfills load on the client after `bootSpatial()`.

**Removed:** `packages/core/src/platform-adapter/ssr/SSRPlatform.ts`.

**Docs / spec:** `openspec/changes/platform-ssr-fail-fast/`, `docs/migration/lazy-load-spatial-runtime.md`, `packages/core/README.md`.
