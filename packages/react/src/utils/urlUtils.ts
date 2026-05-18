/**
 * Resolve asset URLs for the native bridge: relative paths become absolute against the
 * current document (typical dev server is `http://localhost/...`).
 *
 * With no `window` (SSR), returns `url` unchanged — pass absolute `http(s)` URLs if needed.
 *
 * @deprecated
 * Will be removed in v2. The SDK only ever used this internally to feed the
 * native bridge absolute URLs; it was promoted to the public surface during
 * the lazy-load v1 redesign by accident. Replace direct callers with either:
 *
 *   - Standard browser API: `new URL(url, location.href).href`
 *   - Your framework's URL helper (Next.js `metadataBase`, etc.) for
 *     server-side absolute URLs
 *
 * Note: when called from a Next.js App Router Server Component this export
 * already does not work (the default entry carries `'use client'` so the
 * symbol resolves to a Client Reference; see `@webspatial/react-sdk/server`
 * for the server-callable subset). RSC consumers should switch immediately —
 * everyone else has until v2.
 *
 * Internal SDK usage (`Texture.tsx`, `ModelAsset.tsx`) reaches this helper
 * via a relative import (`'../../utils/urlUtils'`) and is unaffected by the
 * public-export removal; the helper itself will be moved under `src/internal/`
 * when the public export is finally deleted.
 */
export function getAbsoluteUrl(url: string): string {
  if (typeof window === 'undefined' || !window.location?.href) {
    return url
  }
  try {
    return new URL(url, window.location.href).href
  } catch {
    return url
  }
}
