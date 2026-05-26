import type { SpatialDivMotionProperty } from '../../types/spatialDivMotion'

export type SpatialDivMotionPropertyKeys =
  | SpatialDivMotionProperty
  | readonly SpatialDivMotionProperty[]

/** Normalize react-spring-style key argument to a property list, or `null` = all properties. */
export function normalizeMotionPropertyKeys(
  keys?: SpatialDivMotionPropertyKeys,
): SpatialDivMotionProperty[] | null {
  if (keys === undefined) return null
  if (typeof keys === 'string') return [keys]
  return [...keys]
}
