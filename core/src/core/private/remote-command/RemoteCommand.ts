export class RemoteCommand {
  private static requestCounter = 0

  command: string

  data: any

  requestID: number

  constructor(cmd: string, data?: any) {
    this.command = cmd
    this.data = data
    this.requestID = ++RemoteCommand.requestCounter
  }
}
