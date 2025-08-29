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

export interface SpatialTransform {
  position: Vec3
  quaternion: Vec4
  scale: Vec3
}

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
}

export enum SpatializedElementType {
  Spatialized2DElement,
  SpatializedStatic3DElement,
  SpatializedDynamic3DElement,
}

export interface SpatializedElementProperties {
  name: string
  width: number
  height: number
  opacity: number
  visible: boolean
  scrollWithParent: boolean
  zIndex: number
  backOffset: number
  rotationAnchor: Vec3
  enableGesture: boolean
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
    xrCurrentSceneType: SpatialSceneType
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

    // Marks the page as unloaded so it doesn't send additional events
    __WebSpatialUnloaded: boolean

    // Internal id information mapping to internal state about the native window
    _webSpatialID: string
    _webSpatialGroupID: string
    _webSpatialParentGroupID: string

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
