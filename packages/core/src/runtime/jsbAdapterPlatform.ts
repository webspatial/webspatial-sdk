import { computeRuntimeFromUserAgent } from './userAgent'

function getWebSpatialVersion(ua: string): number[] | null {
  const match = ua.match(/WebSpatial\/(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return null
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isVersionGreater(a: number[] | null, b: number[]): boolean {
  if (!a) {
    return false
  }
  for (let index = 0; index < 3; index += 1) {
    const diff = a[index] - b[index]
    if (diff > 0) {
      return true
    }
    if (diff < 0) {
      return false
    }
  }
  return false
}

/**
 * Which native JSB / protocol adapter to load in the browser.
 * Derived from {@link computeRuntimeFromUserAgent} plus legacy fallbacks
 * (Pico WebSpatial semver gate; otherwise default visionOS shell).
 */
export type JsbAdapterPlatformKind = 'puppeteer' | 'picoos' | 'visionos'

export function resolveJsbAdapterPlatform(
  userAgent: string,
): JsbAdapterPlatformKind {
  const rt = computeRuntimeFromUserAgent(userAgent)
  if (rt.type === 'puppeteer') {
    return 'puppeteer'
  }

  const webSpatialVersion = getWebSpatialVersion(userAgent)
  if (
    userAgent.includes('PicoWebApp') &&
    isVersionGreater(webSpatialVersion, [0, 0, 1])
  ) {
    return 'picoos'
  }

  return 'visionos'
}
