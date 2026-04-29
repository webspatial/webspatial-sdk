/**
 * Resolve asset URLs for the native bridge: relative paths become absolute against the
 * current document (typical dev server is `http://localhost/...`).
 *
 * With no `window` (SSR), returns `url` unchanged — pass absolute `http(s)` URLs if needed.
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
