import { VisionOSPlatform } from './vision-os/VisionOSPlatform'
import { PlatformAbility } from './interface'

export function createPlatform(): PlatformAbility {
  return new VisionOSPlatform()
}
