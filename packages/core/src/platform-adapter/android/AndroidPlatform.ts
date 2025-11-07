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

function addRequestId(msg: string, rId: string): string {
  let updatedMsg = msg
  if (msg && msg.trim() !== '{}') {
    updatedMsg = msg.slice(0, -1) + `,"requestId":"${rId}"}`
  } else {
    // If msg is empty, create new object with requestId
    updatedMsg = `{"requestId":"${rId}"}`
  }
  return updatedMsg
}

export class AndroidPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      try {
        const rId = `rId${++requestId}`
        // Insert requestId into end of msg by string manipulation
        const updatedMsg = addRequestId(msg, rId)

        // console.log(`${cmd}::${updatedMsg}`)
        SpatialWebEvent.addEventReceiver(rId, (result: JSBResponse) => {
          SpatialWebEvent.removeEventReceiver(rId)
          if (result.success) {
            resolve(CommandResultSuccess(result.data))
          } else {
            const { code, message } = result.data as JSBError
            reject(CommandResultFailure(code, message))
          }
        })
        window.webspatialBridge.postMessage(`${cmd}::${updatedMsg}`)
      } catch (error: unknown) {
        console.error(
          `AndroidPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`,
        )
        const { code, message } = error as JSBError
        reject(CommandResultFailure(code, message))
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
    await new Promise(resolve => setTimeout(resolve, 16 * creatingElementCount))
    // Count the current total number of created spatial div queues
    creatingElementCount++
    // Create a spatial div through JSB polling request
    let canCreate = await new CheckWebViewCanCreateCommand().execute()
    while (!canCreate.data.can) {
      await new Promise(resolve => setTimeout(resolve, 16))
      canCreate = await new CheckWebViewCanCreateCommand().execute()
    }
    // Request successful, call window.open
    const { windowProxy } = this.openWindow(command, query, target, features)
    // Polling waiting for windowProxy to convert into a real window object
    while (!windowProxy?.open) {
      await new Promise(resolve => setTimeout(resolve, 16))
    }
    // Make the page renderable through window.open
    windowProxy?.open('about:blank', '_self')
    // Polling to check if SpatialId injection is successful
    while (!windowProxy?.SpatialId) {
      await new Promise(resolve => setTimeout(resolve, 16))
    }
    let spatialId = windowProxy?.SpatialId
    creatingElementCount--
    return Promise.resolve(
      CommandResultSuccess({ windowProxy: windowProxy, id: spatialId }),
    )
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
