import type { SpatializedVisualValues } from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { valuesToMotionStyle } from './style'

/**
 * Inputs required to compute the React style outlet for a motion binding.
 */
interface ResolveMotionStyleOptions {
  /** The latest sampled visual values from the motion controller. */
  values: SpatializedVisualValues
}

/**
 * Converts sampled motion values into the React style outlet.
 *
 * @param options - Style resolution inputs from `useAnimation()`.
 * @returns The React style that should be applied to the bound node.
 */
export function resolveMotionStyle({
  values,
}: ResolveMotionStyleOptions): CSSProperties {
  return valuesToMotionStyle(values)
}
