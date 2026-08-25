'use client'

import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
} from '@webspatial/core-sdk'
import type { EntityMotionAnimation } from '../reality/hooks/EntityMotionBinding'
import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
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
 * Ready-gated experimental-entry facade for the real spatial useEntityAnimation hook.
 *
 * @param config - The entity animation author config.
 * @returns The animated props tuple backed by the spatial implementation.
 */
export function useEntityAnimation(
  config: EntityMotionConfig,
): [EntityMotionAnimation, EntityPlaybackApi, EntityMotionProps] {
  const real = getSpatialImpl()?.useEntityAnimation
  if (!real) return throwAnimationUnavailable('useEntityAnimation')
  return real(config)
}
