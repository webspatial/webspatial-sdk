import {
  CommandResult,
  PlatformAbility,
  WebSpatialProtocolResult,
} from '../interface'

export class SSRPlatform implements PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult> {
    return Promise.resolve({
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    })
  }
  callWebSpatialProtocol(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<WebSpatialProtocolResult> {
    return Promise.resolve({
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    })
  }
  callWebSpatialProtocolSync(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WebSpatialProtocolResult {
    return {
      success: true,
      data: undefined,
      errorCode: undefined,
      errorMessage: undefined,
    }
  }
}
