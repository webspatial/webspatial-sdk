import {
  PuppeteerWebViewModel,
  WebViewElementInfo,
} from './PuppeteerWebViewModel'
import { Page } from 'puppeteer'
import { SpatialScene } from '../model/SpatialScene'
import { Spatialized2DElement } from '../model/Spatialized2DElement'
import { WebspatialProtocolHandler } from './WebspatialProtocolHandler'
import { SceneStateKind } from '../types/types'

// 定义SceneStateKind的安全类型
type SafeSceneState = SceneStateKind | 'idle'

/**
 * 协议处理器类型定义
 */
export type ProtocolHandler = (
  url: string,
) => Promise<WebViewElementInfo | null>

/**
 * ProtocolHandlerManager类负责管理所有协议处理器的注册和分发
 */
export class ProtocolHandlerManager {
  private static _instance: ProtocolHandlerManager
  private _protocolHandlers: Record<string, ProtocolHandler> = {}
  private _scenes: Map<string, SpatialScene> = new Map()
  private _elements: Map<string, Spatialized2DElement> = new Map()
  private _webspatialProtocolHandler: WebspatialProtocolHandler

  constructor() {
    // 初始化WebspatialProtocolHandler
    this._webspatialProtocolHandler = WebspatialProtocolHandler.getInstance()
    // 设置协议管理器引用，打破循环依赖
    this._webspatialProtocolHandler.setProtocolManager(this)
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ProtocolHandlerManager {
    if (!ProtocolHandlerManager._instance) {
      ProtocolHandlerManager._instance = new ProtocolHandlerManager()
    }
    return ProtocolHandlerManager._instance
  }

  /**
   * 注册协议处理器
   */
  public registerProtocolHandler(
    protocol: string,
    handler: ProtocolHandler,
  ): void {
    this._protocolHandlers[protocol] = handler
    console.log(`Protocol handler registered for: ${protocol}`)
  }

  /**
   * 注销协议处理器
   */
  public unregisterProtocolHandler(protocol: string): void {
    delete this._protocolHandlers[protocol]
    console.log(`Protocol handler unregistered for: ${protocol}`)
  }

  /**
   * 处理URL（用于测试）
   */
  public async handleUrl(url: string): Promise<WebViewElementInfo | null> {
    return this.handleProtocolUrl(url)
  }

  /**
   * 处理协议URL
   */
  public async handleProtocolUrl(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    try {
      // 检查URL是否是webspatial协议开头
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
   * 注销场景
   */
  public unregisterScene(sceneId: string): void {
    this._scenes.delete(sceneId)
  }

  /**
   * 注销元素
   */
  public unregisterElement(elementId: string): void {
    this._elements.delete(elementId)
  }

  /**
   * 注册webspatial协议处理器
   */
  public registerWebspatialProtocolHandler(): void {
    this.registerProtocolHandler(
      'webspatial',
      this.handleWebspatialProtocol.bind(this),
    )
  }

  /**
   * 处理webspatial协议
   */
  private async handleWebspatialProtocol(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    try {
      const urlObj = new URL(url)
      const host = urlObj.host

      // 根据host区分不同的操作
      switch (host) {
        case 'createSpatialScene':
          // 创建SpatialScene
          return await this.createSpatialScene(urlObj)
        case 'createSpatializedElement':
          // 创建SpatializedElement
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
   * 获取WebViewModel（添加空值检查）
   */
  public getWebViewModel(): PuppeteerWebViewModel | null {
    // 假设在其他地方有设置_webViewModel的逻辑
    return (this as any)._webViewModel || null
  }

  /**
   * 创建SpatialScene
   */
  private async createSpatialScene(urlObj: URL): Promise<WebViewElementInfo> {
    // 从URL参数中获取配置
    const sceneUrl = urlObj.searchParams.get('url') || ''
    const windowStyle =
      (urlObj.searchParams.get('windowStyle') as any) || 'window'

    // 创建SpatialScene
    const scene = new SpatialScene(sceneUrl, windowStyle, SceneStateKind.idle)

    // 存储scene引用
    this._scenes.set(scene.id, scene)

    // 返回WebViewElementInfo
    return {
      id: scene.id,
      webViewModel:
        scene.spatialWebViewModel || (this as any)._webViewModel || null,
    }
  }

  /**
   * 创建SpatializedElement
   */
  private async createSpatializedElement(
    urlObj: URL,
  ): Promise<WebViewElementInfo | null> {
    // 这里将在后续实现，需要与createSpatializedElement方法集成
    return null
  }

  /**
   * 注册SpatialScene
   */
  public registerScene(scene: SpatialScene): void {
    this._scenes.set(scene.id, scene)
  }

  /**
   * 获取SpatialScene
   */
  public getScene(id: string): SpatialScene | undefined {
    return this._scenes.get(id)
  }

  /**
   * 注册SpatializedElement
   */
  public registerElement(element: Spatialized2DElement): void {
    this._elements.set(element.id, element)
  }

  /**
   * 获取SpatializedElement
   */
  public getElement(id: string): Spatialized2DElement | undefined {
    return this._elements.get(id)
  }

  /**
   * 初始化ProtocolHandlerManager
   */
  public static initialize(): void {
    const instance = this.getInstance()
    // 初始化webspatial协议处理器
    WebspatialProtocolHandler.initialize()
    console.log('ProtocolHandlerManager initialized')
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this._protocolHandlers = {}
    this._scenes.clear()
    this._elements.clear()
    ProtocolHandlerManager._instance = undefined as any
  }
}
