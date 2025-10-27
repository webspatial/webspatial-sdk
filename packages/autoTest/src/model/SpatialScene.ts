import {
  SpatialScene as ISpatialScene,
  WindowStyle,
  SceneStateKind,
  SceneConfig,
  SceneOptions,
  SpatializedElement,
} from '../types/types'
import { SpatialObject } from './SpatialObject'

export class SpatialScene extends SpatialObject implements ISpatialScene {
  private _url: string
  private _windowStyle: WindowStyle
  private _state: SceneStateKind
  private _sceneConfig: SceneConfig
  spatialWebViewModel: any

  private spatialObjects: Record<string, any> = {}
  private _children: Record<string, SpatializedElement> = {}

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
    this.spatialWebViewModel = { url }

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
    this.emit?.('urlChanged', { url: value })
  }

  get windowStyle(): WindowStyle {
    return this._windowStyle
  }

  set windowStyle(value: WindowStyle) {
    this._windowStyle = value
    this.emit?.('windowStyleChanged', { windowStyle: value })
  }

  get state(): SceneStateKind {
    return this._state
  }

  set state(value: SceneStateKind) {
    this._state = value
    this.emit?.('stateChanged', { state: value })
  }

  get children(): Record<string, SpatializedElement> {
    return { ...this._children } // 返回副本
  }

  get sceneConfig(): SceneConfig {
    return { ...this._sceneConfig }
  }

  set sceneConfig(value: SceneConfig) {
    this._sceneConfig = value
    this.emit?.('sceneConfigChanged', { sceneConfig: value })
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
    // 简化实现，实际应该设置WebView
    console.log('Setting up spatial web view for URL:', this.url)
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

  addChild(child: any): void {
    if (!child || !child.id) {
      throw new Error('Invalid child element')
    }

    this._children[child.id] = child
    // 安全地设置parent属性
    try {
      if (child.setParent) {
        child.setParent(this as any) // 使用类型断言
      } else if ('parent' in child) {
        ;(child as any).parent = this
      }
    } catch (error) {
      console.warn('Failed to set parent for child element:', error)
    }
    this.emit?.('childAdded', { child })
  }

  removeChild(id: string): void {
    const child = this._children[id]
    if (child) {
      delete this._children[id]
      // 安全地移除parent属性
      try {
        if (child.setParent) {
          child.setParent(null as any) // 使用类型断言
        } else if ('parent' in child) {
          ;(child as any).parent = null
        }
      } catch (error) {
        console.warn('Failed to unset parent for child element:', error)
      }
      this.emit?.('childRemoved', { child })
    }
  }

  getChild(id: string): any | null {
    return this._children[id] || null
  }

  getChildren(): any[] {
    return Object.values(this._children)
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

  private onSpatialObjectDestroyed(object: any, data: any): void {
    const destroyedObject = data?.object || object
    if (destroyedObject?.spatialId) {
      delete this.spatialObjects[destroyedObject.spatialId]
      if (this._children[destroyedObject.spatialId]) {
        delete this._children[destroyedObject.spatialId]
      } else if (destroyedObject.id && this._children[destroyedObject.id]) {
        delete this._children[destroyedObject.id]
      }
    }
  }

  sendWebMsg(id: string, data: any): void {
    console.log(`Sending web message to ${id}:`, data)
    // 简化实现，实际应该发送消息到WebView
  }

  handleNavigationCheck(url: string): boolean {
    console.log('Checking navigation to:', url)
    return true // 简化实现，允许所有导航
  }

  handleWindowOpenCustom(url: string, windowStyle: WindowStyle): void {
    console.log(
      `Opening custom window for URL: ${url} with style: ${windowStyle}`,
    )
  }

  handleWindowClose(): void {
    console.log('Closing window')
    this.destroy()
  }

  updateSize3D(width: number, height: number, depth: number): void {
    this._sceneConfig = {
      ...this._sceneConfig,
      width,
      height,
      depth,
    }
    this.emit?.('sceneConfigChanged', { sceneConfig: this._sceneConfig })
    console.log('Updated scene size:', { width, height, depth })
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
  }
}
