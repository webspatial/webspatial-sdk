## notice

`jsx-shared.ts` imports the facade HOC factories
(`withSpatialized2DElementContainer`, `withSpatialMonitor`) through the
**internal `'use client'` boundary subpath**
`@webspatial/react-sdk/internal/facades-client`, not via a relative path.
The subpath is marked external in `packages/react/tsup.config.ts`, so the
emitted `dist/jsx/jsx-runtime.js` (and its splitting-chunks) contain a
literal `import { ... } from "@webspatial/react-sdk/internal/facades-client"`.

Why: `dist/jsx/jsx-runtime.js` MUST be server-callable (Next.js App
Router compiles every Server Component's JSX into `jsx(...)` calls
reaching this file via `tsconfig "jsxImportSource"`). It cannot itself
carry `'use client'`. But the facade HOCs transitively import React
hooks (`useSyncExternalStore`, `useLayoutEffect`, ...) which the RSC
compiler rejects from a server-callable module. Routing the lookup
through the internal subpath terminates the server-side walk at the
`'use client'` directive at the top of `dist/internal/facades-client.js`,
where Next serialises the imported HOC factories as Client References. The
runtime check `canWrapWithFacade` in `jsx-shared.ts` then degrades
"strip + wrap" to "strip-only" when the imports are Client References
instead of real functions. See `src/internal/facades-client.ts` for the
full design note.

The JSX runtime entries are emitted from the same tsup splitting graph as
the default, eager, spatial, and internal facade-boundary entries. The
important boundary is the external package self-reference:
`jsx-shared.ts` imports only the HOC factories from
`@webspatial/react-sdk/internal/facades-client`, so the server-callable
runtime chunk does not inline hook-bearing facade modules. Consumer RSC
bundlers stop at `dist/internal/facades-client.js`'s `'use client'`
directive before walking into those facades.

`Model` / `Reality` short-circuiting does not depend on comparing facade
function identity. `primitive-marker.ts` brands both the default-entry
facades and the eager-entry real implementations, and
`replaceToSpatialPrimitiveType` checks that marker before stripping or
wrapping markers.

The previously-shipped strip-only siblings `jsx-runtime.web.ts` and
`jsx-dev-runtime.web.ts`, plus the `react-server` `exports` conditional
in `packages/react/package.json`, were removed in PR 5 of the lazy-load
roll-out. The single unified runtime now serves plain web, AVP, SSR, and
RSC consumers.
