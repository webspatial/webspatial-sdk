import type { SpatializedMotionProperty } from '../../types/spatializedMotion'

export type SpatializedMotionPropertyKeys =
  | SpatializedMotionProperty
  | readonly SpatializedMotionProperty[]

/** Normalize react-spring-style key argument to a property list, or `null` = all properties. */
export function normalizeMotionPropertyKeys(
  keys?: SpatializedMotionPropertyKeys,
): SpatializedMotionProperty[] | null {
  if (keys === undefined) return null
  if (typeof keys === 'string') return [keys]
  return [...keys]
}
