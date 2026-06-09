## Why

`createPlatformSync()` returned an internal `SSRPlatform` when `typeof window === 'undefined'`. That adapter answered `callJSB` and `openSpatialSceneSync` with `{ success: true }`, so server-side misuse looked like a successful native bridge call instead of failing loudly.

Recommended integrations (`@webspatial/react-sdk` default entry, CSR-gated eager, `install-polyfills` guarded by `!isSSREnv()`) should not reach platform APIs during SSR. The noop adapter mainly hid accidental `@webspatial/core-sdk` usage on the server and contradicted the product rule that unsupported spatial side effects should not silently succeed.

## What Changes

- `createPlatformSync()` throws a descriptive `Error` when `isSSREnv()` is true (single guard; `createPlatform()` inherits the same behavior).
- Delete `packages/core/src/platform-adapter/ssr/SSRPlatform.ts`.
- Update core tests, migration notes, and package README.

## Capabilities

### New Capabilities

- `core-platform-adapter`: documents synchronous platform construction and SSR / no-window fail-fast behavior.

### Modified Capabilities

<!-- None. `runtime-capabilities` SSR rules for `supports()` remain unchanged (detection must not throw solely for missing `window`). -->

## Impact

- **Code:** `packages/core/src/platform-adapter/createPlatformSync.ts`; removal of `ssr/SSRPlatform.ts`.
- **Tests:** `packages/core/src/coverage-boost.test.ts` — expect throw under mocked SSR.
- **Docs:** `docs/migration/lazy-load-spatial-runtime.md`, `packages/core/README.md`, `.changeset/platform-ssr-fail-fast.md`.
