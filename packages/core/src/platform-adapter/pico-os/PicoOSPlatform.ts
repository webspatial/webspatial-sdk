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
import { SpatialWebEvent } from '../../SpatialWebEvent'
import type { SpatialSceneCreationOptionsInternal } from '../../types/internal'
import type { AttachmentEntityOptions } from '../../types/types'

interface JSBResponse {
  success: boolean
  data: any
}
type JSBError = {
  code?: string
  message: string
}

let requestId = 0

const MAX_ID = 100000
const DEFAULT_JSB_ERROR_CODE = 'E_PICO_JSB'
const DEFAULT_JSB_ERROR_MESSAGE = 'Pico JSB execution failed'

function nextRequestId() {
  requestId = (requestId + 1) % MAX_ID
  return `rId_${requestId}`
}

// Only supports Pico OS 6
export class PicoOSPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    // swan JS Bridge interface only support sync invoking
    // in order to implement promise API, register every request by requestId and remove when resolve/reject.
    return new Promise(resolve => {
      try {
        const rId = nextRequestId()

        SpatialWebEvent.addEventReceiver(rId, (result: JSBResponse) => {
          SpatialWebEvent.removeEventReceiver(rId)
          resolve(this.toCommandResult(result))
        })

        const ans = window.webspatialBridge.postMessage(rId, cmd, msg)
        if (ans !== '') {
          SpatialWebEvent.removeEventReceiver(rId)
          // sync call
          resolve(this.parseBridgeResponse(ans))
        }
      } catch (error: unknown) {
        console.error(`SwanPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`)
        const { code, message } = this.parseJSBError(error)
        resolve(CommandResultFailure(code, message))
      }
    })
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
    return this.waitForRidProtocolAsync('createSpatialized2DElement')
  }

  createNativeAttachment(
    _options?: AttachmentEntityOptions,
  ): Promise<WebSpatialProtocolResult> {
    return this.waitForRidProtocolAsync('createAttachment')
  }

  /**
   * Async path for createNativeSpatialDiv / createNativeAttachment: open webspatial URL
   * with rid= correlation (Pico OS 6).
   */
  private waitForRidProtocolAsync(
    command: string,
  ): Promise<WebSpatialProtocolResult> {
    return new Promise(resolve => {
      const createdId = nextRequestId()
      try {
        let windowProxy: WindowProxy | null = null
        SpatialWebEvent.addEventReceiver(
          createdId,
          (result: { spatialId: string }) => {
            resolve(
              CommandResultSuccess({
                windowProxy: windowProxy,
                id: result.spatialId,
              }),
            )
            SpatialWebEvent.removeEventReceiver(createdId)
          },
        )
        windowProxy = this.openWindow(command, 'rid=' + createdId).windowProxy
      } catch (error: unknown) {
        const { code, message } = this.parseJSBError(error)
        SpatialWebEvent.removeEventReceiver(createdId)
        resolve(CommandResultFailure(code, message))
      }
    })
  }

  private openWindow(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): { spatialId: string; windowProxy: WindowProxy | null } {
    const url = query
      ? `webspatial://${command}?${query}`
      : `webspatial://${command}`
    const windowProxy = window.open(url, target, features)
    return { spatialId: '', windowProxy }
  }

  private parseBridgeResponse(ans: string): CommandResult {
    try {
      const result = JSON.parse(ans) as JSBResponse
      return this.toCommandResult(result)
    } catch {
      return CommandResultFailure(
        DEFAULT_JSB_ERROR_CODE,
        'Invalid Pico JSB response payload',
      )
    }
  }

  private toCommandResult(result: JSBResponse): CommandResult {
    if (result.success) {
      return CommandResultSuccess(result.data)
    }
    const { code, message } = this.parseJSBError(result.data)
    return CommandResultFailure(code, message)
  }

  private parseJSBError(error: unknown): { code: string; message: string } {
    return {
      code: (error as JSBError)?.code ?? DEFAULT_JSB_ERROR_CODE,
      message:
        (error as JSBError)?.message ??
        (typeof error === 'string' ? error : DEFAULT_JSB_ERROR_MESSAGE),
    }
  }
}
