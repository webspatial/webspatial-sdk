import {
  CommandResult,
  PlatformAbility,
  WebSpatialProtocolResult,
} from '../interface'
import type { SpatialSceneCreationOptionsInternal } from '../../types/internal'
import type { AttachmentEntityOptions } from '../../types/types'

export class SSRPlatform implements PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult> {
    return Promise.resolve({
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    })
  }

  openSpatialSceneSync(
    _url: string,
    _config: SpatialSceneCreationOptionsInternal | undefined,
    _target?: string,
    _features?: string,
  ): WebSpatialProtocolResult {
    return {
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    }
  }

  createNativeSpatialDiv(): Promise<WebSpatialProtocolResult> {
    return Promise.resolve({
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    })
  }

  createNativeAttachment(
    _options?: AttachmentEntityOptions,
  ): Promise<WebSpatialProtocolResult> {
    return Promise.resolve({
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    })
  }
}
