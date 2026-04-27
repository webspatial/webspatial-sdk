export { createPlatformSync } from './createPlatformSync'
import { createPlatformSync } from './createPlatformSync'
import type { PlatformAbility } from './interface'

export async function createPlatform(): Promise<PlatformAbility> {
  return createPlatformSync()
}
