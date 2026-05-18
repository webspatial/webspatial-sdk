---
'@webspatial/react-sdk': patch
---

Mark `getAbsoluteUrl` as `@deprecated`; slated for removal in v2.

`getAbsoluteUrl` was promoted to the public surface by accident during the lazy-load v1 redesign — the SDK only ever used it internally to feed the native bridge absolute asset URLs (`Texture.tsx`, `ModelAsset.tsx`), and there's no compelling external use case it satisfies that the standard browser API doesn't.

This release adds the `@deprecated` JSDoc annotation, documents the deprecation in `packages/react/README.md` ("Stateless utility APIs" table) and `docs/migration/lazy-load-spatial-runtime.md`, and pins the v1 → v2 contract in `openspec/.../spatial-lazy-load/spec.md` ("getAbsoluteUrl export is deprecated" Scenario, mirroring the existing "createElement export is deprecated" precedent). The runtime behavior is unchanged in v1 — the function still works exactly as documented, just with an IDE strikethrough and a JSDoc warning.

Migration:

- **RSC consumers — migrate immediately.** Under the default entry's `'use client'` directive `getAbsoluteUrl` already resolves to a Client Reference and is uncallable from a Server Component. There is no v1 fallback for Server Components; switch now.
- **Client consumers** — replace with `new URL(url, location.href).href`.
- **Server-side absolute URLs** — use your framework's URL helper (Next.js `metadataBase`, etc.) or `new URL(url, baseUrl).href` with an explicit base.

Internal SDK callers (`Texture.tsx`, `ModelAsset.tsx`) reach the helper via a relative import and are unaffected by the deprecation; the helper's source file will move under `src/internal/` when the public export is finally deleted in v2.

No breaking change in v1.
