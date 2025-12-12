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
import { SpatialObject, SpatialObjectWeakRefManager } from './SpatialObject'
import { PuppeteerWebViewModel } from '../webview/PuppeteerWebViewModel'
import { ProtocolHandlerManager } from '../webview/ProtocolHandlerManager'
import { Spatialized2DElement } from './Spatialized2DElement'
import { SpatializedElement } from './SpatializedElement'

// Add missing Vec3 type definition
export interface Vec3 {
  x: number
  y: number
  z: number
}

// Define WebViewElementInfo interface to return created element info
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

  private _spatialObjects: Record<string, any> = {}
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

  // ScrollAbleSpatialElementContainer interface implementation
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

  get spatialObjects(): Record<string, SpatialObject> {
    return { ...this._spatialObjects }
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

    // Initialize scene config
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
    return '1.0.0' // default version
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
    return { ...this._children }
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
    // Simplified implementation
    if (windowStyle === WindowStyle.volume) {
      // Set transparent background
    } else {
      // Set default background
    }
  }

  private setupSpatialWebView(): void {
    // Initialize spatialWebViewModel
    try {
      // Create a mock WebController instance
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

      // Register JSB listeners
      // this.setupJSBListeners()

      // Register into ProtocolHandlerManager
      ProtocolHandlerManager.getInstance().registerScene(this)

      // Listen to iframe creation events from PuppeteerPlatform
      // window.addEventListener('spatial_iframe_created', this._boundSpatialIframeCreatedHandler);

      console.log('Setting up spatial web view for URL:', this.url)
    } catch (error) {
      console.error('Failed to setup spatial web view:', error)
    }
  }

  /**
   * Handle updating spatialized 2D element properties command
   */
  handleUpdateSpatialized2DElementProperties(data: any): void {
    const elementId = data.id
    const element = this._spatialObjects[elementId] as Spatialized2DElement
    // Call updateSpatializedElementProperties to update common properties
    this.updateSpatializedElementProperties(elementId, data)

    // Following Swift implementation, handle specific 2D element properties separately
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

      // Remove references to non-existent properties
    }
  }

  /**
   * update transform for spatializedElement
   */
  handleUpdateSpatializedElementTransform(data: any): void {
    const elementId = data.id
    const element = this._spatialObjects[elementId] as SpatializedElement

    if (element && data) {
      // Following VisionOS implementation, prioritize the matrix array
      if (data.matrix) {
        // Validate matrix array length equals 16
        if (data.matrix.length === 16) {
          // Update transform using the matrix array
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
        // If there is no matrix but there is transform, preserve existing behavior
        element.transform = { ...element.transform, ...data.transform }
      }
    }
  }

  /**
   * Handle add-child command
   */
  private handleAddSpatializedElementToSpatialized2DElement(
    command: any,
  ): void {
    const { parentId, childId } = command
    const parent = this._spatialObjects[parentId] as Spatialized2DElement
    const child = this._spatialObjects[childId] as SpatializedElement

    if (parent && child) {
      parent.addChild(child)
    }
  }

  /**
   * Handle custom window open request
   */
  public handleWindowOpenCustom(
    url: string,
  ): Promise<WebViewElementInfo | null> {
    // Delegate to ProtocolHandlerManager
    return ProtocolHandlerManager.getInstance().handleUrl(url)
  }

  /**
   * Create SpatializedElement
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

      // Create different elements based on type
      switch (elementType) {
        case SpatializedElementType.Spatialized2DElement:
          element = new Spatialized2DElement(spatialId)
          break
        case SpatializedElementType.SpatializedStatic3DElement:
          // Future: support 3D elements
          console.warn('SpatializedStatic3DElement not yet supported')
          return null
        case SpatializedElementType.SpatializedDynamic3DElement:
          // Future: support dynamic 3D elements
          console.warn('SpatializedDynamic3DElement not yet supported')
          return null
        default:
          // Default: create 2D element
          element = new Spatialized2DElement(spatialId)
      }

      if (!element) {
        return null
      }

      // Set element properties
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

      // Store element reference
      this._spatialObjects[element.id] = element

      // Register into ProtocolHandlerManager
      if (element instanceof Spatialized2DElement) {
        ProtocolHandlerManager.getInstance().registerElement(element)
      }

      // Create WebViewModel
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
   * Send message to web page
   */
  sendWebMsg(message: any): void {
    if (this.spatialWebViewModel) {
      this.spatialWebViewModel.sendMessage(message)
    }
  }

  /**
   * Update 3D size
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

    // Execute different logic based on state
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
    return (this._spatialObjects[id] as SpatializedElement) || null
  }

  updateSpatializedElementProperties(
    id: string,
    properties: Record<string, any>,
  ): void {
    const element = this.findSpatialObject(id)
    if (element && properties) {
      // Check properties object exists
      // Following Swift implementation: check and update each property individually
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

    // Check if child already exists to avoid duplicate addition
    if (this._children[child.id]) {
      console.warn(
        `Child element with id ${child.id} already exists, skipping addition`,
      )
      return
    }

    this._children[child.id] = child
    // Safely set parent property
    try {
      if (child.setParent) {
        // Type assertion because this now implements ScrollAbleSpatialElementContainer
        // Avoid recursion: check whether child._parent is already this
        const childParent = (child as any)._parent
        if (!childParent || childParent.id !== this.id) {
          child.setParent(this as unknown as ScrollAbleSpatialElementContainer)
        }
      } else if ('parent' in child && !(child as any).parent) {
        ;(child as any).parent = this
      }
    } catch (error) {
      console.warn('Failed to set parent for child element:', error)
    }
    this.emit('childAdded', { child })
  }

  // Remove method overloading; implement the interface-required method directly
  removeChild(spatializedElement: SpatializedElement): void {
    // Handle object parameter
    if (!spatializedElement || !spatializedElement.id) {
      throw new Error('Invalid child element')
    }

    const child = this._children[spatializedElement.id]
    if (child) {
      delete this._children[spatializedElement.id]
      // Safely unset parent property
      try {
        if (child.setParent) {
          // Type assertion because setParent may not accept null
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

  // Implement getChildrenOfType required by ScrollAbleSpatialElementContainer
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

  // Implement getChildren required by ScrollAbleSpatialElementContainer
  getChildren(): Record<string, SpatializedElement> {
    return { ...this._children }
  }

  // For backward compatibility, provide a method to get children as array
  getChildrenArray(): any[] {
    return Object.values(this._children)
  }

  // For backward compatibility, provide a generic version of getChildrenOfType
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

    this._spatialObjects[object.spatialId] = object

    // Use duck typing to check required properties instead of relying on instanceof
    if (object && typeof object === 'object' && 'id' in object && object.id) {
      this.addChild(object)
    }

    // Set destroy listener
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
      delete this._spatialObjects[destroyedObject.spatialId]
      if (this._children[destroyedObject.spatialId]) {
        delete this._children[destroyedObject.spatialId]
      } else if (destroyedObject.id && this._children[destroyedObject.id]) {
        delete this._children[destroyedObject.id]
      }
    }
  }

  public sendWebMsgToElement(id: string, data: any): void {
    console.log(`Sending web message to ${id}:`, data)
    // Simplified: in practice should send message to WebView
  }

  handleNavigationCheck(url: string): boolean {
    console.log('Checking navigation to:', url)
    return true // simplified: allow all navigation
  }

  handleWindowClose(): void {
    console.log('Closing window')
    this.destroy()
  }

  onPageStartLoad(): void {
    const objects = Object.values(this._spatialObjects)
    objects.forEach(obj => {
      if (obj && typeof obj.destroy === 'function') {
        obj.destroy()
      }
    })
    this._spatialObjects = {}
    this.backgroundMaterial = BackgroundMaterial.none
  }

  addObject(object: any): void {
    // Use duck typing to check whether the object has required properties instead of relying on instanceof
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
    // Clean up event listeners
    // window.removeEventListener('spatial_iframe_created', this._boundSpatialIframeCreatedHandler);

    // Destroy all spatial objects
    Object.values(this._spatialObjects).forEach(obj => {
      if (obj && typeof obj.destroy === 'function') {
        obj.destroy()
      }
    })
    this._spatialObjects = {}
    // Destroy all child elements
    Object.values(this._children).forEach(child => {
      if (child && typeof child.destroy === 'function') {
        child.destroy()
      }
    })
    this._children = {}

    // Clear parent reference
    this._parent = null
  }
}
