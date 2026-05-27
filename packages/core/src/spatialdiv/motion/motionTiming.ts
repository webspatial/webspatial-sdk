import type { SpatializedMotionConfig } from '../../types/spatializedMotion'

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
