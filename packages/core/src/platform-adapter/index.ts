import { resolveJsbAdapterPlatform } from '../runtime/jsbAdapterPlatform'
import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { SSRPlatform } from './ssr/SSRPlatform'

export function createPlatform(): PlatformAbility {
  if (isSSREnv()) {
    return new SSRPlatform()
  }
  const userAgent = window.navigator.userAgent
  const kind = resolveJsbAdapterPlatform(userAgent)
  switch (kind) {
    case 'puppeteer': {
      const PuppeteerPlatform =
        require('./puppeteer/PuppeteerPlatform').PuppeteerPlatform
      return new PuppeteerPlatform()
    }
    case 'picoos': {
      const PicoOSPlatform = require('./pico-os/PicoOSPlatform').PicoOSPlatform
      return new PicoOSPlatform()
    }
    case 'visionos': {
      const VisionOSPlatform =
        require('./vision-os/VisionOSPlatform').VisionOSPlatform
      return new VisionOSPlatform()
    }
  }
}
