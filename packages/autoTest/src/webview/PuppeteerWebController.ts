import { Page, Frame, Browser } from 'puppeteer'
import { PuppeteerWebViewModel } from './PuppeteerWebViewModel'
import { WebViewElementInfo } from '../model/SpatialScene'

/**
 * PuppeteerWebController manages WebView in Puppeteer, handling protocol interception and iframe management
 */
export class PuppeteerWebController {
  private _page: Page
  private _webViewModel: PuppeteerWebViewModel
  private _openWindowInvoke?: (url: string) => Promise<any>
  private _navigationInvoke?: (url: string) => Promise<boolean>
  private _jsbListener?: (message: any) => void
  private _iframes: Map<string, Frame> = new Map()

  constructor(page: Page) {
    this._page = page
    this._webViewModel = new PuppeteerWebViewModel(this)
    this.setupProtocolInterception()
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
    return this._page
  }

  /**
   * Register open-window handler
   */
  registerOpenWindowInvoke(handler: (url: string) => Promise<any>): void {
    this._openWindowInvoke = handler
  }

  /**
   * Register navigation handler
   */
  registerNavigationInvoke(handler: (url: string) => Promise<boolean>): void {
    this._navigationInvoke = handler
  }

  /**
   * Register JSB message handler
   */
  registerJSBListener(handler: (message: any) => void): void {
    this._jsbListener = handler
  }

  /**
   * Handle open-window request
   */
  async openWindowInvoke(url: string): Promise<any> {
    if (this._openWindowInvoke) {
      return await this._openWindowInvoke(url)
    }
    return null
  }

  /**
   * Handle navigation request
   */
  async navigationInvoke(url: string): Promise<boolean> {
    if (this._navigationInvoke) {
      return await this._navigationInvoke(url)
    }
    return false
  }

  /**
   * Send JSB message
   */
  sendJSBMessage(message: any): void {
    if (this._jsbListener) {
      this._jsbListener(message)
    }
  }

  /**
   * Set up protocol interception
   */
  private setupProtocolInterception(): void {
    // Listen to page navigation events
    this._page.on('framenavigated', frame => {
      // Store iframe references
      if (frame !== this._page.mainFrame()) {
        this._iframes.set(frame.url(), frame)
      }
    })

    // Listen to targetcreated events for new window creation
    this._page
      .browserContext()
      .browser()
      .on('targetcreated', async target => {
        if (target.type() === 'page') {
          try {
            const newPage = await target.page()
            if (newPage) {
              const url = newPage.url()
              if (url.startsWith('webspatial://')) {
                // Handle webspatial protocol
                await this.handleWebspatialProtocol(url, newPage)
              }
            }
          } catch (error) {
            console.error('Error handling new window:', error)
          }
        }
      })
  }

  /**
   * Handle webspatial protocol
   */
  private async handleWebspatialProtocol(
    url: string,
    page: Page,
  ): Promise<void> {
    // This will be called by handlers in PuppeteerWebViewModel
    // Left unimplemented for future work
  }

  /**
   * Get iframe by URL
   */
  getIframeByUrl(url: string): Frame | undefined {
    return this._iframes.get(url)
  }

  /**
   * Get all iframes
   */
  getAllIframes(): Map<string, Frame> {
    return this._iframes
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._iframes.clear()
    this._openWindowInvoke = undefined
    this._navigationInvoke = undefined
    this._jsbListener = undefined
  }
}
