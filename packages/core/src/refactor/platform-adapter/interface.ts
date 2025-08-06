export interface CommandResult {
  success: boolean
  data: any
  errorCode: string | undefined
  errorMessage: string | undefined
}

export interface WebSpatialProtocolResult extends CommandResult {
  success: boolean
  data:
    | {
        windowProxy: WindowProxy
        id: string
      }
    | undefined
  errorCode: string | undefined
  errorMessage: string | undefined
}

export interface PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult>
  callWebSpatialProtocol(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<WebSpatialProtocolResult>

  callWebSpatialProtocolSync(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WebSpatialProtocolResult
}
