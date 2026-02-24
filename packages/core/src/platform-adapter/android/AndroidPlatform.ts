import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'
import { CheckWebViewCanCreateCommand } from '../../JSBCommand'
import { SpatialWebEvent } from '../../SpatialWebEvent'

interface JSBResponse {
  success: boolean
  data: any
}
type JSBError = {
  code: string
  message: string
}

let creatingElementCount = 0

let requestId = 0

const MAX_ID = 100000

function nextRequestId() {
  requestId = (requestId + 1) % MAX_ID
  return `rId_${requestId}`
}

export class AndroidPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    // android JS Bridge interface only support sync invoking
    // in order to implement promise API, register every request by requestId and remove when resolve/reject.
    return new Promise((resolve, reject) => {
      try {
        const rId = nextRequestId()

        SpatialWebEvent.addEventReceiver(rId, (result: JSBResponse) => {
          SpatialWebEvent.removeEventReceiver(rId)
          if (result.success) {
            resolve(CommandResultSuccess(result.data))
          } else {
            const { code, message } = result.data as JSBError
            resolve(CommandResultFailure(code, message))
          }
        })

        const ans = window.webspatialBridge.postMessage(rId, cmd, msg)
        if (ans !== '') {
          SpatialWebEvent.removeEventReceiver(rId)
          // sync call
          const result = JSON.parse(ans) as JSBResponse
          if (result.success) {
            resolve(CommandResultSuccess(result.data))
          } else {
            const { code, message } = result.data as JSBError
            resolve(CommandResultFailure(code, message))
          }
        }
      } catch (error: unknown) {
        console.error(
          `AndroidPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`,
        )
        const { code, message } = error as JSBError
        resolve(CommandResultFailure(code, message))
      }
    })
  }

  async callWebSpatialProtocol(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<CommandResult> {
    // Waiting for request to create spatial div
    return new Promise((resolve, reject) => {
      const createdId = nextRequestId()
      try {
        let windowProxy: any = null
        SpatialWebEvent.addEventReceiver(
          createdId,
          (result: { spatialId: string }) => {
            console.log('createdId', createdId, result.spatialId)
            resolve(
              CommandResultSuccess({
                windowProxy: windowProxy,
                id: result.spatialId,
              }),
            )
            SpatialWebEvent.removeEventReceiver(createdId)
          },
        )
        windowProxy = this.openWindow(
          command,
          query,
          target,
          features,
        ).windowProxy
        windowProxy?.open(`about:blank?rid=${createdId}`, '_self')
      } catch (error: unknown) {
        console.error(`open window error: ${error}`)
        const { code, message } = error as JSBError
        SpatialWebEvent.removeEventReceiver(createdId)
        resolve(CommandResultFailure(code, message))
      }
    })
  }

  callWebSpatialProtocolSync(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): CommandResult {
    const { spatialId: id = '', windowProxy } = this.openWindow(
      command,
      query,
      target,
      features,
    )

    return CommandResultSuccess({ windowProxy, id })
  }

  private openWindow(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ) {
    const windowProxy = window.open(
      `webspatial://${command}?${query || ''}`,
      target,
      features,
    )
    return { spatialId: '', windowProxy }
  }
}
