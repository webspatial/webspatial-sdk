import { SpatialGeometry } from '../reality/geometry/SpatialGeometry'
import { SpatialMaterial } from '../reality/material/SpatialMaterial'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type Point3D = Vec3

/**
 * Material type for SpatialDiv or HTML document.
 *
 * This type defines the background material options for both SpatialDiv elements and HTML documents.
 *
 * - `'none'`: This is the default value.
 *   - For HTML documents, the web page window will have the default native background.
 *   - For SpatialDiv, the window will have a transparent background.
 * - `'translucent'`: Represents a glass-like material in AVP (Apple Vision Pro).
 * - `'thick'`: Represents a thick material in AVP.
 * - `'regular'`: Represents a regular material in AVP.
 * - `'thin'`: Represents a thin material in AVP.
 * - `'transparent'`: Represents a fully transparent background.
 */
export type BackgroundMaterialType =
  | 'none'
  | 'translucent'
  | 'thick'
  | 'regular'
  | 'thin'
  | 'transparent'

export type CornerRadius = {
  topLeading: number
  bottomLeading: number
  topTrailing: number
  bottomTrailing: number
}

export interface SpatialSceneProperties {
  cornerRadius: CornerRadius
  material: BackgroundMaterialType
  opacity: number
}

export enum SpatializedElementType {
  Spatialized2DElement,
  SpatializedStatic3DElement,
  SpatializedDynamic3DElement,
}

export interface SpatializedElementProperties {
  name: string
  clientX: number
  clientY: number
  width: number
  height: number
  depth: number
  opacity: number
  visible: boolean
  scrollWithParent: boolean
  zIndex: number
  backOffset: number
  rotationAnchor: Point3D
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
}

export interface Spatialized2DElementProperties
  extends SpatializedElementProperties {
  scrollPageEnabled: boolean
  cornerRadius: CornerRadius
  material: BackgroundMaterialType
  scrollEdgeInsetsMarginRight: number
}

export interface SpatializedStatic3DElementProperties
  extends SpatializedElementProperties {
  modelURL: string
}

export interface SpatialSceneCreationOptions {
  defaultSize?: {
    width: number | string // Initial width of the window
    height: number | string // Initial height of the window
    depth?: number | string // Initial depth of the window, only for volume
  }

  resizability?: {
    minWidth?: number | string // Minimum width of the window
    minHeight?: number | string // Minimum height of the window
    maxWidth?: number | string // Maximum width of the window
    maxHeight?: number | string // Maximum height of the window
  }
  worldScaling?: WorldScalingType
  worldAlignment?: WorldAlignmentType

  baseplateVisibility?: BaseplateVisibilityType
}

export const BaseplateVisibilityValues = [
  'automatic',
  'visible',
  'hidden',
] as const
export type BaseplateVisibilityType = (typeof BaseplateVisibilityValues)[number]

export function isValidBaseplateVisibilityType(type: string): Boolean {
  return BaseplateVisibilityValues.includes(type as BaseplateVisibilityType)
}

export const WorldScalingValues = ['automatic', 'dynamic'] as const
export type WorldScalingType = (typeof WorldScalingValues)[number]

export function isValidWorldScalingType(type: string): Boolean {
  return WorldScalingValues.includes(type as WorldScalingType)
}

export const WorldAlignmentValues = [
  'adaptive',
  'automatic',
  'gravityAligned',
] as const
export type WorldAlignmentType = (typeof WorldAlignmentValues)[number]

export function isValidWorldAlignmentType(type: string): Boolean {
  return WorldAlignmentValues.includes(type as WorldAlignmentType)
}

export const SpatialSceneValues = ['window', 'volume'] as const
export type SpatialSceneType = (typeof SpatialSceneValues)[number]

export function isValidSpatialSceneType(type: string): Boolean {
  return SpatialSceneValues.includes(type as SpatialSceneType)
}

/**
 * check px,m and number, number must be >= 0
 *
 * */
export function isValidSceneUnit(val: string | number): boolean {
  // only support number or string with unit px or m
  // rpx cm mm not allowed
  if (typeof val === 'number') {
    return val >= 0
  }
  if (typeof val === 'string') {
    if (val.endsWith('px')) {
      // check if number
      if (isNaN(Number(val.slice(0, -2)))) {
        return false
      }
      return Number(val.slice(0, -2)) >= 0
    }
    if (val.endsWith('m')) {
      // check if number
      if (isNaN(Number(val.slice(0, -1)))) {
        return false
      }
      return Number(val.slice(0, -1)) >= 0
    }
  }
  return false
}

export interface SpatialEntityProperties {
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export type SpatialEntityEventType = 'tap' //| 'drag' | 'rotate' | 'scale'

export type SpatialGeometryType =
  | 'BoxGeometry'
  | 'PlaneGeometry'
  | 'SphereGeometry'
  | 'CylinderGeometry'
  | 'ConeGeometry'

export interface SpatialBoxGeometryOptions {
  width?: number
  height?: number
  depth?: number
  cornerRadius?: number
  splitFaces?: boolean
}

export interface SpatialPlaneGeometryOptions {
  width?: number
  height?: number
  cornerRadius?: number
}

export interface SpatialSphereGeometryOptions {
  radius?: number
}

export interface SpatialConeGeometryOptions {
  radius?: number
  height?: number
}

export interface SpatialCylinderGeometryOptions {
  radius?: number
  height?: number
}

export type SpatialGeometryOptions =
  | SpatialBoxGeometryOptions
  | SpatialPlaneGeometryOptions
  | SpatialSphereGeometryOptions
  | SpatialCylinderGeometryOptions
  | SpatialConeGeometryOptions

export type SpatialMaterialType = 'unlit'

type BlendingType = 'opaque' | 'transparent'

export interface SpatialUnlitMaterialOptions {
  color?: string
  textureId?: string
  blending?: BlendingType

  opacity?: number
}

export interface ModelComponentOptions {
  mesh: SpatialGeometry
  materials: SpatialMaterial[]
}

export interface SpatialModelEntityCreationOptions {
  modelAssetId: string
  name?: string
}

export interface ModelAssetOptions {
  url: string
}

export enum SpatialSceneState {
  idle = 'idle',
  pending = 'pending',
  willVisible = 'willVisible',
  visible = 'visible',
  fail = 'fail',
}

/**
 * Translate event, matching similar behavior to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event
 */
export type SpatialModelDragEvent = {
  eventType: 'dragstart' | 'dragend' | 'drag'
  translation3D: Vec3
  startLocation3D: Vec3
}

export interface Size {
  width: number
  height: number
}

export interface Size3D extends Size {
  depth: number
}

export class CubeInfo {
  constructor(
    public size: Size3D,
    public origin: Vec3,
  ) {
    this.size = size
    this.origin = origin
  }

  get x() {
    return this.origin.x
  }

  get y() {
    return this.origin.y
  }

  get z() {
    return this.origin.z
  }

  get width() {
    return this.size.width
  }

  get height() {
    return this.size.height
  }

  get depth() {
    return this.size.depth
  }

  get left() {
    return this.x
  }

  get top() {
    return this.y
  }

  get right() {
    return this.x + this.width
  }

  get bottom() {
    return this.y + this.height
  }

  get back() {
    return this.z
  }

  get front() {
    return this.z + this.depth
  }
}

export interface SpatialTapEventDetail {
  location3D: Point3D
}

export type SpatialTapEvent = CustomEvent<SpatialTapEventDetail>

export interface SpatialDragEventDetail {
  location3D: Point3D
  startLocation3D: Point3D
  translation3D: Vec3
  predictedEndTranslation3D: Vec3
  predictedEndLocation3D: Point3D
  velocity: Size
}

export type SpatialDragEvent = CustomEvent<SpatialDragEventDetail>

export type SpatialDragEndEvent = SpatialDragEvent

export interface SpatialRotateEventDetail {
  rotation: { vector: [number, number, number, number] }
  startAnchor3D: Vec3
  startLocation3D: Point3D
}

export type SpatialRotateEvent = CustomEvent<SpatialRotateEventDetail>

export type SpatialRotateEndEvent = SpatialRotateEvent

export interface SpatialMagnifyEventDetail {
  magnification: number
  velocity: number
  startAnchor3D: Vec3
  startLocation3D: Point3D
}

export type SpatialMagnifyEvent = CustomEvent<SpatialMagnifyEventDetail>

export type SpatialMagnifyEndEvent = SpatialMagnifyEvent
