import { VisionOSPlatform } from './vision-os/VisionOSPlatform'
import { PlatformAbility } from './interface'
import { AndroidPlatform } from './android/AndroidPlatform'

export function createPlatform(): PlatformAbility {
  if(window.navigator.userAgent.includes('Android')){
    return new AndroidPlatform()
  }
  return new VisionOSPlatform()
}
