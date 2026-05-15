import { createPlatformSync } from './platform-adapter'
import type { PlatformAbility } from './platform-adapter/interface'

let platformResolved: PlatformAbility | undefined

export function getPlatformSync(): PlatformAbility {
  platformResolved ??= createPlatformSync()
  return platformResolved
}

export async function getPlatform(): Promise<PlatformAbility> {
  return getPlatformSync()
}
