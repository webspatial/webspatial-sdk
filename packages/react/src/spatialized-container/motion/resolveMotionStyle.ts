import type {
  SpatializedMotionKind,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { valuesToMotionStyle } from './style'

const EMPTY_STYLE: CSSProperties = {}

interface ResolveMotionStyleOptions {
  values: SpatializedVisualValues
  targetKind: SpatializedMotionKind | null
  suppressedFields: Set<string> | null
  nativeElementSupported: boolean
}

export function resolveMotionStyle({
  values,
  targetKind,
  suppressedFields,
  nativeElementSupported,
}: ResolveMotionStyleOptions): CSSProperties {
  if (targetKind === 'static3d' || targetKind === 'dynamic3d') {
    return EMPTY_STYLE
  }

  const rawStyle = valuesToMotionStyle(values)

  // Native 2D playback owns these fields, so React must not mirror them.
  if (
    targetKind === 'spatialized2d' &&
    nativeElementSupported &&
    suppressedFields
  ) {
    return {
      ...(suppressedFields.has('opacity') ? {} : { opacity: rawStyle.opacity }),
      ...(suppressedFields.has('transform')
        ? {}
        : { transform: rawStyle.transform }),
    }
  }

  return rawStyle
}

export { EMPTY_STYLE as EMPTY_MOTION_STYLE }
