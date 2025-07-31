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
  width: number
  height: number
  opacity: number
  visible: boolean
  scrollWithParent: boolean
  zIndex: number
  backOffset: number
  rotationAnchor: Vec3
}

export interface Spatialized2DElementProperties
  extends SpatializedElementProperties {
  scrollEnabled: boolean
  cornerRadius: CornerRadius
  material: BackgroundMaterialType
}
