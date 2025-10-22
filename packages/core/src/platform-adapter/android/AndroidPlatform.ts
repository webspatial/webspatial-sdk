import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'

type JSBError = {
  message: string
}

export class AndroidPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      console.log(`${cmd}::${msg}`)
      const result = await window.webspatialBridge.postMessage(`${cmd}::${msg}`)
      return CommandResultSuccess(result)
    } catch (error: unknown) {
      // console.error(`AndroidPlatform cmd: ${cmd}, msg: ${msg} error: ${error}`)
      const { code, message } = JSON.parse((error as JSBError).message)
      return CommandResultFailure(code, message)
    }
  }

  async callWebSpatialProtocol(
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
    await new Promise(resolve => setTimeout(resolve, 100))
    /**
     * Note: Although the webview opened with a custom scheme URL can obtain the window object,
     * it cannot be successfully loaded. Therefore, a redirect to about:blank is required
     * to ensure proper webview initialization and functionality.
     */
    windowProxy?.open('about:blank?spatialId=' + id, '_self')
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
    let spatialId = ua?.match(
      /\b([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\b/gi,
    )?.[0]
    if (!spatialId) {
      spatialId = query?.match(
        /\b([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\b/gi,
      )?.[0]
    }
    console.log('spatialId:', spatialId)
    return { spatialId, windowProxy }
  }
}
