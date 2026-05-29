import type { WebSpatialProtocolResult } from './platform-adapter/interface'
import { getPlatform, getPlatformSync } from './platform-runtime'
import type { SpatialSceneCreationOptionsInternal } from './types/internal'
import type { AttachmentEntityOptions } from './types/types'

export async function createNativeSpatialDiv(): Promise<WebSpatialProtocolResult> {
  const platform = await getPlatform()
  return platform.createNativeSpatialDiv()
}

export async function createNativeAttachment(
  options: AttachmentEntityOptions,
): Promise<WebSpatialProtocolResult> {
  const platform = await getPlatform()
  return platform.createNativeAttachment(options)
}

export function openSpatialSceneSync(
  url: string,
  config: SpatialSceneCreationOptionsInternal | undefined,
  target?: string,
  features?: string,
): WebSpatialProtocolResult {
  return getPlatformSync().openSpatialSceneSync(url, config, target, features)
}
