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
  callJSB(cmd: string, msg: string): Promise<CommandResult> {
    window.webkit.messageHandlers.bridge.postMessage(`${cmd}::${msg}`)
    return Promise.resolve(CommandResultSuccess(''))

    // return new Promise((resolve, reject) => {
    //     window.webkit.messageHandlers.bridge.postMessage(
    //         msg,
    //         (reply) => {
    //             resolve(CommandResultSuccess(reply))
    //         },
    //         (error) => {
    //             reject(CommandResultFailure('errorNo', error))
    //         })
    // })
  }
}
