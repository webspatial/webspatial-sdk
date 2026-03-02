import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { SSRPlatform } from './ssr/SSRPlatform'

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

export function createPlatform(): PlatformAbility {
  if (isSSREnv()) {
    return new SSRPlatform()
  }
  const userAgent = window.navigator.userAgent
  const webSpatialVersion = getWebSpatialVersion(userAgent)
  if (window.navigator.userAgent.includes('Puppeteer')) {
    const PuppeteerPlatform =
      require('./puppeteer/PuppeteerPlatform').PuppeteerPlatform
    return new PuppeteerPlatform()
  } else if (
    userAgent.includes('PicoWebApp') &&
    isVersionGreater(webSpatialVersion, [0, 0, 1])
  ) {
    const XRPlatform = require('./xr/XRPlatform').XRPlatform
    return new XRPlatform()
  } else if (userAgent.includes('Android') || userAgent.includes('Linux')) {
    const AndroidPlatform = require('./android/AndroidPlatform').AndroidPlatform
    return new AndroidPlatform()
  } else {
    const VisionOSPlatform =
      require('./vision-os/VisionOSPlatform').VisionOSPlatform
    return new VisionOSPlatform()
  }
}
