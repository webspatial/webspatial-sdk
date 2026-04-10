import type { WebSpatialRuntimeSnapshot } from './types'

/**
 * Parse shell token from UA:
 * - packaged/hybrid runtimes use `WSAppShell/<version>`
 * - browser-mode runtime on Pico OS uses `PicoWebApp/<version>`
 *
 * Keep `WSAppShell` precedence when both appear in one UA.
 */
export function parseShellToken(ua: string): {
  version: string | null
  source: 'wsapp' | 'picoapp' | null
} {
  const ws = /\bWSAppShell\/([\w.-]+)/i.exec(ua)
  if (ws?.[1]) return { version: ws[1], source: 'wsapp' }
  const pico = /\bPicoWebApp\/([\w.-]+)/i.exec(ua)
  if (pico?.[1]) return { version: pico[1], source: 'picoapp' }
  return { version: null, source: null }
}

/** Pico runtime: require explicit Pico tokens (do not treat generic `like Quest` VR UAs as picoos). */
function inferPicoOs(ua: string): boolean {
  return (
    /\bPicoWebApp\//i.test(ua) ||
    /\bPicoBrowser\b/i.test(ua) ||
    /\bPicoWebApp\b/i.test(ua)
  )
}

/** visionOS-class WebView UAs include a Mac OS X platform token; `WSAppShell` alone is not enough. */
function inferVisionOsFromUa(ua: string): boolean {
  return /Mac OS X/i.test(ua)
}

/**
 * Resolve internal runtime snapshot from `navigator.userAgent`.
 * SSR / no navigator → `{ type: null, shellVersion: null }` (no throw).
 */
export function computeRuntimeFromUserAgent(
  userAgent: string | undefined,
): WebSpatialRuntimeSnapshot {
  if (userAgent === undefined || userAgent === '') {
    return { type: null, shellVersion: null }
  }
  const { version, source } = parseShellToken(userAgent)
  if (!version) {
    return { type: null, shellVersion: null }
  }

  if (source === 'picoapp' || inferPicoOs(userAgent)) {
    return { type: 'picoos', shellVersion: version }
  }

  if (source === 'wsapp') {
    if (inferVisionOsFromUa(userAgent)) {
      return { type: 'visionos', shellVersion: version }
    }
    return { type: null, shellVersion: version }
  }

  return { type: null, shellVersion: version }
}
