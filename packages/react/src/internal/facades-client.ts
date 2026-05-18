'use client'
// =============================================================================
// `@webspatial/react-sdk/internal/facades-client` — internal RSC client
// boundary used by the SDK's JSX runtime.
//
// Why this file exists
// --------------------
//
// The JSX runtime (`dist/jsx/jsx-runtime.js`) MUST be server-callable: when a
// Next.js App Router Server Component uses JSX, the compiler emits
// `import { jsx, jsxs, Fragment } from "@webspatial/react-sdk/jsx-runtime"`
// in the server module. If `jsx-runtime.js` itself carried `'use client'`,
// every server file would treat `jsx` as a Client Reference (an opaque
// object, not callable), and SSR would fail at the first call site. So
// `jsx-runtime.js` MUST stay server-safe.
//
// At the same time, `jsx`/`jsxs` need access to the SDK's facade HOCs
// (`Model`, `withSpatialized2DElementContainer`, `withSpatialMonitor`)
// to rewrite `enable-xr` markers. Those facades transitively pull in
// React hooks (`useSyncExternalStore`, `useLayoutEffect`, …), which
// the RSC compiler rejects from a server-callable module.
//
// The bridge: this file marks the public RSC boundary for facade-import
// purposes. It carries the `'use client'` directive (injected at build
// time by `tsup.config.ts` `onSuccess`) and re-exports the three facade
// symbols `jsx-shared.ts` needs. `jsx-shared.ts` imports them via the
// EXTERNAL package self-reference `@webspatial/react-sdk/internal/facades-client`
// (tsup is configured to leave that import literal), so consumer bundlers
// see:
//
//   server `jsx-runtime.js`
//     → chunk containing `jsx-shared`
//     → external `@webspatial/react-sdk/internal/facades-client`
//     → `dist/internal/facades-client.js`  ← `'use client'` boundary STOPS the walk
//
// Webpack/Next's RSC compiler stops walking at the directive and serializes
// the imported facades as Client References. The `jsx-shared.ts` runtime
// then detects the Client References (they are objects, not functions) and
// gracefully degrades to "strip markers, do not wrap" — the resulting
// server-rendered DOM stays identical to the facade-fallback DOM that the
// client will render after hydration.
//
// Why NOT just an `'use client'` directive on `jsx-runtime.js`
// -----------------------------------------------------------
// Putting the directive on `jsx-runtime.js` itself would force every
// Server Component's JSX to cross a client boundary at the call site
// (`jsx(...)`), which is impossible because Server Components rely on
// being able to CALL `jsx` synchronously during their server render.
//
// Why this is `internal/` and not part of the public surface
// ----------------------------------------------------------
// Consumers should NOT depend on this subpath directly. It exists purely
// to satisfy the build-pipeline / RSC contract above. The actual facade
// symbols remain available via the public `@webspatial/react-sdk` entry.
// Marked `internal/` by convention and documented as such in the
// associated build-output assertion at
// `src/__tests__/use-client-directive.test.ts`.
// =============================================================================

export { Model } from '../facades/Model'
export { withSpatialized2DElementContainer } from '../facades/withSpatialized2DElementContainer'
export { withSpatialMonitor } from '../facades/withSpatialMonitor'
