---
'@webspatial/react-sdk': major
---

**BREAKING:** Removed `getAbsoluteUrl` from the published public surface of `@webspatial/react-sdk` (and the parallel `@webspatial/react-sdk/eager`).

`getAbsoluteUrl` was promoted to the public surface by accident during the lazy-load v1 redesign — the SDK only ever used it internally to feed the native bridge absolute asset URLs (`Texture.tsx`, `ModelAsset.tsx`), and there is no compelling external use case it satisfies that the standard browser `new URL(url, location.href).href` doesn't. Under the default entry's `'use client'` directive it already resolved to a Client Reference and was uncallable from a Next.js Server Component — so the practical contract for RSC consumers had already been broken.

The helper itself still exists at `packages/react/src/internal/urlUtils.ts` (and continues to be used by `Texture` / `ModelAsset` via a relative import) — only the published export is gone. Internal callers and the colocated `urlUtils.test.ts` suite preserve the same SSR-safe + relative-resolution + never-throw behavioural contract.

Migration:

- **RSC consumers** — you were already broken; no further action needed.
- **Client consumers** — replace with `new URL(url, location.href).href`.
- **Server-side absolute URLs** — use your framework's URL helper (Next.js `metadataBase`, etc.) or `new URL(url, baseUrl).href` with an explicit base.

This release telescopes the deprecation cycle into a single removal: no v1 release ever shipped with the `@deprecated` JSDoc, so consumers see exactly one event in the changelog — the removal — rather than a "deprecated" → "removed" pair.
