import { PlatformAbility, CommandResult } from '../interface'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from '../CommandResultUtils'
import { CheckWebViewCanCreateCommand } from '../../JSBCommand'

type JSBError = {
  message: string
}

let creatingElementCount = 0

export class AndroidPlatform implements PlatformAbility {
  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      // console.log(`${cmd}::${msg}`)
      const result = await window.webspatialBridge.postMessage(`${cmd}::${msg}`)
      return CommandResultSuccess(JSON.parse(result))
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
    // console.log(creatingElementCount)
    await new Promise(resolve => setTimeout(resolve, 16 * creatingElementCount))
    creatingElementCount++
    let canCreate = await new CheckWebViewCanCreateCommand().execute()
    // console.log("can create:", canCreate.data.can)
    while(!canCreate.data.can){
      await new Promise(resolve => setTimeout(resolve, 16))
      canCreate = await new CheckWebViewCanCreateCommand().execute()
    }
    // console.log("create spatial div start")
    const { windowProxy } = this.openWindow(
      command,
      query,
      target,
      features,
    )
    while(!windowProxy?.open){
      await new Promise(resolve => setTimeout(resolve, 16))
    }
    windowProxy?.open("about:blank", "_self")
    while(!windowProxy?.SpatialId) {
      await new Promise(resolve => setTimeout(resolve, 16))
      // console.log("loop wait")
    }
    let spatialId = windowProxy?.SpatialId
    // console.log(spatialId)
    // console.log("create spatial div end")
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
    return { spatialId: "", windowProxy }
  }
}
