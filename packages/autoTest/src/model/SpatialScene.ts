import {
  SpatialScene as ISpatialScene,
  WindowStyle,
  SceneStateKind,
  SceneConfig,
  SceneOptions,
  BackgroundMaterial,
  ScrollAbleSpatialElementContainer,
  Vec2,
  SpatializedElementType,
  CornerRadius,
} from '../types/types'
import { SpatialObject } from './SpatialObject'
import { PuppeteerWebViewModel } from '../webview/PuppeteerWebViewModel'
import { ProtocolHandlerManager } from '../webview/ProtocolHandlerManager'
import { Spatialized2DElement } from './Spatialized2DElement'
import { SpatializedElement } from './SpatializedElement'

// 添加缺失的Vec3类型定义
export interface Vec3 {
  x: number
  y: number
  z: number
}

// 定义WebViewElementInfo接口，用于返回创建的元素信息
export interface WebViewElementInfo {
  id: string
  webViewModel: PuppeteerWebViewModel
}

export class SpatialScene
  extends SpatialObject
  implements ISpatialScene, ScrollAbleSpatialElementContainer
{
  private _url: string
  private _windowStyle: WindowStyle
  private _state: SceneStateKind
  private _sceneConfig: SceneConfig
  spatialWebViewModel: PuppeteerWebViewModel | null = null
  private _cornerRadius: CornerRadius
  private _backgroundMaterial: BackgroundMaterial = BackgroundMaterial.none
  private _opacity: number = 1.0
  private _parent: ScrollAbleSpatialElementContainer | null = null
  private _scrollOffset: Vec2 = { x: 0, y: 0 }
  private _scrollPageEnabled: boolean = true

  private spatialObjects: Record<string, any> = {}
  private _children: Record<string, SpatializedElement> = {}
  // private _boundSpatialIframeCreatedHandler: EventListener;

  get cornerRadius(): CornerRadius {
    return this._cornerRadius
  }

  set cornerRadius(value: CornerRadius) {
    this._cornerRadius = value
    this.emit('cornerRadiusChanged', { cornerRadius: value })
  }

  get backgroundMaterial(): BackgroundMaterial {
    return this._backgroundMaterial
  }

  set backgroundMaterial(value: BackgroundMaterial) {
    this._backgroundMaterial = value
    this.emit('backgroundMaterialChanged', { backgroundMaterial: value })
  }

  get opacity(): number {
    return this._opacity
  }

  set opacity(value: number) {
    this._opacity = value
    this.emit('opacityChanged', { opacity: value })
  }

  // ScrollAbleSpatialElementContainer 接口实现
  get parent(): ScrollAbleSpatialElementContainer | null {
    return this._parent
  }

  set parent(value: ScrollAbleSpatialElementContainer | null) {
    this._parent = value
  }

  get scrollOffset(): Vec2 {
    return this._scrollOffset
  }

  set scrollOffset(value: Vec2) {
    this._scrollOffset = value
  }

  get scrollPageEnabled(): boolean {
    return this._scrollPageEnabled
  }

  set scrollPageEnabled(value: boolean) {
    this._scrollPageEnabled = value
  }

  constructor(
    url: string,
    windowStyle: WindowStyle,
    state: SceneStateKind,
    sceneOptions?: SceneOptions,
  ) {
    super()
    this._url = url
    this._windowStyle = windowStyle
    this._state = state
    this._cornerRadius = {
      topLeading: 0,
      bottomLeading: 0,
      topTrailing: 0,
      bottomTrailing: 0,
    }

    // 初始化场景配置
    this._sceneConfig = {
      width: sceneOptions?.width || 1024,
      height: sceneOptions?.height || 768,
      depth: sceneOptions?.depth || 100,
      navHeight: sceneOptions?.navHeight || 44,
    }

    this.resetBackgroundMaterialOnWindowStyleChange(windowStyle)
    this.setupSpatialWebView()
    this.moveToState(state, sceneOptions)
  }

  get version(): string {
    return '1.0.0' // 默认版本
  }

  get url(): string {
    return this._url
  }

  set url(value: string) {
    this._url = value
    this.emit('urlChanged', { url: value })
  }

  get windowStyle(): WindowStyle {
    return this._windowStyle
  }

  set windowStyle(value: WindowStyle) {
    this._windowStyle = value
    this.emit('windowStyleChanged', { windowStyle: value })
  }

  get state(): SceneStateKind {
    return this._state
  }

  set state(value: SceneStateKind) {
    this._state = value
    this.emit('stateChanged', { state: value })
  }

  get children(): Record<string, SpatializedElement> {
    return { ...this._children } // 返回副本
  }

  get sceneConfig(): SceneConfig {
    return { ...this._sceneConfig }
  }

  set sceneConfig(value: SceneConfig) {
    this._sceneConfig = value
    this.emit('sceneConfigChanged', { sceneConfig: value })
  }

  private resetBackgroundMaterialOnWindowStyleChange(
    windowStyle: WindowStyle,
  ): void {
    // 简化实现
    if (windowStyle === WindowStyle.volume) {
      // 设置透明背景
    } else {
      // 设置默认背景
    }
  }

  private setupSpatialWebView(): void {
    // 初始化spatialWebViewModel
    try {
      // 创建模拟的WebController实例
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

      this.spatialWebViewModel = new PuppeteerWebViewModel(
        mockWebController as any,
        this._url,
      )

      // 注册JSB监听器
      // this.setupJSBListeners()

      // 注册到ProtocolHandlerManager
      ProtocolHandlerManager.getInstance().registerScene(this)

      // 监听PuppeteerPlatform创建的iframe事件
      // window.addEventListener('spatial_iframe_created', this._boundSpatialIframeCreatedHandler);

      console.log('Setting up spatial web view for URL:', this.url)
    } catch (error) {
      console.error('Failed to setup spatial web view:', error)
    }
  }

  /**
   * 设置JSB监听器
   */
  private setupJSBListeners(): void {
    if (this.spatialWebViewModel) {
      // 注册UpdateSpatialized2DElementProperties命令监听器
      this.spatialWebViewModel.addJSBListener(
        'UpdateSpatialized2DElementProperties',
        (command: any) => {
          this.handleUpdateSpatialized2DElementProperties(command)
        },
      )

      // 注册AddSpatializedElementToSpatialized2DElement命令监听器
      this.spatialWebViewModel.addJSBListener(
        'AddSpatializedElementToSpatialized2DElement',
        (command: any) => {
          this.handleAddSpatializedElementToSpatialized2DElement(command)
        },
      )
    }
  }

  /**
   * 处理更新空间化元素属性命令
   */
  handleUpdateSpatialized2DElementProperties(data: any): void {
    const elementId = data.id
    const element = this.spatialObjects[elementId] as Spatialized2DElement
    // 调用updateSpatializedElementProperties更新通用属性
    this.updateSpatializedElementProperties(elementId, data)

    // 按照Swift端实现，单独处理特定的2D元素属性
    if (element && data) {
      if (data.scrollPageEnabled !== undefined) {
        element.scrollPageEnabled = data.scrollPageEnabled
      }

      if (data.material !== undefined) {
        element.backgroundMaterial = data.material
      }

      if (data.cornerRadius !== undefined) {
        element.cornerRadius = data.cornerRadius
      }

      // 移除对不存在属性的引用
    }
  }

  /**
   * update transform for spatializedElement
   */
  handleUpdateSpatializedElementTransform(data: any): void {
    const elementId = data.id
    const element = this.spatialObjects[elementId] as SpatializedElement

    if (element && data) {
      // 按照Vision OS端的实现，优先处理matrix数组
      if (data.matrix) {
        // 验证matrix数组长度是否为16
        if (data.matrix.length === 16) {
          // 使用matrix数组更新transform
          element.transform = {
            ...element.transform,
            matrix: data.matrix,
          }
        } else {
          console.warn(
            'Invalid matrix length for transform update:',
            data.matrix.length,
          )
        }
      } else if (data.transform) {
        // 如果没有matrix但有transform，保留原有行为
        element.transform = { ...element.transform, ...data.transform }
      }
    }
  }

  /**
   * 处理添加子元素命令
   */
  private handleAddSpatializedElementToSpatialized2DElement(
    command: any,
  ): void {
    const { parentId, childId } = command
    const parent = this.spatialObjects[parentId] as Spatialized2DElement
    const child = this.spatialObjects[childId] as SpatializedElement

    if (parent && child) {
      parent.addChild(child)
    }
  }

  /**
   * 处理自定义窗口打开请求
   */
  public handleWindowOpenCustom(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    // 委托给ProtocolHandlerManager处理
    return ProtocolHandlerManager.getInstance().handleUrl(url)
  }

  /**
   * 创建SpatializedElement
   */
  createSpatializedElement(
    url: string,
    spatialId: string,
  ): WebViewElementInfo | null {
    try {
      const urlObj = new URL(url)
      const typeParam =
        urlObj.searchParams.get('type') ||
        SpatializedElementType.Spatialized2DElement
      const elementType = typeParam as SpatializedElementType
      console.log('createSpatializedElement elementType:', elementType)

      let element: SpatializedElement | null = null

      // 根据类型创建不同的元素
      switch (elementType) {
        case SpatializedElementType.Spatialized2DElement:
          element = new Spatialized2DElement(spatialId)
          break
        case SpatializedElementType.SpatializedStatic3DElement:
          // 未来扩展支持3D元素
          console.warn('SpatializedStatic3DElement not yet supported')
          return null
        case SpatializedElementType.SpatializedDynamic3DElement:
          // 未来扩展支持动态3D元素
          console.warn('SpatializedDynamic3DElement not yet supported')
          return null
        default:
          // 默认创建2D元素
          element = new Spatialized2DElement(spatialId)
      }

      if (!element) {
        return null
      }

      // 设置元素属性
      const width = urlObj.searchParams.get('width')
      const height = urlObj.searchParams.get('height')
      const x = urlObj.searchParams.get('x')
      const y = urlObj.searchParams.get('y')

      if (width) element.width = parseInt(width, 10)
      if (height) element.height = parseInt(height, 10)
      if (x && y) {
        element.clientX = parseInt(x, 10)
        element.clientY = parseInt(y, 10)
      }

      // 存储元素引用
      this.spatialObjects[element.id] = element

      // 注册到ProtocolHandlerManager
      if (element instanceof Spatialized2DElement) {
        ProtocolHandlerManager.getInstance().registerElement(element)
      }

      // 创建WebViewModel
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

      const webViewModel = new PuppeteerWebViewModel(mockWebController as any)

      return {
        id: element.id,
        webViewModel: webViewModel,
      }
    } catch (error) {
      console.error('Error creating spatialized element:', error)
      return null
    }
  }

  /**
   * 发送消息到Web页面
   */
  sendWebMsg(message: any): void {
    if (this.spatialWebViewModel) {
      this.spatialWebViewModel.sendMessage(message)
    }
  }

  /**
   * 更新3D尺寸
   */
  updateSize3D(width: number, height: number, depth: number): void {
    this._sceneConfig = {
      ...this._sceneConfig,
      width,
      height,
      depth,
    }
    this.emit('sceneConfigChanged', { sceneConfig: this._sceneConfig })
    console.log('Updated scene size:', { width, height, depth })
  }

  moveToState(state: SceneStateKind, sceneOptions?: SceneOptions): void {
    this.state = state
    console.log(`Scene ${this.id} moved to state: ${state}`)

    // 根据状态执行不同的逻辑
    switch (state) {
      case SceneStateKind.idle:
        break
      case SceneStateKind.pending:
        break
      case SceneStateKind.willVisible:
        break
      case SceneStateKind.visible:
        break
      case SceneStateKind.fail:
        break
    }
  }

  findSpatialObject(id: string): SpatializedElement | null {
    return (this.spatialObjects[id] as SpatializedElement) || null
  }

  updateSpatializedElementProperties(
    id: string,
    properties: Record<string, any>,
  ): void {
    const element = this.findSpatialObject(id)
    if (element && properties) {
      // 先检查properties对象是否存在
      // 按照Swift端的实现，为每个属性单独检查并更新
      if (properties.name !== undefined) {
        element.name = properties.name
      }

      if (properties.clientX !== undefined) {
        element.clientX = properties.clientX
      }

      if (properties.clientY !== undefined) {
        element.clientY = properties.clientY
      }

      if (properties.width !== undefined) {
        element.width = properties.width
      }

      if (properties.height !== undefined) {
        element.height = properties.height
      }

      if (properties.depth !== undefined) {
        element.depth = properties.depth
      }

      if (properties.backOffset !== undefined) {
        element.backOffset = properties.backOffset
      }

      if (properties.opacity !== undefined) {
        element.opacity = properties.opacity
      }

      if (properties.scrollWithParent !== undefined) {
        element.scrollWithParent = properties.scrollWithParent
      }

      if (properties.visible !== undefined) {
        element.visible = properties.visible
      }

      if (properties.zIndex !== undefined) {
        element.zIndex = properties.zIndex
      }

      if (properties.rotationAnchor !== undefined) {
        element.rotationAnchor = {
          x: properties.rotationAnchor.x,
          y: properties.rotationAnchor.y,
          z: properties.rotationAnchor.z,
        }
      }

      if (properties.enableTapGesture !== undefined) {
        element.enableTapGesture = properties.enableTapGesture
      }

      if (properties.enableDragStartGesture !== undefined) {
        element.enableDragStartGesture = properties.enableDragStartGesture
      }

      if (properties.enableDragGesture !== undefined) {
        element.enableDragGesture = properties.enableDragGesture
      }

      if (properties.enableDragEndGesture !== undefined) {
        element.enableDragEndGesture = properties.enableDragEndGesture
      }

      if (properties.enableRotateStartGesture !== undefined) {
        element.enableRotateStartGesture = properties.enableRotateStartGesture
      }

      if (properties.enableRotateGesture !== undefined) {
        element.enableRotateGesture = properties.enableRotateGesture
      }

      if (properties.enableRotateEndGesture !== undefined) {
        element.enableRotateEndGesture = properties.enableRotateEndGesture
      }

      if (properties.enableMagnifyStartGesture !== undefined) {
        element.enableMagnifyStartGesture = properties.enableMagnifyStartGesture
      }

      if (properties.enableMagnifyGesture !== undefined) {
        element.enableMagnifyGesture = properties.enableMagnifyGesture
      }

      if (properties.enableMagnifyEndGesture !== undefined) {
        element.enableMagnifyEndGesture = properties.enableMagnifyEndGesture
      }

      this.emit('elementPropertiesUpdated', { id, properties })
    }
  }

  addChild(child: SpatializedElement): void {
    if (!child || !child.id) {
      throw new Error('Invalid child element')
    }

    this._children[child.id] = child
    // 安全地设置parent属性
    try {
      if (child.setParent) {
        // 类型断言，因为this现在实现了ScrollAbleSpatialElementContainer接口
        child.setParent(this as unknown as ScrollAbleSpatialElementContainer)
      } else if ('parent' in child) {
        ;(child as any).parent = this
      }
    } catch (error) {
      console.warn('Failed to set parent for child element:', error)
    }
    this.emit('childAdded', { child })
  }

  // 移除方法重载，直接实现接口要求的方法
  removeChild(spatializedElement: SpatializedElement): void {
    // 处理对象参数
    if (!spatializedElement || !spatializedElement.id) {
      throw new Error('Invalid child element')
    }

    const child = this._children[spatializedElement.id]
    if (child) {
      delete this._children[spatializedElement.id]
      // 安全地移除parent属性
      try {
        if (child.setParent) {
          // 类型断言，因为setParent方法可能不接受null
          child.setParent(null as unknown as ScrollAbleSpatialElementContainer)
        } else if ('parent' in child) {
          ;(child as any).parent = null
        }
      } catch (error) {
        console.warn('Failed to unset parent for child element:', error)
      }
      this.emit('childRemoved', { child })
    }
  }

  // 实现ScrollAbleSpatialElementContainer接口要求的getChildrenOfType方法
  getChildrenOfType(
    type: SpatializedElementType,
  ): Record<string, SpatializedElement> {
    const result: Record<string, SpatializedElement> = {}
    Object.entries(this._children).forEach(([id, child]) => {
      if (child.type === type) {
        result[id] = child
      }
    })
    return result
  }

  updateDeltaScrollOffset(delta: Vec2): void {
    this._scrollOffset.x += delta.x
    this._scrollOffset.y += delta.y
    this.emit('scrollOffsetChanged', { scrollOffset: this._scrollOffset })
  }

  stopScrolling(): void {
    this._scrollOffset = { x: 0, y: 0 }
    this.emit('scrollingStopped', {})
  }

  getChild(id: string): SpatializedElement | null {
    return this._children[id] || null
  }

  // 实现ScrollAbleSpatialElementContainer接口要求的getChildren方法
  getChildren(): Record<string, SpatializedElement> {
    return { ...this._children }
  }

  // 为了向后兼容，提供获取子元素数组的方法
  getChildrenArray(): any[] {
    return Object.values(this._children)
  }

  // 为了向后兼容，提供泛型版本的getChildrenOfType方法
  getChildrenOfTypeByClass<T extends SpatializedElement>(
    type: new (...args: any[]) => T,
  ): T[] {
    return Object.values(this._children).filter(
      child => child instanceof type,
    ) as T[]
  }

  addSpatialObject(object: any): void {
    if (!object || !object.spatialId) {
      console.warn('Invalid object: missing spatialId')
      return
    }

    this.spatialObjects[object.spatialId] = object

    // 使用duck typing来检查对象是否有必要的属性，而不是依赖instanceof
    if (object && typeof object === 'object' && 'id' in object && object.id) {
      this.addChild(object)
    }

    // 设置销毁监听器
    if (object.on) {
      object.on(
        'SpatialObject::BeforeDestroyed',
        this.onSpatialObjectDestroyed.bind(this),
      )
    }
  }

  private onSpatialObjectDestroyed(data: any): void {
    const destroyedObject = data?.object || this
    if (destroyedObject?.spatialId) {
      delete this.spatialObjects[destroyedObject.spatialId]
      if (this._children[destroyedObject.spatialId]) {
        delete this._children[destroyedObject.spatialId]
      } else if (destroyedObject.id && this._children[destroyedObject.id]) {
        delete this._children[destroyedObject.id]
      }
    }
  }

  public sendWebMsgToElement(id: string, data: any): void {
    console.log(`Sending web message to ${id}:`, data)
    // 简化实现，实际应该发送消息到WebView
  }

  handleNavigationCheck(url: string): boolean {
    console.log('Checking navigation to:', url)
    return true // 简化实现，允许所有导航
  }

  handleWindowClose(): void {
    console.log('Closing window')
    this.destroy()
  }

  addObject(object: any): void {
    // 使用duck typing来检查对象是否有必要的属性，而不是依赖instanceof
    if (
      object &&
      typeof object === 'object' &&
      'id' in object &&
      'position' in object
    ) {
      this.addChild(object)
    } else {
      // Handle other types of objects if needed
      console.warn('Object type not supported for addition to scene')
    }
  }

  protected onDestroy(): void {
    super.onDestroy()
    // 清理事件监听器
    // window.removeEventListener('spatial_iframe_created', this._boundSpatialIframeCreatedHandler);

    // 销毁所有空间对象
    Object.values(this.spatialObjects).forEach(obj => {
      if (obj && typeof obj.destroy === 'function') {
        obj.destroy()
      }
    })
    this.spatialObjects = {}
    // 销毁所有子元素
    Object.values(this._children).forEach(child => {
      if (child && typeof child.destroy === 'function') {
        child.destroy()
      }
    })
    this._children = {}

    // 清理父引用
    this._parent = null
  }
}
