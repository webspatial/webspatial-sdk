import { Page, Frame } from 'puppeteer'
import { PuppeteerWebController } from './PuppeteerWebController'
import { PuppeteerWebViewModel } from './PuppeteerWebViewModel'

declare global {
  interface Window {
    __onWebSpatialMessage?: (message: any) => void
  }
}

/**
 * PuppeteerWebView类表示一个WebView实例，管理iframe和页面交互
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
   * 获取WebController实例
   */
  get webController(): PuppeteerWebController {
    return this._webController
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
    return this._webController.page
  }

  /**
   * 初始化WebView
   */
  private async initialize(): Promise<void> {
    if (!this._isInitialized) {
      // 设置iframe监控
      this.setupIframeMonitoring()
      // 设置消息监听
      this.setupMessageListener()
      this._isInitialized = true
    }
  }

  /**
   * 设置iframe监控
   */
  private setupIframeMonitoring(): void {
    // 监听frameattached事件，处理新添加的iframe
    this._webController.page.on('frameattached', frame => {
      if (frame !== this._webController.page.mainFrame()) {
        this.registerIframe(frame)
      }
    })

    // 监听framedetached事件，处理移除的iframe
    this._webController.page.on('framedetached', frame => {
      this.unregisterIframe(frame)
    })

    // 监听framenavigated事件，处理iframe导航
    this._webController.page.on('framenavigated', frame => {
      if (frame !== this._webController.page.mainFrame()) {
        this.updateIframe(frame)
      }
    })
  }

  /**
   * 设置消息监听
   */
  private setupMessageListener(): void {
    // 在页面中注入消息监听代码
    this._webController.page.exposeFunction(
      '__onWebSpatialMessage',
      (message: any) => {
        this.handleMessage(message)
      },
    )

    // 注入初始化脚本
    this._webController.page.evaluateOnNewDocument(() => {
      // 监听window.postMessage事件
      window.addEventListener('message', event => {
        if (event.data && event.data.type === 'WEB_SPATIAL_MESSAGE') {
          window.__onWebSpatialMessage?.(event.data)
        }
      })
    })
  }

  /**
   * 注册iframe
   */
  private registerIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    this._iframeMap.set(frameId, frame)
    console.log(`Iframe registered: ${frameId}`)
  }

  /**
   * 注销iframe
   */
  private unregisterIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    this._iframeMap.delete(frameId)
    console.log(`Iframe unregistered: ${frameId}`)
  }

  /**
   * 更新iframe信息
   */
  private updateIframe(frame: Frame): void {
    const frameId = this.generateFrameId(frame)
    if (this._iframeMap.has(frameId)) {
      // 更新iframe引用
      this._iframeMap.set(frameId, frame)
      console.log(`Iframe updated: ${frameId}`)
    } else {
      // 如果不存在则注册
      this.registerIframe(frame)
    }
  }

  /**
   * 生成iframe唯一标识符
   */
  private generateFrameId(frame: Frame): string {
    // 使用frame.url()和frame.parentFrame()信息生成唯一ID
    const url = frame.url() || 'about:blank'
    const parentUrl = frame.parentFrame()?.url() || 'main'
    return `${parentUrl}_${url}_${Date.now()}`
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: any): void {
    // 处理JSB命令
    if (message.type === 'JSB_COMMAND') {
      this._webViewModel.handleJSBCommand(message.data)
    }
  }

  /**
   * 获取所有iframe
   */
  getAllIframes(): Map<string, Frame> {
    return this._iframeMap
  }

  /**
   * 根据URL查找iframe
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
   * 向指定iframe发送消息
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
   * 向所有iframe发送消息
   */
  async broadcastMessageToAllIframes(message: any): Promise<void> {
    for (const [frameId] of this._iframeMap.entries()) {
      await this.sendMessageToIframe(frameId, message)
    }
  }

  /**
   * 加载URL
   */
  async loadUrl(url: string): Promise<void> {
    await this._webViewModel.load(url)
  }

  /**
   * 加载HTML内容
   */
  async loadHTML(html: string): Promise<void> {
    await this._webViewModel.loadHTML(html)
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this._iframeMap.clear()
    this._webController.dispose()
    this._webViewModel.dispose()
  }
}
