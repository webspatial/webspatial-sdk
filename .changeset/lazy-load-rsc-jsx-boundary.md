---
'@webspatial/react-sdk': patch
---

Unblock React Server Component JSX consumers (Next.js App Router) when `tsconfig.json` sets `"jsxImportSource": "@webspatial/react-sdk"`.

The JSX runtime (`dist/jsx/jsx-runtime.js`) must stay server-callable so Server Components can compile their JSX into `jsx(...)` calls against the SDK, but it transitively reached the facade HOCs — and through them, React hooks like `useSyncExternalStore` / `useLayoutEffect` — which Next's RSC compiler rejects from a server-callable module.

This change introduces an internal `'use client'` boundary subpath, `@webspatial/react-sdk/internal/facades-client`, that the JSX runtime imports as an external package self-reference. Next's RSC compiler now stops walking at that subpath and serializes the imported facades as Client References; the JSX runtime detects this at runtime (`canWrapWithFacade` typeof check) and gracefully degrades to "strip `enable-xr` markers, do not HOC-wrap" so the server-rendered DOM matches the post-hydration fallback DOM.

Behavioral effects:

- `<div enable-xr>` / `<section enable-xr-monitor>` and the `enableXr` / `__enableXr__` markers now compile cleanly inside Server Components (and inside Client Components imported by them) under Next.js 15 App Router.
- `tsup` now emits two passes — the JSX runtime is built in isolation so its splitting chunks are guaranteed not to share with hook-bearing modules.
- New published subpath: `@webspatial/react-sdk/internal/facades-client` (carries `'use client'`). Documented as `internal/` and intended for the SDK's own JSX runtime only — consumer code should continue to import facades from the default entry.
- No change to the public default-entry surface; no breaking change.
