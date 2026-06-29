import type { TimingFunction } from '../../types/animation'

/** Map normalized linear progress [0,1] to eased progress. */
export function applyTimingFunction(
  t: number,
  timingFunction: TimingFunction,
): number {
  const x = Math.min(1, Math.max(0, t))
  switch (timingFunction) {
    case 'linear':
      return x
    case 'easeIn':
      return x * x * x
    case 'easeOut': {
      const u = 1 - x
      return 1 - u * u * u
    }
    case 'easeInOut':
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    default:
      return x
  }
}

import type { SpatializedMotionConfig } from '../../types/motion/spatializedMotion'

/** Wall-clock elapsed (ms) → timeline time (sec), honoring delay and playbackRate. */
export function motionTimeSec(
  elapsedMs: number,
  config: SpatializedMotionConfig,
): number {
  const delayMs = (config.delay ?? 0) * 1000
  const rate = config.playbackRate ?? 1
  if (elapsedMs <= delayMs) return 0
  return ((elapsedMs - delayMs) / 1000) * rate
}
