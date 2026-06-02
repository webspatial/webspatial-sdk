---
'@webspatial/react-sdk': major
---

BREAKING: replace the React SDK dual-build distribution with a web-first lazy-load default entry and a CSR-only eager entry.

- The default `@webspatial/react-sdk` entry now ships facades, hook placeholders, `bootSpatial()`, `isSpatialReady()`, `useSpatialReady()`, `onSpatialLoadError()`, `WebSpatialBootError`, and stateless utility exports. Real spatial implementations live behind the dynamically loaded `@webspatial/react-sdk/spatial` chunk and are activated through `bootSpatial()`.
- Add `@webspatial/react-sdk/eager` for spatial-only, client-rendered surfaces. Eager statically links the real spatial implementations, has an immediate no-op `bootSpatial()`, and is not supported for server-rendering spatial primitives. Pick either the default entry or eager per bundle; loading both now throws `WebSpatialMixedEntryError`.
- Remove the legacy `/web` and `/default` subpaths. Remove public exports that were implementation details or accidental surface: internal spatial containers / monitors, `withSpatialized2DElementContainer`, `withSpatialMonitor`, `Spatialized2DElementContainerProps`, `SSRProvider`, and `getAbsoluteUrl`. Use JSX markers (`<div enable-xr>`) for spatialized intrinsic elements and standard URL helpers such as `new URL(url, location.href).href` for absolute URLs.
- `<SpatialBoot>` now exposes only `children`, `onReady`, and `onError`. It calls `bootSpatial()` after mount, renders `null` while boot is pending, mounts children only after boot succeeds, and does not provide public `gate` or `fallback` props.
- Default-entry component facades render fixed per-component web / SSR fallbacks before boot and delegate to real implementations after readiness. `SceneGraph` / `World` now use a `null` fallback, and custom visible placeholders should be implemented by app wrappers using `useSpatialReady()`.
- `convertCoordinate()` and `useMetrics()` placeholder conversion functions now fail fast with `WebSpatialRuntimeError` when the relevant runtime capability is unavailable, before boot has resolved, or when coordinate refs are invalid.
- `onSpatialContentReady` fires only for real WebSpatial spatial content hosts. Plain-web, pre-boot, and degraded fallback paths strip the prop from DOM attributes and do not invoke it.
- The unified JSX runtime strips spatial marker props and routes marker wrapping through the SDK's internal facade boundary. This keeps `jsxImportSource: "@webspatial/react-sdk"` usable in SSR / RSC contexts while preserving lazy and eager behavior on the client.
- React is now a required peer dependency (`react` / `react-dom` >= 18). `@webspatial/core-sdk` is a workspace dependency of the React SDK.
- Add consumer-shaped validation fixtures for Vite, Rspack, Next default, Next eager, and React Router / Remix-style SSR, plus size-budget and fixture-build CI coverage. The lazy default entry keeps the typical `import { Model, bootSpatial }` marginal delta under the 8 KB gzipped budget.
