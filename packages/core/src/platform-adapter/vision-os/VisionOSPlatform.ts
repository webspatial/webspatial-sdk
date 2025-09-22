import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'


type JSBError = {
  message: string
}

export class VisionOSPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      const result = await window.webkit.messageHandlers.bridge.postMessage(
        `${cmd}::${msg}`,
      )
      return CommandResultSuccess(result)
    } catch (error: unknown) {
      // console.error(`VisionOSPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`)
      const { code, message } = JSON.parse((error as JSBError).message)
      return CommandResultFailure(code, message)
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
    const ua = windowProxy?.navigator.userAgent
    const spatialId = ua?.match(
      /\b([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\b/gi,
    )?.[0]

    return { spatialId, windowProxy }
  }
}
