'use client'

import type {
  AnimatedProps,
  AnimationApi,
  AnimationConfig,
} from '@webspatial/core-sdk'
import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
import type {
  SpatializedMotionConfig,
  UseAnimationResult,
} from '../spatialized-container/motion'
import { getSpatialImpl } from '../runtime/bridge'

function throwAnimationUnavailable(capability: string): never {
  throw new WebSpatialRuntimeError(
    capability,
    `${capability} is not available until bootSpatial() has resolved. Wrap the animated subtree in <SpatialBoot> or await bootSpatial() before mounting the component.`,
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
  config: SpatializedMotionConfig,
): UseAnimationResult {
  const real = getSpatialImpl()?.useAnimation
  if (!real) return throwAnimationUnavailable('useAnimation')
  return real(config)
}

/**
 * Ready-gated default-entry facade for the real spatial useEntityAnimation hook.
 */
export function useEntityAnimation(
  config: AnimationConfig,
): [AnimatedProps, AnimationApi] {
  const real = getSpatialImpl()?.useEntityAnimation
  if (!real) return throwAnimationUnavailable('useEntityAnimation')
  return real(config)
}
