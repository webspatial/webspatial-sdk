// Basic vector types
export interface Vec2 {
  x: number
  y: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

// Window style enum
export enum WindowStyle {
  volume = 'volume',
  window = 'window',
}

// Scene state enum
export enum SceneStateKind {
  idle = 'idle',
  pending = 'pending',
  willVisible = 'willVisible',
  visible = 'visible',
  fail = 'fail',
}

// Spatialized element type enum
export enum SpatializedElementType {
  Spatialized2DElement = 'Spatialized2DElement',
  SpatializedStatic3DElement = 'SpatializedStatic3DElement',
  SpatializedDynamic3DElement = 'SpatializedDynamic3DElement',
}

// Event emitter interface
export interface EventEmitterProtocol {
  listeners: Record<string, Array<(object: any, data: any) => void>>
  on(event: string, listener: (object: any, data: any) => void): void
  emit(event: string, data: any): void
  off(event: string, listener: (object: any, data: any) => void): void
  reset(): void
}

// Spatial object interface
export interface SpatialObjectProtocol extends EventEmitterProtocol {
  spatialId: string
  destroy(): void
}

// Scroll-related interface
export interface SpatialScrollAble {
  updateDeltaScrollOffset(delta: Vec2): void
  stopScrolling(): void
  scrollPageEnabled: boolean
  scrollOffset: Vec2
}

// Child element container interface
export interface SpatializedElementContainer {
  id: string
  parent: ScrollAbleSpatialElementContainer | null
  addChild(spatializedElement: SpatializedElement): void
  removeChild(spatializedElement: SpatializedElement): void
  getChildren(): Record<string, SpatializedElement>
  getChildrenOfType(
    type: SpatializedElementType,
  ): Record<string, SpatializedElement>
}

// Scrollable element container interface
export interface ScrollAbleSpatialElementContainer
  extends SpatialScrollAble,
    SpatializedElementContainer {}

// Spatialized element interface
export interface SpatializedElement extends SpatialObjectProtocol {
  id: string
  name: string
  type: SpatializedElementType
  clientX: number
  clientY: number
  width: number
  height: number
  depth: number
  transform: any // simplified: in practice should be a transform matrix
  rotationAnchor: Vec3
  opacity: number
  visible: boolean
  scrollWithParent: boolean
  zIndex: number
  clip: boolean
  enableTapGesture: boolean
  enableDragStartGesture: boolean
  enableDragGesture: boolean
  enableDragEndGesture: boolean
  enableRotateStartGesture: boolean
  enableRotateGesture: boolean
  enableRotateEndGesture: boolean
  enableMagnifyStartGesture: boolean
  enableMagnifyGesture: boolean
  enableMagnifyEndGesture: boolean
  setParent(parent: ScrollAbleSpatialElementContainer): void
  getParent(): ScrollAbleSpatialElementContainer | null
}

// Spatialized 2D element interface
export interface Spatialized2DElement
  extends SpatializedElement,
    ScrollAbleSpatialElementContainer {
  cornerRadius: CornerRadius
  backgroundMaterial: BackgroundMaterial
  scrollEnabled: boolean
  scrollOffset: Vec2
}

// Scene config interface
export interface SceneConfig {
  width: number
  height: number
  depth: number
  navHeight: number
}

// Scene options interface
export interface SceneOptions {
  width?: number
  height?: number
  depth?: number
  navHeight?: number
}

// Spatial scene interface
export interface SpatialScene extends SpatialObjectProtocol {
  id: string
  name: string
  version: string
  url: string
  windowStyle: WindowStyle
  state: SceneStateKind
  sceneConfig: SceneConfig
  children: Record<string, SpatializedElement>
  spatialWebViewModel: any
  findSpatialObject(id: string): SpatializedElement | null
  addSpatialObject(object: SpatialObjectProtocol): void
  sendWebMsg(id: string, data: any): void
  moveToState(state: SceneStateKind, sceneOptions?: SceneOptions): void
  handleNavigationCheck(url: string): boolean
  handleWindowOpenCustom(url: string, windowStyle: WindowStyle): void
  handleWindowClose(): void
}

export enum BackgroundMaterial {
  transparent = 'transparent',
  translucent = 'translucent',
  thin = 'thin',
  thick = 'thick',
  regular = 'regular',
  none = 'none',
}

export interface CornerRadius {
  topLeading: number
  bottomLeading: number
  topTrailing: number
  bottomTrailing: number
}
