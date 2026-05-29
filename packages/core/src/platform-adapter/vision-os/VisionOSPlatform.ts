import {
  PlatformAbility,
  CommandResult,
  WebSpatialProtocolResult,
} from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'
import { buildSpatialSceneQuery } from '../spatialSceneQuery'
import type { SpatialSceneCreationOptionsInternal } from '../../types/internal'
import type { AttachmentEntityOptions } from '../../types/types'

type JSBError = {
  code?: string
  message: string
}

const UUID_RE =
  /\b([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\b/gi

export class VisionOSPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      const result = await window.webkit.messageHandlers.bridge.postMessage(
        `${cmd}::${msg}`,
      )
      return CommandResultSuccess(result)
    } catch (error: unknown) {
      // console.error(`VisionOSPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`)
      const { code, message } = this.parseJSBError(error)
      return CommandResultFailure(code, message)
    }
  }

  openSpatialSceneSync(
    url: string,
    config: SpatialSceneCreationOptionsInternal | undefined,
    target?: string,
    features?: string,
  ): WebSpatialProtocolResult {
    const query = buildSpatialSceneQuery(url, config)
    const { spatialId: id = '', windowProxy } = this.openWindow(
      'createSpatialScene',
      query,
      target,
      features,
    )

    return CommandResultSuccess({ windowProxy, id })
  }

  createNativeSpatialDiv(): Promise<WebSpatialProtocolResult> {
    return this.openProtocolAsync('createSpatialized2DElement')
  }

  createNativeAttachment(
    _options?: AttachmentEntityOptions,
  ): Promise<WebSpatialProtocolResult> {
    return this.openProtocolAsync('createAttachment')
  }

  private async openProtocolAsync(
    command: string,
  ): Promise<WebSpatialProtocolResult> {
    const { spatialId: id = '', windowProxy } = this.openWindow(
      command,
      '',
      undefined,
      undefined,
    )
    return CommandResultSuccess({ windowProxy, id })
  }

  private openWindow(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): { spatialId?: string; windowProxy: WindowProxy | null } {
    const windowProxy = window.open(
      `webspatial://${command}?${query || ''}`,
      target,
      features,
    )
    const ua = windowProxy?.navigator.userAgent
    const spatialId = ua?.match(UUID_RE)?.[0]

    return { spatialId, windowProxy }
  }

  private parseJSBError(error: unknown): { code: string; message: string } {
    try {
      const parsed = JSON.parse((error as JSBError).message ?? '')
      return {
        code: parsed.code ?? 'E_VISIONOS_JSB',
        message: parsed.message ?? 'VisionOS JSB execution failed',
      }
    } catch {
      return {
        code: 'E_VISIONOS_JSB',
        message:
          (error as JSBError)?.message ?? 'VisionOS JSB execution failed',
      }
    }
  }
}
