import { resolveJsbAdapterPlatform } from '../runtime/jsbAdapterPlatform'
import { isSSREnv } from '../isSSREnv'
import { PlatformAbility } from './interface'
import { PicoOSPlatform } from './pico-os/PicoOSPlatform'
import { PuppeteerPlatform } from './puppeteer/PuppeteerPlatform'
import { VisionOSPlatform } from './vision-os/VisionOSPlatform'

const SSR_PLATFORM_ERROR =
  'WebSpatial platform APIs (JSB / openSpatialScene) cannot run during SSR or without window. Use @webspatial/react-sdk default entry with facades, or CSR-gate spatial UI on the client.'

function assertNever(_: never): never {
  throw new Error('Unhandled jsb adapter platform kind')
}

/**
 * Construct the JSB platform synchronously (static imports).
 * Used by getPlatformSync (e.g. scene-polyfill openSpatialSceneSync) and kept
 * consistent with async createPlatform so paths share one implementation.
 */
export function createPlatformSync(): PlatformAbility {
  if (isSSREnv()) {
    throw new Error(SSR_PLATFORM_ERROR)
  }
  const userAgent = window.navigator.userAgent
  const kind = resolveJsbAdapterPlatform(userAgent)
  switch (kind) {
    case 'puppeteer':
      return new PuppeteerPlatform()
    case 'picoos':
      return new PicoOSPlatform()
    case 'visionos':
      return new VisionOSPlatform()
    default:
      return assertNever(kind)
  }
}
