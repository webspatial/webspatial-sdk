'use client'

import type {
  AnimatedProps,
  AnimationApi,
  AnimationConfig,
} from '@webspatial/core-sdk'
import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
import { getSpatialImpl } from '../runtime/bridge'

function throwAnimationUnavailable(): never {
  throw new WebSpatialRuntimeError(
    'useAnimation',
    'useAnimation is not available until bootSpatial() has resolved. Wrap the animated subtree in <SpatialBoot> or await bootSpatial() before mounting the component.',
  )
}

/**
 * Ready-gated default-entry facade for the real spatial useAnimation hook.
 *
 * Unlike placeholder hooks, useAnimation has no meaningful web-mode value:
 * callers must render only after bootSpatial() readiness, for example under
 * <SpatialBoot>. This facade intentionally does not call bootSpatial() or
 * import the spatial chunk by itself.
 */
export function useAnimation(
  config: AnimationConfig,
): [AnimatedProps, AnimationApi] {
  const real = getSpatialImpl()?.useAnimation
  if (!real) return throwAnimationUnavailable()
  return real(config)
}
