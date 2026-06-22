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
import { useAnimation as useSpatializedElementAnimation } from '../spatialized-container/motion/useAnimation'
import { getSpatialImpl } from '../runtime/bridge'

function throwAnimationUnavailable(capability: string): never {
  throw new WebSpatialRuntimeError(
    capability,
    `${capability} is not available until bootSpatial() has resolved. Wrap the animated subtree in <SpatialBoot> or await bootSpatial() before mounting the component.`,
  )
}

/**
 * Default-entry spatialized element motion hook.
 *
 * Spatialized element motion has a meaningful web fallback, so it must be
 * callable before bootSpatial() resolves. Native playback is selected inside
 * the shared motion controller when the runtime reports support.
 */
export function useAnimation(
  config: SpatializedMotionConfig,
): UseAnimationResult {
  return useSpatializedElementAnimation(config)
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
