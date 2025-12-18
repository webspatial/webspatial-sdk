import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { SSRPlatform } from './ssr/SSRPlatform'
import { PuppeteerPlatform } from './puppeteer/PuppeteerPlatform'

export function createPlatform(): PlatformAbility {
  if (isSSREnv()) {
    return new SSRPlatform()
  }

  if (
    window.navigator.userAgent.includes('Android') ||
    window.navigator.userAgent.includes('Linux')
  ) {
    const AndroidPlatform = require('./android/AndroidPlatform').AndroidPlatform
    return new AndroidPlatform()
  } else if (window.navigator.userAgent.includes('Puppeteer')) {
    return new PuppeteerPlatform()
  } else {
    const VisionOSPlatform =
      require('./vision-os/VisionOSPlatform').VisionOSPlatform
    return new VisionOSPlatform()
  }
}
