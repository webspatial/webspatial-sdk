import type {
  SpatializedMotionKind,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { valuesToMotionStyle } from './style'

/** Shared immutable empty style for targets that do not render React motion. */
const EMPTY_STYLE: CSSProperties = {}

/**
 * Inputs required to compute the React style outlet for a motion binding.
 */
interface ResolveMotionStyleOptions {
  /** The latest sampled visual values from the motion controller. */
  values: SpatializedVisualValues
  /** The runtime target kind currently attached to the controller. */
  targetKind: SpatializedMotionKind | null
  /** Indicates whether native element playback is available in this runtime. */
  nativeElementSupported: boolean
}

/**
 * Converts sampled motion values into the React style outlet expected by the
 * current runtime target.
 *
 * @param options - Style resolution inputs from `useAnimation()`.
 * @returns The React style that should be applied to the bound node.
 */
export function resolveMotionStyle({
  values,
  targetKind,
  nativeElementSupported,
}: ResolveMotionStyleOptions): CSSProperties {
  if (targetKind == null) {
    return valuesToMotionStyle(values)
  }

  if (targetKind === 'static3d' || targetKind === 'dynamic3d') {
    return EMPTY_STYLE
  }

  if (targetKind === 'spatialized2d' && nativeElementSupported) {
    return EMPTY_STYLE
  }

  return valuesToMotionStyle(values)
}

export { EMPTY_STYLE as EMPTY_MOTION_STYLE }
