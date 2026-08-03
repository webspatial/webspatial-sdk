---
'@webspatial/core-sdk': major
---

BREAKING: restructure the Core SDK runtime and platform packaging around explicit ESM subpaths.

- Add `@webspatial/core-sdk/runtime` for runtime detection (`supports`, `getRuntime`) and `@webspatial/core-sdk/runtime/keys` for capability registry constants. `CapabilityKey` and `supports()` remain available, but registry constants are no longer exported from the main runtime entry.
- Move WebSpatial polyfill installation to `@webspatial/core-sdk/install-polyfills`. Consumers that previously relied on top-level `@webspatial/core-sdk` import side effects must import this subpath explicitly when they need polyfills. The React SDK loads it from the spatial chunk after `bootSpatial()`.
- Remove the legacy IIFE bundle (`dist/iife/index.global.js`) and its build target. ESM imports are the supported distribution path.
- Make `createPlatformSync()` / `createPlatform()` throw during SSR instead of returning an internal no-op `SSRPlatform`.
- Emit the Core SDK as unbundled ESM so downstream bundlers can tree-shake runtime detection and spatial implementation code independently.
