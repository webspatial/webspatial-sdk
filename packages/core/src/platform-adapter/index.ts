import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { SSRPlatform } from './ssr/SSRPlatform'
import { isVersionGreater } from '../utils/utils'
import { UAManager } from '../utils/ua'

export function createPlatform(): PlatformAbility {
  if (isSSREnv()) {
    return new SSRPlatform()
  }
  if (UAManager.isPuppeteer()) {
    const PuppeteerPlatform =
      require('./puppeteer/PuppeteerPlatform').PuppeteerPlatform
    return new PuppeteerPlatform()
  } else if (
    UAManager.isPicoOS() &&
    isVersionGreater(UAManager.getWebSpatialVersionFromUA(), [0, 0, 1])
  ) {
    const PicoOSPlatform = require('./pico-os/PicoOSPlatform').PicoOSPlatform
    return new PicoOSPlatform()
  } else if (UAManager.isAndroid()) {
    const AndroidPlatform = require('./android/AndroidPlatform').AndroidPlatform
    return new AndroidPlatform()
  } else {
    const VisionOSPlatform =
      require('./vision-os/VisionOSPlatform').VisionOSPlatform
    return new VisionOSPlatform()
  }
}
