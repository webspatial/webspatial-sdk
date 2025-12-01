import { Page, Frame, Browser } from 'puppeteer'
import { PuppeteerWebViewModel } from './PuppeteerWebViewModel'
import { WebViewElementInfo } from '../model/SpatialScene'

/**
 * PuppeteerWebController类负责管理Puppeteer中的WebView，处理协议拦截和iframe管理
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
   * 获取WebViewModel实例
   */
  get webViewModel(): PuppeteerWebViewModel {
    return this._webViewModel
  }

  /**
   * 获取当前页面
   */
  get page(): Page {
    return this._page
  }

  /**
   * 注册新窗口打开处理器
   */
  registerOpenWindowInvoke(handler: (url: string) => Promise<any>): void {
    this._openWindowInvoke = handler
  }

  /**
   * 注册导航处理器
   */
  registerNavigationInvoke(handler: (url: string) => Promise<boolean>): void {
    this._navigationInvoke = handler
  }

  /**
   * 注册JSB消息处理器
   */
  registerJSBListener(handler: (message: any) => void): void {
    this._jsbListener = handler
  }

  /**
   * 处理新窗口打开请求
   */
  async openWindowInvoke(url: string): Promise<any> {
    if (this._openWindowInvoke) {
      return await this._openWindowInvoke(url)
    }
    return null
  }

  /**
   * 处理导航请求
   */
  async navigationInvoke(url: string): Promise<boolean> {
    if (this._navigationInvoke) {
      return await this._navigationInvoke(url)
    }
    return false
  }

  /**
   * 发送JSB消息
   */
  sendJSBMessage(message: any): void {
    if (this._jsbListener) {
      this._jsbListener(message)
    }
  }

  /**
   * 设置协议拦截
   */
  private setupProtocolInterception(): void {
    // 监听页面的导航事件
    this._page.on('framenavigated', frame => {
      // 存储iframe引用
      if (frame !== this._page.mainFrame()) {
        this._iframes.set(frame.url(), frame)
      }
    })

    // 监听页面的targetcreated事件，处理新窗口创建
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
                // 处理webspatial协议
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
   * 处理webspatial协议
   */
  private async handleWebspatialProtocol(
    url: string,
    page: Page,
  ): Promise<void> {
    // 这里会被PuppeteerWebViewModel中的处理器调用
    // 暂时留空，等待后续实现
  }

  /**
   * 获取指定URL的iframe
   */
  getIframeByUrl(url: string): Frame | undefined {
    return this._iframes.get(url)
  }

  /**
   * 获取所有iframe
   */
  getAllIframes(): Map<string, Frame> {
    return this._iframes
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this._iframes.clear()
    this._openWindowInvoke = undefined
    this._navigationInvoke = undefined
    this._jsbListener = undefined
  }
}
