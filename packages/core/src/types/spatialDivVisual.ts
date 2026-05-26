// ---- SpatialDiv visual value model (shared by segment + timeline motion) ----

/**
 * Structured visual transform for a SpatialDiv.
 * Composed in fixed order: translate → rotate → scale.
 * Does NOT support arbitrary CSS transform strings, skew, perspective, or matrix interpolation.
 */
export interface SpatialDivVisualTransform {
  /** Translation in CSS pixels. */
  translate?: { x?: number; y?: number; z?: number }
  /** Rotation in degrees, aligning with CSS rotateX/Y/Z(). */
  rotate?: { x?: number; y?: number; z?: number }
  /** Scale as unitless multipliers, aligning with CSS scaleX/Y/Z(). */
  scale?: { x?: number; y?: number; z?: number }
}

/**
 * Whitelisted visual fields on a SpatialDiv at an instant in time.
 * Does not include layout/size fields (width, height, back, depth).
 */
export interface SpatialDivVisualValues {
  transform?: SpatialDivVisualTransform
  opacity?: number
}
