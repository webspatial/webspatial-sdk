## notice

`jsx-shared.ts` imports the facade trio (`Model`,
`withSpatialized2DElementContainer`, `withSpatialMonitor`) through the
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
where Next serialises the imported facades as Client References. The
runtime check `canWrapWithFacade` in `jsx-shared.ts` then degrades
"strip + wrap" to "strip-only" when the imports are Client References
instead of real functions. See `src/internal/facades-client.ts` for the
full design note.

The JSX runtime is built in its OWN tsup pass (`Bundle 2`), separate
from the default / eager / facade-boundary pass (`Bundle 1`). The two
bundles share NO splitting chunks, which guarantees `dist/jsx/*`'s
reachable chunks contain NO hook imports. The default entry, the eager
entry, and `dist/internal/facades-client.js` reach facades through
relative imports and share the bundle-1 splitting graph, so module-level
identity is preserved — `import { Model } from '@webspatial/react-sdk'`
returns the SAME function reference the JSX runtime compares against
in `replaceToSpatialPrimitiveType`.

The previously-shipped strip-only siblings `jsx-runtime.web.ts` and
`jsx-dev-runtime.web.ts`, plus the `react-server` `exports` conditional
in `packages/react/package.json`, were removed in PR 5 of the lazy-load
roll-out. The single unified runtime now serves plain web, AVP, SSR, and
RSC consumers.
