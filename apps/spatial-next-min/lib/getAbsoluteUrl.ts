// Mirrors `@webspatial/react-sdk` → `src/utils/urlUtils.ts` (Group B utility).
// Copied here because Next.js 15 treats every export from `dist/index.js`
// (which carries `'use client'`) as a Client Reference — RSC pages cannot
// call `getAbsoluteUrl()` imported from the default entry until the SDK
// ships a server-safe subpath. Behavior matches the published SDK helper.

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
