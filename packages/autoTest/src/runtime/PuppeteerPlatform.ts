// Platform Adapter Interface Implementation

import {
  CommandResult,
  CommandResultSuccess,
  CommandResultFailure,
  JSBManager,
  CommandDataProtocol,
} from '../manager/JSBManager'

// Define interfaces required for platform adapter
export interface WebSpatialProtocolResult extends CommandResult {
  data: {
    windowProxy: WindowProxy
    id: string
  }
}

export interface PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult>
  callWebSpatialProtocol(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<WebSpatialProtocolResult>
  callWebSpatialProtocolSync(
    command: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WebSpatialProtocolResult
}

// Export JSBManager related content for API compatibility
export { JSBManager, CommandDataProtocol }

// Platform Ability Interface Implementation
export class PuppeteerPlatform implements PlatformAbility {
  private jsbManager: JSBManager

  constructor(jsbManager: JSBManager) {
    this.jsbManager = jsbManager
  }

  async callJSB(cmd: string, msg: string): Promise<CommandResult> {
    try {
      const message = `${cmd}::${msg}`
      const result = await this.jsbManager.handleMessage(message)
      return CommandResultSuccess(result)
    } catch (error) {
      console.error(`PuppeteerPlatform cmd: ${cmd}, msg: ${msg} error:`, error)
      return CommandResultFailure(
        'CommandError',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  async callWebSpatialProtocol(
    command: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<WebSpatialProtocolResult> {
    try {
      // Mock creation of spatial window
      const windowProxy = {} as WindowProxy
      const id = `mock-${command}-${Date.now()}`
      return CommandResultSuccess({ windowProxy, id })
    } catch (error) {
      return CommandResultFailure(
        'ProtocolError',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  callWebSpatialProtocolSync(
    command: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WebSpatialProtocolResult {
    try {
      const windowProxy = {} as WindowProxy
      const id = `mock-${command}-${Date.now()}`
      const result = CommandResultSuccess({ windowProxy, id })

      if (resultCallback) {
        resultCallback(result)
      }

      return result as WebSpatialProtocolResult
    } catch (error) {
      const result = CommandResultFailure(
        'ProtocolError',
        error instanceof Error ? error.message : 'Unknown error',
      )

      if (resultCallback) {
        resultCallback(result)
      }

      return result as WebSpatialProtocolResult
    }
  }
}
