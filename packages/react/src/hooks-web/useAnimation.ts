'use client'

import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
import type {
  SpatializedMotionConfig,
  UseAnimationResult,
} from '../spatialized-container/motion'
import { getSpatialImpl } from '../runtime/bridge'

/**
 * Throws the experimental-entry readiness error for capabilities that require the
 * spatial implementation to be loaded first.
 *
 * @param capability - The capability name to include in the runtime error.
 * @returns This function never returns.
 */
function throwAnimationUnavailable(capability: string): never {
  throw new WebSpatialRuntimeError(
    capability,
    `${capability} is not available until bootSpatial() has resolved. Wrap the animated subtree in <SpatialBoot> or await bootSpatial() before mounting the component.`,
  )
}

/**
 * Ready-gated experimental-entry facade for the real spatial useAnimation hook.
 *
 * @param config - The spatialized motion author config.
 * @returns The animation tuple backed by the spatial implementation.
 */
export function useAnimation(
  config: SpatializedMotionConfig,
): UseAnimationResult {
  const real = getSpatialImpl()?.useAnimation
  if (!real) return throwAnimationUnavailable('useAnimation')
  return real(config)
}
