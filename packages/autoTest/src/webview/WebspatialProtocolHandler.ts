import { URL } from 'url'
import { ProtocolHandlerManager } from './ProtocolHandlerManager'
import { SpatialScene } from '../model/SpatialScene'
import { Spatialized2DElement } from '../model/Spatialized2DElement'
import {
  SpatializedElementType,
  WindowStyle,
  SceneStateKind,
} from '../types/types'
import { PuppeteerWebViewModel } from './PuppeteerWebViewModel'
import { WebViewElementInfo } from '../model/SpatialScene'

/**
 * WebspatialProtocolHandler is responsible for handling operations of the webspatial protocol
 */
export class WebspatialProtocolHandler {
  private static _instance: WebspatialProtocolHandler
  private _protocolManager: ProtocolHandlerManager | null = null

  /**
   * Get singleton instance
   */
  public static getInstance(): WebspatialProtocolHandler {
    if (!WebspatialProtocolHandler._instance) {
      WebspatialProtocolHandler._instance = new WebspatialProtocolHandler()
    }
    return WebspatialProtocolHandler._instance
  }

  constructor() {
    // Remove ProtocolHandlerManager dependency from constructor to avoid cyclic dependency
  }

  /**
   * Set protocol manager
   */
  public setProtocolManager(manager: ProtocolHandlerManager): void {
    this._protocolManager = manager
    this.registerProtocolHandlers()
  }

  /**
   * Register all protocol handlers
   */
  private registerProtocolHandlers(): void {
    if (this._protocolManager) {
      // Register the main handler for webspatial protocol
      this._protocolManager.registerProtocolHandler(
        'webspatial',
        this.handleWebspatialProtocol.bind(this),
      )
    }
  }

  /**
   * Handle webspatial protocol URL
   */
  public async handleWebspatialProtocol(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    try {
      const urlObj = new URL(url)
      const host = urlObj.host
      console.log(
        `WebspatialProtocolHandler received msg: handleWebspatialProtocol, host: ${host}`,
      )

      // Distinguish different actions based on host
      switch (host) {
        case 'createSpatialScene':
          return await this.handleCreateSpatialScene(urlObj)
        case 'createSpatializedElement':
          return await this.handleCreateSpatializedElement(urlObj)
        case 'updateSpatializedElement':
          return await this.handleUpdateSpatializedElement(urlObj)
        case 'addChildElement':
          return await this.handleAddChildElement(urlObj)
        default:
          console.warn(`Unknown webspatial action: ${host}`)
          return null
      }
    } catch (error) {
      console.error('Error handling webspatial protocol:', error)
      return null
    }
  }

  /**
   * Handle request to create SpatialScene
   */
  private async handleCreateSpatialScene(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      // Get configuration from URL parameters
      const sceneUrl = urlObj.searchParams.get('url') || ''
      const windowStyleStr = urlObj.searchParams.get('windowStyle') || 'window'
      const windowStyle = windowStyleStr as WindowStyle

      // Create a new SpatialScene
      const scene = new SpatialScene(sceneUrl, windowStyle, SceneStateKind.idle)

      console.log(
        `Created new SpatialScene with ID: ${scene.id}, URL: ${sceneUrl}`,
      )

      // Return WebViewElementInfo
      if (scene.spatialWebViewModel) {
        return {
          id: scene.id,
          webViewModel: scene.spatialWebViewModel,
        }
      }
    } catch (error) {
      console.error('Error creating SpatialScene:', error)
    }
    return null
  }

  /**
   * Handle request to create SpatializedElement
   */
  private async handleCreateSpatializedElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      // Get configuration from URL parameters
      const typeParam =
        urlObj.searchParams.get('type') ||
        SpatializedElementType.Spatialized2DElement
      const elementType = typeParam as SpatializedElementType
      const widthStr = urlObj.searchParams.get('width') || '300'
      const heightStr = urlObj.searchParams.get('height') || '200'
      const xStr = urlObj.searchParams.get('x') || '0'
      const yStr = urlObj.searchParams.get('y') || '0'

      // Parse numeric parameters
      const width = parseInt(widthStr, 10)
      const height = parseInt(heightStr, 10)
      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)

      // Create element
      let element: Spatialized2DElement | null = null

      switch (elementType) {
        case SpatializedElementType.Spatialized2DElement:
          element = new Spatialized2DElement()
          break
        default:
          console.warn(`Unsupported element type: ${elementType}`)
          return null
      }

      if (!element) {
        return null
      }

      // Set element properties
      element.width = width
      element.height = height
      element.clientX = x
      element.clientY = y

      // Register element
      if (!this._protocolManager) {
        console.error('Protocol manager not initialized')
        return null
      }
      this._protocolManager.registerElement(element)

      // Create a mock WebController
      const mockWebController = {
        page: {} as any,
        registerOpenWindowInvoke: (handler: any) => {},
        registerNavigationInvoke: (handler: any) => {},
        registerJSBListener: (handler: any) => {},
        openWindowInvoke: async (url: string) => null,
        navigationInvoke: async (url: string) => false,
        sendJSBMessage: (message: any) => {},
        getIframeByUrl: (url: string) => undefined,
        getAllIframes: () => new Map(),
        dispose: () => {},
      }

      // Create WebViewModel
      const webViewModel = new PuppeteerWebViewModel(mockWebController as any)

      console.log(
        `Created new SpatializedElement with ID: ${element.id}, Type: ${elementType}`,
      )

      return {
        id: element.id,
        webViewModel: webViewModel,
      }
    } catch (error) {
      console.error('Error creating SpatializedElement:', error)
    }
    return null
  }

  /**
   * Handle request to update SpatializedElement
   */
  private async handleUpdateSpatializedElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      const elementId = urlObj.searchParams.get('id')
      if (!elementId) {
        console.error('Element ID is required for update')
        return null
      }

      if (!this._protocolManager) {
        console.error('Protocol manager not initialized')
        return null
      }
      const element = this._protocolManager.getElement(elementId)
      if (!element) {
        console.error(`Element not found: ${elementId}`)
        return null
      }

      // Update element properties
      const width = urlObj.searchParams.get('width')
      const height = urlObj.searchParams.get('height')
      const x = urlObj.searchParams.get('x')
      const y = urlObj.searchParams.get('y')
      const opacity = urlObj.searchParams.get('opacity')

      if (width) element.width = parseInt(width, 10)
      if (height) element.height = parseInt(height, 10)
      if (x && y) {
        element.clientX = parseInt(x, 10)
        element.clientY = parseInt(y, 10)
      }
      if (opacity) element.opacity = parseFloat(opacity)

      console.log(`Updated SpatializedElement: ${elementId}`)

      // Return updated element info
      if (element.id) {
        return {
          id: element.id,
          webViewModel: {} as PuppeteerWebViewModel, // simplified return
        }
      }
    } catch (error) {
      console.error('Error updating SpatializedElement:', error)
    }
    return null
  }

  /**
   * Handle request to add child element
   */
  private async handleAddChildElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      const parentId = urlObj.searchParams.get('parentId')
      const childId = urlObj.searchParams.get('childId')

      if (!parentId || !childId) {
        console.error('Parent ID and Child ID are required')
        return null
      }

      if (!this._protocolManager) {
        console.error('Protocol manager not initialized')
        return null
      }
      const parent = this._protocolManager.getElement(parentId)
      const child = this._protocolManager.getElement(childId)

      if (!parent || !child) {
        console.error(
          `Parent or child element not found: parent=${parentId}, child=${childId}`,
        )
        return null
      }

      // Add child element
      parent.addChild(child)

      console.log(`Added child ${childId} to parent ${parentId}`)

      return {
        id: parentId,
        webViewModel: {} as PuppeteerWebViewModel, // simplified return
      }
    } catch (error) {
      console.error('Error adding child element:', error)
    }
    return null
  }

  /**
   * Initialize protocol handler
   */
  public static initialize(): void {
    const instance = this.getInstance()
    console.log('WebspatialProtocolHandler initialized')
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    WebspatialProtocolHandler._instance = undefined as any
  }
}
