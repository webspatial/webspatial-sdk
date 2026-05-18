/**
 * Internal URL helper used by the spatial implementation (`Texture.tsx`,
 * `ModelAsset.tsx`) to feed the native bridge absolute asset URLs.
 *
 * Resolve asset URLs for the native bridge: relative paths become absolute
 * against the current document (typical dev server is `http://localhost/...`).
 *
 * With no `window` (SSR), returns `url` unchanged — pass absolute `http(s)`
 * URLs if needed.
 *
 * NOT part of the public surface — there is no `export` from
 * `src/index.ts` or `src/eager.ts` reaching this module. Live here under
 * `src/internal/` to make that contract obvious to readers and to keep
 * the file out of any future "what does the package surface look like?"
 * audit. Was previously published as `getAbsoluteUrl` from the default
 * entry in v1 (briefly with an `@deprecated` JSDoc); the public export
 * is removed in v2 — see the corresponding changeset for the migration
 * recipe (`new URL(url, location.href).href` for browser callers,
 * framework URL helpers for server-side absolute URLs).
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
