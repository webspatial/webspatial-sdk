import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'

// declare global {
//   interface Window {
//     webkit: {
//       messageHandlers: Record<
//         string,
//         {
//           postMessage(
//             message: string,
//             reply?: (reply: any) => any,
//             error?: (error: string) => void,
//           ): any
//         }
//       >
//     }
//   }
// }

export class VisionOSPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      const result = await window.webkit.messageHandlers.bridge.postMessage(
        `${cmd}::${msg}`,
      )
      return CommandResultSuccess(result)
    } catch (error) {
      console.error(`VisionOSPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`)
      return CommandResultFailure('errorNo', 'error')
    }
  }

  callWebSpatialProtocol(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<CommandResult> {
    const { spatialId: id, windowProxy } = this.openWindow(
      command,
      query,
      target,
      features,
    )
    return Promise.resolve(
      CommandResultSuccess({ windowProxy: windowProxy, id }),
    )
  }

  callWebSpatialProtocolSync(
    command: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WindowProxy | null {
    const { spatialId: id, windowProxy } = this.openWindow(
      command,
      query,
      target,
      features,
    )

    if (resultCallback) {
      setTimeout(() => {
        const result = CommandResultSuccess({ windowProxy: windowProxy, id })
        resultCallback(result)
      }, 0)
    }

    return windowProxy
  }

  private openWindow(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ) {
    console.log('openWindow:', command, query, target, features)
    const windowProxy = window.open(
      `webspatial://${command}?${query || ''}`,
      target,
      features,
    )
    const ua = windowProxy?.navigator.userAgent
    const spatialId = ua?.match(
      /\b([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\b/gi,
    )?.[0]

    return { spatialId, windowProxy }
  }
}
