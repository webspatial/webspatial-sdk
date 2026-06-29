'use client'

import type {
  SpatializedMotionConfig,
  UseAnimationResult,
} from '../spatialized-container/motion'
import { useAnimation as useSpatializedElementAnimation } from '../spatialized-container/motion/useAnimation'

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
