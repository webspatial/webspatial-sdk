import { isSSREnv } from '../ssr-polyfill'
import { PlatformAbility } from './interface'
import { NoopPlatform } from './noop/NoopPlatform'

export function createPlatform(): PlatformAbility {
  if (isSSREnv()) {
    return new NoopPlatform()
  }

  if (window.navigator.userAgent.includes('Android')) {
    const AndroidPlatform = require('./android/AndroidPlatform').AndroidPlatform
    return new AndroidPlatform()
  } else {
    const VisionOSPlatform =
      require('./vision-os/VisionOSPlatform').VisionOSPlatform
    return new VisionOSPlatform()
  }
}
