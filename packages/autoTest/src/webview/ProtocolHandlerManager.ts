import {
  PuppeteerWebViewModel,
  WebViewElementInfo,
} from './PuppeteerWebViewModel'
import { Page } from 'puppeteer'
import { SpatialScene } from '../model/SpatialScene'
import { Spatialized2DElement } from '../model/Spatialized2DElement'
import { WebspatialProtocolHandler } from './WebspatialProtocolHandler'
import { SceneStateKind } from '../types/types'

// Define a safe type for SceneStateKind
type SafeSceneState = SceneStateKind | 'idle'

/**
 * Protocol handler type definition
 */
export type ProtocolHandler = (
  url: string,
) => Promise<WebViewElementInfo | null>

/**
 * ProtocolHandlerManager manages registration and dispatching of protocol handlers
 */
export class ProtocolHandlerManager {
  private static _instance: ProtocolHandlerManager
  private _protocolHandlers: Record<string, ProtocolHandler> = {}
  private _scenes: Map<string, SpatialScene> = new Map()
  private _elements: Map<string, Spatialized2DElement> = new Map()
  private _webspatialProtocolHandler: WebspatialProtocolHandler

  constructor() {
    // Initialize WebspatialProtocolHandler
    this._webspatialProtocolHandler = WebspatialProtocolHandler.getInstance()
    // Set protocol manager reference to break cyclic dependency
    this._webspatialProtocolHandler.setProtocolManager(this)
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProtocolHandlerManager {
    if (!ProtocolHandlerManager._instance) {
      ProtocolHandlerManager._instance = new ProtocolHandlerManager()
    }
    return ProtocolHandlerManager._instance
  }

  /**
   * Register protocol handler
   */
  public registerProtocolHandler(
    protocol: string,
    handler: ProtocolHandler,
  ): void {
    this._protocolHandlers[protocol] = handler
    console.log(`Protocol handler registered for: ${protocol}`)
  }

  /**
   * Unregister protocol handler
   */
  public unregisterProtocolHandler(protocol: string): void {
    delete this._protocolHandlers[protocol]
    console.log(`Protocol handler unregistered for: ${protocol}`)
  }

  /**
   * Handle URL (for testing)
   */
  public async handleUrl(url: string): Promise<WebViewElementInfo | null> {
    return this.handleProtocolUrl(url)
  }

  /**
   * Handle protocol URL
   */
  public async handleProtocolUrl(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    try {
      // Check whether URL starts with webspatial protocol
      if (this._webspatialProtocolHandler && url.startsWith('webspatial://')) {
        return await this._webspatialProtocolHandler.handleWebspatialProtocol(
          url,
        )
      }

      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')

      if (this._protocolHandlers[protocol]) {
        return await this._protocolHandlers[protocol](url)
      }

      console.warn(`No handler found for protocol: ${protocol}`)
    } catch (error) {
      console.error(`Error handling protocol URL: ${url}`, error)
    }
    return null
  }

  /**
   * Unregister scene
   */
  public unregisterScene(sceneId: string): void {
    this._scenes.delete(sceneId)
  }

  /**
   * Unregister element
   */
  public unregisterElement(elementId: string): void {
    this._elements.delete(elementId)
  }

  /**
   * Register webspatial protocol handler
   */
  public registerWebspatialProtocolHandler(): void {
    this.registerProtocolHandler(
      'webspatial',
      this.handleWebspatialProtocol.bind(this),
    )
  }

  /**
   * Handle webspatial protocol
   */
  private async handleWebspatialProtocol(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    try {
      const urlObj = new URL(url)
      const host = urlObj.host

      // Distinguish different actions based on host
      switch (host) {
        case 'createSpatialScene':
          // Create SpatialScene
          return await this.createSpatialScene(urlObj)
        case 'createSpatializedElement':
          // Create SpatializedElement
          return await this.createSpatializedElement(urlObj)
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
   * Get WebViewModel (with null checks)
   */
  public getWebViewModel(): PuppeteerWebViewModel | null {
    // Assume logic elsewhere sets _webViewModel
    return (this as any)._webViewModel || null
  }

  /**
   * Create SpatialScene
   */
  private async createSpatialScene(urlObj: URL): Promise<WebViewElementInfo> {
    // Get configuration from URL parameters
    const sceneUrl = urlObj.searchParams.get('url') || ''
    const windowStyle =
      (urlObj.searchParams.get('windowStyle') as any) || 'window'

    // Create SpatialScene
    const scene = new SpatialScene(sceneUrl, windowStyle, SceneStateKind.idle)

    // Store scene reference
    this._scenes.set(scene.id, scene)

    // Return WebViewElementInfo
    return {
      id: scene.id,
      webViewModel:
        scene.spatialWebViewModel || (this as any)._webViewModel || null,
    }
  }

  /**
   * Create SpatializedElement
   */
  private async createSpatializedElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    // To be implemented: integrate with createSpatializedElement
    return null
  }

  /**
   * Register SpatialScene
   */
  public registerScene(scene: SpatialScene): void {
    this._scenes.set(scene.id, scene)
  }

  /**
   * Get SpatialScene
   */
  public getScene(id: string): SpatialScene | undefined {
    return this._scenes.get(id)
  }

  /**
   * Register SpatializedElement
   */
  public registerElement(element: Spatialized2DElement): void {
    this._elements.set(element.id, element)
  }

  /**
   * Get SpatializedElement
   */
  public getElement(id: string): Spatialized2DElement | undefined {
    return this._elements.get(id)
  }

  /**
   * Initialize ProtocolHandlerManager
   */
  public static initialize(): void {
    const instance = this.getInstance()
    // Initialize webspatial protocol handler
    WebspatialProtocolHandler.initialize()
    console.log('ProtocolHandlerManager initialized')
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._protocolHandlers = {}
    this._scenes.clear()
    this._elements.clear()
    ProtocolHandlerManager._instance = undefined as any
  }
}
