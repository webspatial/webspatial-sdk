import type {
  SpatializedMotionKind,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { valuesToMotionStyle } from './style'
import type { TerminalOpacityOwner } from './motionBindingTypes'
import { getMotionFieldPlugin } from './plugins/registry'

/** Shared immutable empty style for targets that do not render React motion. */
const EMPTY_STYLE: CSSProperties = {}

/**
 * Applies the ownership plugin decision for `opacity` to the React style
 * outlet.
 *
 * @param rawOpacity - The raw sampled opacity value from the motion timeline.
 * @param suppressed - Whether native playback is currently suppressing opacity.
 * @param owner - The post-terminal owner selected for opacity.
 * @param authoredOpacity - The explicit React-authored opacity, if present.
 * @returns The opacity patch that should be merged into the final style.
 */
function resolveOpacityStylePatch(
  rawOpacity: CSSProperties['opacity'],
  suppressed: boolean,
  owner: TerminalOpacityOwner,
  authoredOpacity: CSSProperties['opacity'] | undefined,
): CSSProperties {
  const opacityPlugin = getMotionFieldPlugin('opacity')
  const decision = opacityPlugin?.resolveInnerStyle({
    suppressed,
    owner,
    authoredValue: authoredOpacity,
    rawValue: rawOpacity,
  })

  if (decision?.mode === 'omit') {
    return {}
  }
  if (decision?.mode === 'set') {
    return {
      opacity: decision.value,
    }
  }
  return rawOpacity === undefined ? {} : { opacity: rawOpacity }
}

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
  /** The explicit React `style.opacity` captured for terminal handoff. */
  explicitStyleOpacity?: CSSProperties['opacity']
  /** The layer that should remain responsible for terminal opacity. */
  terminalOpacityOwner: TerminalOpacityOwner
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
  explicitStyleOpacity,
  terminalOpacityOwner,
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
      ...resolveOpacityStylePatch(
        rawStyle.opacity,
        suppressedFields.has('opacity'),
        null,
        explicitStyleOpacity,
      ),
      ...(suppressedFields.has('transform')
        ? {}
        : { transform: rawStyle.transform }),
    }
  }

  if (targetKind === 'spatialized2d' && nativeElementSupported) {
    return {
      ...resolveOpacityStylePatch(
        rawStyle.opacity,
        false,
        terminalOpacityOwner,
        explicitStyleOpacity,
      ),
      ...(rawStyle.transform === undefined
        ? {}
        : { transform: rawStyle.transform }),
    }
  }

  return rawStyle
}

export { EMPTY_STYLE as EMPTY_MOTION_STYLE }
