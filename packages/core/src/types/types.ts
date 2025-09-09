export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Vec4 {
  x: number
  y: number
  z: number
  w: number
}

// export interface SpatialTransform {
//   position: Vec3
//   quaternion: Vec4
//   scale: Vec3
// }

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
  rotationAnchor: Vec3
  enableTapGesture: boolean
  enableDragGesture: boolean
  enableDragEndGesture: boolean
  enableRotationGesture: boolean
  enableRotateEndGesture: boolean
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
  defaultSize?: Size

  resizability?: {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }
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

declare global {
  interface Window {
    xrCurrentSceneDefaults: (
      defaultConfig: SpatialSceneCreationOptions,
    ) => Promise<SpatialSceneCreationOptions>

    // Location for webspatial custom functions
    __WebSpatialData: {
      androidNativeMessage: Function
      getNativeVersion: Function
    }

    // Location for webspatial internal callbacks (eg. completion events)
    __SpatialWebEvent: Function

    // Used to access webkit specific api
    webkit: any

    // Will be removed in favor of __WebSpatialData
    WebSpatailNativeVersion: string

    __webspatialsdk__?: {
      XR_ENV?: string
      'natvie-version'?: string
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }
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
// & {
//   type: 'spatialtap'
// }

export type Point3D = Vec3

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

export interface SpatialRotationEventDetail {
  rotation: { vector: [number, number, number, number] }
  startAnchor3D: Vec3
  startLocation3D: Point3D
}

export type SpatialRotationEvent = CustomEvent<SpatialRotationEventDetail>

export type SpatialRotationEndEvent = SpatialRotationEvent

export interface SpatialMagnifyEventDetail {
  magnification: number
  velocity: number
  startAnchor3D: Vec3
  startLocation3D: Point3D
}

export type SpatialMagnifyEvent = CustomEvent<SpatialMagnifyEventDetail>

export type SpatialMagnifyEndEvent = SpatialMagnifyEvent
