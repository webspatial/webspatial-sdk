declare global {
  interface CSSStyleDeclaration {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-z-index'?: number | string
  }

  // Extend Window interface to add JSB related methods
  interface Window {
    __handleJSBMessage?: (message: string) => Promise<any>
    __platform_adapter_hook?: (platform: any) => void
    // Custom property for JSB bridge functionality
    customJSBBridge?: {
      messageHandlers?: {
        bridge?: {
          postMessage?: (message: string) => Promise<any>
        }
      }
    }
    // Spatial scene inspection interface
    inspectCurrentSpatialScene?: () => Promise<WebSpatial.SpatialSceneInfo>
    // Spatial environment flags
    WebSpatialEnabled?: boolean
    WebSpatialNativeVersion?: string
  }

  // Extend Element interface with click method to support test environment
  interface Element {
    click(): void
  }

  interface CSSProperties {
    '--xr-background-material'?: string
    '--xr-z-index'?: number | string
  }
}

declare module 'react' {
  interface CSSProperties {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-z-index'?: number | string
  }
}

export namespace JSX {
  //   export type IntrinsicElements = {
  //     [K in keyof ReactJSXIntrinsicElements]: ReactJSXIntrinsicElements[K] & {
  //       style?: React.CSSProperties
  //       'enable-xr'?: boolean
  //     }
  //   }
}

// Spatial Object Type Declarations
export namespace WebSpatial {
  type SpatialObject = {
    id: string
    type: string
    properties: Record<string, any>
  }

  type SpatialScene = {
    id: string
    name: string
    objects: SpatialObject[]
  }

  // Enhanced SpatialSceneInfo interface for inspection
  type SpatialSceneInfo = {
    id: string
    name: string
    version: string
    children: Record<string, SpatializedElementInfo>
    properties: Record<string, any>
  }

  type SpatializedElementInfo = {
    id: string
    type: string
    transform?: {
      translation?: number[]
      rotation?: number[]
      scale?: number[]
    }
    properties?: Record<string, any>
  }

  type Spatialized2DElement = {
    id: string
    element: HTMLElement
    properties: Record<string, any>
  }

  type JSBCommand = {
    commandType: string
    payload?: Record<string, any>
  }

  type CommandHandler = (command: JSBCommand) => Promise<any>

  // Preserve original interfaces for backward compatibility
  interface UpdateSpatialSceneProperties extends JSBCommand {
    commandType: 'UpdateSpatialSceneProperties'
    id?: string
    name?: string
    properties?: Record<string, any>
  }

  interface CreateSpatialScene extends JSBCommand {
    commandType: 'CreateSpatialScene'
    id?: string
    name?: string
    version?: string
    properties?: Record<string, any>
  }

  interface AddSpatializedElementToSpatialScene extends JSBCommand {
    commandType: 'AddSpatializedElementToSpatialScene'
    sceneId?: string
    elementId: string
  }

  interface InspectSpatialScene extends JSBCommand {
    commandType: 'InspectSpatialScene'
    id?: string
  }

  interface CreateSpatialized2DElement extends JSBCommand {
    commandType: 'CreateSpatialized2DElement'
  }

  interface UpdateSpatialized2DElementProperties extends JSBCommand {
    commandType: 'UpdateSpatialized2DElementProperties'
    id: string
    transform?: any
    style?: any
  }

  interface Inspect extends JSBCommand {
    commandType: 'Inspect'
    id?: string
  }
}
