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
 * WebspatialProtocolHandler类负责处理webspatial协议的各种操作
 */
export class WebspatialProtocolHandler {
  private static _instance: WebspatialProtocolHandler
  private _protocolManager: ProtocolHandlerManager | null = null

  /**
   * 获取单例实例
   */
  public static getInstance(): WebspatialProtocolHandler {
    if (!WebspatialProtocolHandler._instance) {
      WebspatialProtocolHandler._instance = new WebspatialProtocolHandler()
    }
    return WebspatialProtocolHandler._instance
  }

  constructor() {
    // 移除构造函数中的ProtocolHandlerManager依赖，避免循环依赖
  }

  /**
   * 设置协议管理器
   */
  public setProtocolManager(manager: ProtocolHandlerManager): void {
    this._protocolManager = manager
    this.registerProtocolHandlers()
  }

  /**
   * 注册所有协议处理器
   */
  private registerProtocolHandlers(): void {
    if (this._protocolManager) {
      // 注册webspatial协议的主要处理器
      this._protocolManager.registerProtocolHandler(
        'webspatial',
        this.handleWebspatialProtocol.bind(this),
      )
    }
  }

  /**
   * 处理webspatial协议URL
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

      // 根据host区分不同的操作
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
   * 处理创建SpatialScene的请求
   */
  private async handleCreateSpatialScene(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      // 从URL参数中获取配置
      const sceneUrl = urlObj.searchParams.get('url') || ''
      const windowStyleStr = urlObj.searchParams.get('windowStyle') || 'window'
      const windowStyle = windowStyleStr as WindowStyle

      // 创建新的SpatialScene
      const scene = new SpatialScene(sceneUrl, windowStyle, SceneStateKind.idle)

      console.log(
        `Created new SpatialScene with ID: ${scene.id}, URL: ${sceneUrl}`,
      )

      // 返回WebViewElementInfo
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
   * 处理创建SpatializedElement的请求
   */
  private async handleCreateSpatializedElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    try {
      // 从URL参数中获取配置
      const typeParam =
        urlObj.searchParams.get('type') ||
        SpatializedElementType.Spatialized2DElement
      const elementType = typeParam as SpatializedElementType
      const widthStr = urlObj.searchParams.get('width') || '300'
      const heightStr = urlObj.searchParams.get('height') || '200'
      const xStr = urlObj.searchParams.get('x') || '0'
      const yStr = urlObj.searchParams.get('y') || '0'

      // 解析数字参数
      const width = parseInt(widthStr, 10)
      const height = parseInt(heightStr, 10)
      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)

      // 创建元素
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

      // 设置元素属性
      element.width = width
      element.height = height
      element.clientX = x
      element.clientY = y

      // 注册元素
      if (!this._protocolManager) {
        console.error('Protocol manager not initialized')
        return null
      }
      this._protocolManager.registerElement(element)

      // 创建模拟的WebController
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

      // 创建WebViewModel
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
   * 处理更新SpatializedElement的请求
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

      // 更新元素属性
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

      // 返回更新后的元素信息
      if (element.id) {
        return {
          id: element.id,
          webViewModel: {} as PuppeteerWebViewModel, // 简化返回
        }
      }
    } catch (error) {
      console.error('Error updating SpatializedElement:', error)
    }
    return null
  }

  /**
   * 处理添加子元素的请求
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

      // 添加子元素
      parent.addChild(child)

      console.log(`Added child ${childId} to parent ${parentId}`)

      return {
        id: parentId,
        webViewModel: {} as PuppeteerWebViewModel, // 简化返回
      }
    } catch (error) {
      console.error('Error adding child element:', error)
    }
    return null
  }

  /**
   * 初始化协议处理器
   */
  public static initialize(): void {
    const instance = this.getInstance()
    console.log('WebspatialProtocolHandler initialized')
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    WebspatialProtocolHandler._instance = undefined as any
  }
}
