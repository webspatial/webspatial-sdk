import { VisionOSPlatform } from './vision-os/VisionOSPlatform'
import { PlatformAbility } from './interface'
import { AndroidPlatform } from './android/AndroidPlatform'
import { PuppeteerPlatform } from './puppeteer/PuppeteerPlatform'

export function createPlatform(): PlatformAbility {
  console.log('window UserAgent:', window.navigator.userAgent)
  if (window.navigator.userAgent.includes('Android')) {
    return new AndroidPlatform()
  } else if (window.navigator.userAgent.includes('Puppeteer')) {
    return new PuppeteerPlatform()
  }
  return new VisionOSPlatform()
}
