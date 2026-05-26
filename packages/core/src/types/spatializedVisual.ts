import type {
  SpatialDivVisualTransform,
  SpatialDivVisualValues,
} from './spatialDivVisual'

/** Umbrella alias: structured visual transform (translate → rotate → scale). */
export type SpatializedVisualTransform = SpatialDivVisualTransform

/** Umbrella alias: whitelisted visual fields at an instant in time. */
export type SpatializedVisualValues = SpatialDivVisualValues
