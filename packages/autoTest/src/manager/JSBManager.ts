// JSBManager.ts
// Core JSB Message Handler Implementation

// Utility Functions
export function CommandResultSuccess<T>(data: T): CommandResult {
  return {
    success: true,
    data,
  }
}

export function CommandResultFailure(
  errorCode: string,
  errorMessage: string,
): CommandResult {
  return {
    success: false,
    data: null,
    errorCode,
    errorMessage,
  }
}

// Command Protocol Interface Definition
export interface CommandDataProtocol {
  commandType: string
}

// Command Result Interface Definition
export interface CommandResult {
  success: boolean
  data: any
  errorCode?: string
  errorMessage?: string
}

// JSBManager Implementation
export class JSBManager {
  private typeMap = new Map<string, any>()
  private actionWithDataMap = new Map<
    string,
    (data: any, result: (result: any) => void) => void
  >()
  private actionWithoutDataMap = new Map<
    string,
    (result: (result: any) => void) => void
  >()

  // Mock Domain Model Storage
  public spatialObjects: Map<string, any> = new Map()
  private spatialScenes: Map<string, any> = new Map()

  // Register Command Type
  register<T extends CommandDataProtocol>(type: new () => T): void {
    const instance = new type()
    this.typeMap.set(instance.commandType, type)
  }

  // Register Command Handler with Data
  registerWithData<T extends CommandDataProtocol>(
    type: new () => T,
    handler: (data: T, callback: (result: any) => void) => void,
  ): void {
    const instance = new type()
    this.typeMap.set(instance.commandType, type)
    this.actionWithDataMap.set(instance.commandType, handler)
  }

  // Register Command Handler without Data
  registerWithoutData<T extends CommandDataProtocol>(
    type: new () => T,
    handler: (callback: (result: any) => void) => void,
  ): void {
    const instance = new type()
    this.typeMap.set(instance.commandType, type)
    this.actionWithoutDataMap.set(instance.commandType, handler)
  }

  // Remove Command
  remove<T extends CommandDataProtocol>(type: new () => T): void {
    const instance = new type()
    this.typeMap.delete(instance.commandType)
    this.actionWithDataMap.delete(instance.commandType)
    this.actionWithoutDataMap.delete(instance.commandType)
  }

  // Clear All Commands
  clear(): void {
    this.typeMap.clear()
    this.actionWithDataMap.clear()
    this.actionWithoutDataMap.clear()
  }

  // Process Message
  async handleMessage(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const parts = message.split('::')
        const actionKey = parts[0]
        const hasData = parts.length === 2 && parts[1] !== ''

        if (hasData) {
          const data = this.deserialize(actionKey, parts[1])
          const action = this.actionWithDataMap.get(actionKey)

          if (action) {
            action(data, resolve)
          } else {
            reject(new Error(`Invalid JSB: No handler for ${actionKey}`))
          }
        } else {
          const action = this.actionWithoutDataMap.get(actionKey)

          if (action) {
            action(resolve)
          } else {
            reject(new Error(`Invalid JSB: No handler for ${actionKey}`))
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private deserialize(cmdType: string, cmdContent: string): any {
    const type = this.typeMap.get(cmdType)
    if (!type) {
      // If type not found, return parsed object directly
      return JSON.parse(cmdContent)
    }

    const data = JSON.parse(cmdContent)
    const instance = new type()
    Object.assign(instance, data)
    return instance
  }

  // Store and Retrieve Spatial Objects
  addSpatialObject(id: string, object: any): void {
    this.spatialObjects.set(id, object)
  }

  getSpatialObject(id: string): any | undefined {
    return this.spatialObjects.get(id)
  }

  removeSpatialObject(id: string): void {
    this.spatialObjects.delete(id)
  }

  // Store and Retrieve Spatial Scenes
  addSpatialScene(id: string, scene: any): void {
    this.spatialScenes.set(id, scene)
  }

  getSpatialScene(id: string): any | undefined {
    return this.spatialScenes.get(id)
  }

  removeSpatialScene(id: string): void {
    this.spatialScenes.delete(id)
  }
}

export default JSBManager
