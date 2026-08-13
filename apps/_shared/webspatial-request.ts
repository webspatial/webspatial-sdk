export type WebSpatialPlatform = 'visionos' | 'picoos' | 'unknown'

export type WebSpatialRequestSignal = 'webspatial-token' | 'none'

export type WebSpatialRequestInfo = {
  isWebSpatial: boolean
  platform: WebSpatialPlatform
  signal: WebSpatialRequestSignal
}

/**
 * Server-side request classifier for WebSpatial runtimes.
 *
 * This helper is for SSR/loader branching and analytics labels only.
 * Do not use it for auth/security decisions because User-Agent is forgeable.
 */
export function detectWebSpatialRequest(
  userAgent: string,
): WebSpatialRequestInfo {
  if (!userAgent.includes('WebSpatial/')) {
    return {
      isWebSpatial: false,
      platform: 'unknown',
      signal: 'none',
    }
  }

  return {
    isWebSpatial: true,
    platform: /\bPicoWebApp\b/i.test(userAgent)
      ? 'picoos'
      : /\bWSAppShell\b/i.test(userAgent)
        ? 'visionos'
        : 'unknown',
    signal: 'webspatial-token',
  }
}
