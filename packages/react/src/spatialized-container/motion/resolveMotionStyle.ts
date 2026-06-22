import type {
  SpatializedMotionKind,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { valuesToMotionStyle } from './style'
import type { MotionFieldMetadataMap } from './motionBindingTypes'
import { getMotionFieldDescriptors } from './plugins/registry'

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
  /** The field set currently suppressed by native playback. */
  suppressedFields: Set<string> | null
  /** Indicates whether native element playback is available in this runtime. */
  nativeElementSupported: boolean
  /** Unified field metadata mirrored from the motion binding runtime. */
  fieldMetadata: MotionFieldMetadataMap
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
  suppressedFields,
  nativeElementSupported,
  fieldMetadata,
}: ResolveMotionStyleOptions): CSSProperties {
  if (targetKind === 'static3d' || targetKind === 'dynamic3d') {
    return EMPTY_STYLE
  }

  const rawStyle = valuesToMotionStyle(values)

  if (targetKind === 'spatialized2d' && nativeElementSupported) {
    const style: CSSProperties = {}
    for (const descriptor of getMotionFieldDescriptors()) {
      if (!descriptor.styleKey) {
        continue
      }
      const metadata = fieldMetadata[descriptor.field]
      const rawValue = descriptor.readRawValue({
        rawStyle,
      })
      const decision = descriptor.resolveInnerStyle({
        suppressed: suppressedFields?.has(descriptor.field) ?? false,
        owner: metadata?.terminalOwner ?? null,
        authoredValue: metadata?.authoredValue,
        rawValue,
      })
      if (decision.mode === 'omit') {
        continue
      }
      if (decision.mode === 'set') {
        style[descriptor.styleKey] = decision.value as never
        continue
      }
      if (rawValue !== undefined) {
        style[descriptor.styleKey] = rawValue as never
      }
    }
    return style
  }

  return rawStyle
}

export { EMPTY_STYLE as EMPTY_MOTION_STYLE }
