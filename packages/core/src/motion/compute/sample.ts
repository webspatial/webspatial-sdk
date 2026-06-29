import type { SpatializedVisualValues } from '../../types/motion/spatializedVisual'
import type {
  SpatializedMotionConfig,
  SpatializedMotionTrack,
} from '../../types/motion/spatializedMotion'
import { applyTimingFunction } from './timing'
import { setMotionPropertyValue } from './motionPropertyValues'

/**
 * Resolves track-level easing with keyframe and config fallbacks.
 *
 * @param track Track being sampled.
 * @param keyframeTimingFunction Optional timing function declared on the keyframe.
 * @param config Motion config that provides the final fallback timing function.
 * @returns The easing function to use for the sampled segment.
 */
function resolveTimingFunction(
  track: SpatializedMotionTrack,
  keyframeTimingFunction: SpatializedMotionTrack['keyframes'][number]['timingFunction'],
  config: SpatializedMotionConfig,
) {
  return (
    keyframeTimingFunction ??
    track.timingFunction ??
    config.timingFunction ??
    'linear'
  )
}

/**
 * Samples a single motion track at a timeline time in seconds.
 *
 * @param track Track to sample.
 * @param config Motion config that owns the track.
 * @param timeSec Timeline time in seconds.
 * @returns The interpolated numeric value for the track.
 */
function sampleTrack(
  track: SpatializedMotionTrack,
  config: SpatializedMotionConfig,
  timeSec: number,
): number {
  const frames = track.keyframes
  if (timeSec <= frames[0].at) return frames[0].value
  const last = frames[frames.length - 1]
  if (timeSec >= last.at) return last.value

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    if (timeSec >= a.at && timeSec <= b.at) {
      const span = b.at - a.at
      if (span <= 0) return b.value
      const linear = (timeSec - a.at) / span
      const eased = applyTimingFunction(
        linear,
        resolveTimingFunction(track, a.timingFunction, config),
      )
      return a.value + (b.value - a.value) * eased
    }
  }

  return last.value
}

/**
 * Evaluates all motion tracks into visual values at a timeline time.
 *
 * @param config Canonical motion config to evaluate.
 * @param timeSec Seconds from timeline start, before delay is applied.
 * @returns The sampled visual values for the requested time.
 */
export function evaluateMotionTimeline(
  config: SpatializedMotionConfig,
  timeSec: number,
): SpatializedVisualValues {
  const t = Math.max(0, Math.min(config.duration, timeSec))
  const visualValues: SpatializedVisualValues = {}
  for (const track of config.tracks) {
    const sampledValue = sampleTrack(track, config, t)
    setMotionPropertyValue(visualValues, track.property, sampledValue)
  }
  return visualValues
}
