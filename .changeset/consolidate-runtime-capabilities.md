---
"@webspatial/core-sdk": minor
"@webspatial/react-sdk": patch
---

Add `@webspatial/core-sdk/runtime` lean subpath and remove duplicated `packages/react/src/runtime/capabilities.ts`. React SDK inlines the runtime module at build time so `WebSpatialRuntime.supports` and `detectSpatialRuntime` share one implementation with core-sdk.
