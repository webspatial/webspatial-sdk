import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { SSRPlatform } from './ssr/SSRPlatform'

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
  } else {
    const VisionOSPlatform =
      require('./vision-os/VisionOSPlatform').VisionOSPlatform
    return new VisionOSPlatform()
  }
}
