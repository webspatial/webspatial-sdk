// 基础向量类型
export interface Vec2 {
  x: number
  y: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

// 窗口样式枚举
export enum WindowStyle {
  volume = 'volume',
  window = 'window',
}

// 场景状态枚举
export enum SceneStateKind {
  idle = 'idle',
  pending = 'pending',
  willVisible = 'willVisible',
  visible = 'visible',
  fail = 'fail',
}

// 空间化元素类型枚举
export enum SpatializedElementType {
  Spatialized2DElement = 'Spatialized2DElement',
  SpatializedStatic3DElement = 'SpatializedStatic3DElement',
  SpatializedDynamic3DElement = 'SpatializedDynamic3DElement',
}

// 事件发射器接口
export interface EventEmitterProtocol {
  listeners: Record<string, Array<(object: any, data: any) => void>>
  on(event: string, listener: (object: any, data: any) => void): void
  emit(event: string, data: any): void
  off(event: string, listener: (object: any, data: any) => void): void
  reset(): void
}

// 空间对象接口
export interface SpatialObjectProtocol extends EventEmitterProtocol {
  spatialId: string
  destroy(): void
}

// 滚动相关接口
export interface SpatialScrollAble {
  updateDeltaScrollOffset(delta: Vec2): void
  stopScrolling(): void
  scrollPageEnabled: boolean
  scrollOffset: Vec2
}

// 子元素容器接口
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

// 可滚动元素容器接口
export interface ScrollAbleSpatialElementContainer
  extends SpatialScrollAble,
    SpatializedElementContainer {}

// 空间元素接口
export interface SpatializedElement extends SpatialObjectProtocol {
  id: string
  name: string
  type: SpatializedElementType
  clientX: number
  clientY: number
  width: number
  height: number
  depth: number
  transform: any // 简化实现，实际应该是变换矩阵
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

// 空间化2D元素接口
export interface Spatialized2DElement
  extends SpatializedElement,
    ScrollAbleSpatialElementContainer {
  cornerRadius: CornerRadius
  backgroundMaterial: BackgroundMaterial
  scrollEnabled: boolean
  scrollOffset: Vec2
}

// 场景配置接口
export interface SceneConfig {
  width: number
  height: number
  depth: number
  navHeight: number
}

// 场景选项接口
export interface SceneOptions {
  width?: number
  height?: number
  depth?: number
  navHeight?: number
}

// 空间场景接口
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
