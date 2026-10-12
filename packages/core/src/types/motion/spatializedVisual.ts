// ---- Spatialized element visual value model (segment + timeline motion) ----

/**
 * Structured visual transform for a spatialized container element.
 * Composed in fixed order: translate → rotate → scale.
 * Does NOT support arbitrary CSS transform strings, skew, perspective, or matrix interpolation.
 */
export interface SpatializedVisualTransform {
  /** Translation in CSS pixels. */
  translate?: { x?: number; y?: number; z?: number }
  /** Rotation in degrees, aligning with CSS rotateX/Y/Z(). */
  rotate?: { x?: number; y?: number; z?: number }
  /** Scale as unitless multipliers, aligning with CSS scaleX/Y/Z(). */
  scale?: { x?: number; y?: number; z?: number }
}

/**
 * Whitelisted visual fields on a spatialized element at an instant in time.
 * Does not include layout/size fields (width, height, back, depth).
 */
export interface SpatializedVisualValues {
  transform?: SpatializedVisualTransform
  opacity?: number
}
