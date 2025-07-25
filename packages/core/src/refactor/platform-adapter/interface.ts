export interface CommandResult {
  success: boolean
  data: any
  errorCode: string
  errorMessage: string
}

export interface PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult>
}
