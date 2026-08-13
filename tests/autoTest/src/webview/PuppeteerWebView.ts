import { Page, Frame } from 'puppeteer'
import { PuppeteerWebController } from './PuppeteerWebController'
import { PuppeteerWebViewModel } from './PuppeteerWebViewModel'

declare global {
  interface Window {
    __onWebSpatialMessage?: (message: any) => void
  }
}

/**
 * PuppeteerWebView represents a WebView instance, managing iframes and page interactions
 */
export class PuppeteerWebView {
  private _webController: PuppeteerWebController
  private _webViewModel: PuppeteerWebViewModel
  private _iframeMap: Map<string, Frame> = new Map()
  private _isInitialized: boolean = false

  constructor(page: Page) {
    this._webController = new PuppeteerWebController(page)
    this._webViewModel = this._webController.webViewModel
    this.initialize()
  }

  /**
   * Get WebController instance
   */
  get webController(): PuppeteerWebController {
    return this._webController
  }

  /**
   * Get WebViewModel instance
   */
  get webViewModel(): PuppeteerWebViewModel {
    return this._webViewModel
  }

  /**
   * Get current page
   */
  get page(): Page {
    return this._webController.page
  }

  /**
   * Initialize WebView
   */
  private async initialize(): Promise<void> {
    if (!this._isInitialized) {
      // Set up iframe monitoring
      this.setupIframeMonitoring()
      // Set up message listener
      this.setupMessageListener()
      this._isInitialized = true
    }
  }

  /**
   * Set up iframe monitoring
   */
  private setupIframeMonitoring(): void {
    // Listen to frameattached event to handle newly added iframes
    this._webController.page.on('frameattached', frame => {
      if (frame !== this._webController.page.mainFrame()) {
        this.registerIframe(frame)
      }
    })

    // Listen to framedetached event to handle removed iframes
    this._webController.page.on('framedetached', frame => {
      this.unregisterIframe(frame)
    })

    // Listen to framenavigated event to handle iframe navigation
    this._webController.page.on('framenavigated', frame => {
      if (frame !== this._webController.page.mainFrame()) {
        this.updateIframe(frame)
      }
    })
  }

  /**
   * Set up message listener
   */
  private setupMessageListener(): void {
    // Inject message listener code into the page
    this._webController.page.exposeFunction(
      '__onWebSpatialMessage',
      (message: any) => {
        this.handleMessage(message)
      },
    )

    // Inject initialization script
    this._webController.page.evaluateOnNewDocument(() => {
      // Listen to window.postMessage events
      window.addEventListener('message', event => {
        if (event.data && event.data.type === 'WEB_SPATIAL_MESSAGE') {
          window.__onWebSpatialMessage?.(event.data)
        }
      })
    })
  }

  /**
   * Register iframe
   */
  private registerIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    this._iframeMap.set(frameId, frame)
    console.log(`Iframe registered: ${frameId}`)
  }

  /**
   * Unregister iframe
   */
  private unregisterIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    this._iframeMap.delete(frameId)
    console.log(`Iframe unregistered: ${frameId}`)
  }

  /**
   * Update iframe information
   */
  private updateIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    if (this._iframeMap.has(frameId)) {
      // Update iframe reference
      this._iframeMap.set(frameId, frame)
      console.log(`Iframe updated: ${frameId}`)
    } else {
      // If not exists, register it
      this.registerIframe(frame)
    }
  }

  /**
   * Generate a unique identifier for iframe
   */
  private generateFrameId(frame: Frame): string {
    // Use frame.url() and frame.parentFrame() info to build a unique ID
    const url = frame.url() || 'about:blank'
    const parentUrl = frame.parentFrame()?.url() || 'main'
    return `${parentUrl}_${url}_${Date.now()}`
  }

  /**
   * Handle received message
   */
  private handleMessage(message: any): void {
    // Handle JSB commands
    if (message.type === 'JSB_COMMAND') {
      this._webViewModel.handleJSBCommand(message.data)
    }
  }

  /**
   * Get all iframes
   */
  getAllIframes(): Map<string, Frame> {
    return this._iframeMap
  }

  /**
   * Find iframe by URL
   */
  findIframeByUrl(url: string): Frame | undefined {
    for (const [id, frame] of this._iframeMap.entries()) {
      if (frame.url() === url) {
        return frame
      }
    }
    return undefined
  }

  /**
   * Send message to specified iframe
   */
  async sendMessageToIframe(frameId: string, message: any): Promise<boolean> {
    const frame = this._iframeMap.get(frameId)
    if (frame) {
      try {
        await frame.evaluate(msg => {
          window.postMessage(msg, '*')
        }, message)
        return true
      } catch (error) {
        console.error(`Error sending message to iframe ${frameId}:`, error)
      }
    }
    return false
  }

  /**
   * Send message to all iframes
   */
  async broadcastMessageToAllIframes(message: any): Promise<void> {
    for (const [frameId] of this._iframeMap.entries()) {
      await this.sendMessageToIframe(frameId, message)
    }
  }

  /**
   * Load URL
   */
  async loadUrl(url: string): Promise<void> {
    await this._webViewModel.load(url)
  }

  /**
   * Load HTML content
   */
  async loadHTML(html: string): Promise<void> {
    await this._webViewModel.loadHTML(html)
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._iframeMap.clear()
    this._webController.dispose()
    this._webViewModel.dispose()
  }
}
