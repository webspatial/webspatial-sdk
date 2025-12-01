import { PuppeteerWebController } from './PuppeteerWebController'
import { SpatialScene } from '../model/SpatialScene'
import { Spatialized2DElement } from '../model/Spatialized2DElement'
import { ProtocolHandlerManager } from './ProtocolHandlerManager'
import { WebspatialProtocolHandler } from './WebspatialProtocolHandler'

/**
 * WebViewElementInfo接口，用于返回创建的元素信息
 */
export interface WebViewElementInfo {
  id: string
  webViewModel: PuppeteerWebViewModel
}

/**
 * PuppeteerWebViewModel类负责管理WebView的状态和行为，实现协议处理器注册
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
   * 获取WebController实例
   */
  get webController(): PuppeteerWebController {
    return this._webController
  }

  /**
   * 获取URL
   */
  get url(): string {
    return this._url
  }

  /**
   * 设置URL
   */
  set url(value: string) {
    this._url = value
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 注册onOpenWindowInvoke处理器
    this._webController.registerOpenWindowInvoke(
      this.onOpenWindowInvoke.bind(this),
    )

    // 注册onNavigationInvoke处理器
    this._webController.registerNavigationInvoke(
      this.onNavigationInvoke.bind(this),
    )
  }

  /**
   * 加载指定URL
   */
  async load(url: string): Promise<void> {
    this._url = url
    await this._webController.page.goto(url)
  }

  /**
   * 加载HTML内容
   */
  async loadHTML(html: string): Promise<void> {
    await this._webController.page.setContent(html)
  }

  /**
   * 添加协议处理器
   */
  addOpenWindowListener(
    protocol: string,
    handler: (url: string) => Promise<WebViewElementInfo | null>,
  ): void {
    this._openWindowList[protocol] = handler
  }

  /**
   * 移除协议处理器
   */
  removeOpenWindowListener(protocol: string): void {
    delete this._openWindowList[protocol]
  }

  /**
   * 添加导航处理器
   */
  addNavigationListener(
    protocol: string,
    handler: (url: string) => Promise<boolean>,
  ): void {
    this._navigationList[protocol] = handler
  }

  /**
   * 移除导航处理器
   */
  removeNavigationListener(protocol: string): void {
    delete this._navigationList[protocol]
  }

  /**
   * 添加JSB命令处理器
   */
  addJSBListener(commandName: string, handler: (command: any) => void): void {
    this._jsbCommandList[commandName] = handler
  }

  /**
   * 移除JSB命令处理器
   */
  removeJSBListener(commandName: string): void {
    delete this._jsbCommandList[commandName]
  }

  /**
   * 处理新窗口打开请求
   */
  async onOpenWindowInvoke(url: string): Promise<any> {
    try {
      // 检查是否是webspatial协议
      if (url.startsWith('webspatial://')) {
        console.log(`Handling webspatial protocol URL: ${url}`)
        // 直接通过WebspatialProtocolHandler处理
        return await this._webspatialProtocolHandler.handleWebspatialProtocol(
          url,
        )
      }

      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')

      // 检查是否有对应的协议处理器
      if (this._openWindowList[protocol]) {
        return await this._openWindowList[protocol](url)
      }
    } catch (error) {
      console.error('Error handling open window:', error)
    }
    return null
  }

  /**
   * 处理导航请求
   */
  async onNavigationInvoke(url: string): Promise<boolean> {
    try {
      // 检查是否是webspatial协议
      if (url.startsWith('webspatial://')) {
        console.log(`Intercepting navigation for webspatial protocol: ${url}`)
        // 对于webspatial协议，拦截导航并通过协议处理器处理
        await this._webspatialProtocolHandler.handleWebspatialProtocol(url)
        return true // 返回true表示拦截导航
      }

      const urlObj = new URL(url)
      const protocol = urlObj.protocol.replace(':', '')

      // 检查是否有对应的导航处理器
      if (this._navigationList[protocol]) {
        return await this._navigationList[protocol](url)
      }
    } catch (error) {
      console.error('Error handling navigation:', error)
    }
    return false
  }

  /**
   * 处理JSB命令
   */
  handleJSBCommand(command: any): void {
    if (command && command.name && this._jsbCommandList[command.name]) {
      this._jsbCommandList[command.name](command)
    }
  }

  /**
   * 发送消息到Web页面
   */
  async sendMessage(message: any): Promise<void> {
    try {
      await this._webController.page.evaluate(msg => {
        // 发送消息到页面
        window.postMessage(msg, '*')
      }, message)
    } catch (error) {
      console.error('Error sending message to web page:', error)
    }
  }

  /**
   * 设置协议处理器
   */
  private setupProtocolHandlers(): void {
    // 注册webspatial协议的打开窗口处理器
    this.addOpenWindowListener(
      'webspatial',
      this._webspatialProtocolHandler.handleWebspatialProtocol.bind(
        this._webspatialProtocolHandler,
      ),
    )

    // 注册webspatial协议的导航处理器
    this.addNavigationListener('webspatial', async (url: string) => {
      await this._webspatialProtocolHandler.handleWebspatialProtocol(url)
      return true // 拦截导航
    })
  }

  /**
   * 清除所有监听器
   */
  removeAllOpenWindowListeners(): void {
    this._openWindowList = {}
  }

  /**
   * 清除所有导航监听器
   */
  removeAllNavigationListeners(): void {
    this._navigationList = {}
  }

  /**
   * 清除所有JSB监听器
   */
  removeAllJSBListeners(): void {
    this._jsbCommandList = {}
  }

  /**
   * 清除所有监听器
   */
  removeAllListeners(): void {
    this.removeAllOpenWindowListeners()
    this.removeAllNavigationListeners()
    this.removeAllJSBListeners()
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.removeAllListeners()
  }
}
