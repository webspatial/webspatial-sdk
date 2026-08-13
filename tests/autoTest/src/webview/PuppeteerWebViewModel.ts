import { PuppeteerWebController } from './PuppeteerWebController'
import { SpatialScene } from '../model/SpatialScene'
import { Spatialized2DElement } from '../model/Spatialized2DElement'
import { ProtocolHandlerManager } from './ProtocolHandlerManager'
import { WebspatialProtocolHandler } from './WebspatialProtocolHandler'

/**
 * WebViewElementInfo interface, used to return created element info
 */
export interface WebViewElementInfo {
  id: string
  webViewModel: PuppeteerWebViewModel
}

/**
 * PuppeteerWebViewModel manages WebView state and behavior, and registers protocol handlers
 */
export class PuppeteerWebViewModel {
  private _webController: PuppeteerWebController
  private _url: string
  private _openWindowList: Record<
    string,
    (url: string) => Promise<WebViewElementInfo | null>
  > = {}
  private _navigationList: Record<string, (url: string) => Promise<boolean>> =
    {}
  private _jsbCommandList: Record<string, (command: any) => void> = {}
  private _protocolHandlerManager: ProtocolHandlerManager
  private _webspatialProtocolHandler: WebspatialProtocolHandler

  constructor(webController: PuppeteerWebController, url: string = '') {
    this._webController = webController
    this._url = url
    this._protocolHandlerManager = ProtocolHandlerManager.getInstance()
    this._webspatialProtocolHandler = WebspatialProtocolHandler.getInstance()
    this.setupEventHandlers()
    this.setupProtocolHandlers()
  }

  /**
   * Get WebController instance
   */
  get webController(): PuppeteerWebController {
    return this._webController
  }

  /**
   * Get URL
   */
  get url(): string {
    return this._url
  }

  /**
   * Set URL
   */
  set url(value: string) {
    this._url = value
  }

  /**
   * Set event handlers
   */
  private setupEventHandlers(): void {
    // Register onOpenWindowInvoke handler
    this._webController.registerOpenWindowInvoke(
      this.onOpenWindowInvoke.bind(this),
    )

    // Register onNavigationInvoke handler
    this._webController.registerNavigationInvoke(
      this.onNavigationInvoke.bind(this),
    )
  }

  /**
   * Load specified URL
   */
  async load(url: string): Promise<void> {
    this._url = url
    await this._webController.page.goto(url)
  }

  /**
   * Load HTML content
   */
  async loadHTML(html: string): Promise<void> {
    await this._webController.page.setContent(html)
  }

  /**
   * Add protocol handler
   */
  addOpenWindowListener(
    protocol: string,
    handler: (url: string) => Promise<WebViewElementInfo | null>,
  ): void {
    this._openWindowList[protocol] = handler
  }

  /**
   * Remove protocol handler
   */
  removeOpenWindowListener(protocol: string): void {
    delete this._openWindowList[protocol]
  }

  /**
   * Add navigation handler
   */
  addNavigationListener(
    protocol: string,
    handler: (url: string) => Promise<boolean>,
  ): void {
    this._navigationList[protocol] = handler
  }

  /**
   * Remove navigation handler
   */
  removeNavigationListener(protocol: string): void {
    delete this._navigationList[protocol]
  }

  /**
   * Add JSB command handler
   */
  addJSBListener(commandName: string, handler: (command: any) => void): void {
    this._jsbCommandList[commandName] = handler
  }

  /**
   * Remove JSB command handler
   */
  removeJSBListener(commandName: string): void {
    delete this._jsbCommandList[commandName]
  }

  /**
   * Handle open window request
   */
  async onOpenWindowInvoke(url: string): Promise<any> {
    try {
      // Check if the URL uses webspatial protocol
      if (url.startsWith('webspatial://')) {
        console.log(`Handling webspatial protocol URL: ${url}`)
        // Directly handle via WebspatialProtocolHandler
        return await this._webspatialProtocolHandler.handleWebspatialProtocol(
          url,
        )
      }

      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')

      // Check if there is a corresponding protocol handler
      if (this._openWindowList[protocol]) {
        return await this._openWindowList[protocol](url)
      }
    } catch (error) {
      console.error('Error handling open window:', error)
    }
    return null
  }

  /**
   * Handle navigation request
   */
  async onNavigationInvoke(url: string): Promise<boolean> {
    try {
      // Check if the URL uses webspatial protocol
      if (url.startsWith('webspatial://')) {
        console.log(`Intercepting navigation for webspatial protocol: ${url}`)
        // For webspatial protocol, intercept navigation and handle via the protocol handler
        await this._webspatialProtocolHandler.handleWebspatialProtocol(url)
        return true // return true indicates navigation intercepted
      }

      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')

      // Check if there is a corresponding navigation handler
      if (this._navigationList[protocol]) {
        return await this._navigationList[protocol](url)
      }
    } catch (error) {
      console.error('Error handling navigation:', error)
    }
    return false
  }

  /**
   * Handle JSB command
   */
  handleJSBCommand(command: any): void {
    if (command && command.name && this._jsbCommandList[command.name]) {
      this._jsbCommandList[command.name](command)
    }
  }

  /**
   * Send message to web page
   */
  async sendMessage(message: any): Promise<void> {
    try {
      await this._webController.page.evaluate(msg => {
        // Send message to the page
        window.postMessage(msg, '*')
      }, message)
    } catch (error) {
      console.error('Error sending message to web page:', error)
    }
  }

  /**
   * Set up protocol handlers
   */
  private setupProtocolHandlers(): void {
    // Register open window handler for webspatial protocol
    this.addOpenWindowListener(
      'webspatial',
      this._webspatialProtocolHandler.handleWebspatialProtocol.bind(
        this._webspatialProtocolHandler,
      ),
    )

    // Register navigation handler for webspatial protocol
    this.addNavigationListener('webspatial', async (url: string) => {
      await this._webspatialProtocolHandler.handleWebspatialProtocol(url)
      return true // intercept navigation
    })
  }

  /**
   * Remove all open window listeners
   */
  removeAllOpenWindowListeners(): void {
    this._openWindowList = {}
  }

  /**
   * Remove all navigation listeners
   */
  removeAllNavigationListeners(): void {
    this._navigationList = {}
  }

  /**
   * Remove all JSB listeners
   */
  removeAllJSBListeners(): void {
    this._jsbCommandList = {}
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.removeAllOpenWindowListeners()
    this.removeAllNavigationListeners()
    this.removeAllJSBListeners()
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.removeAllListeners()
  }
}
