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

export enum SpatializedElementType {
  Spatialized2DElement,
  SpatializedStatic3DElement,
  SpatializedDynamic3DElement,
}
