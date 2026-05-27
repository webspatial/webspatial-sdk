import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type {
  SpatializedMotionConfig,
  SpatializedMotionProperty,
  SpatializedMotionTrack,
} from '../../types/spatializedMotion'
import { applyEasing } from './easing'

function setScalar(
  values: SpatializedVisualValues,
  property: SpatializedMotionProperty,
  value: number,
): void {
  if (property === 'opacity') {
    values.opacity = value
    return
  }

  if (!values.transform) values.transform = {}
  const [, group, axis] = property.split('.') as [
    string,
    'translate' | 'rotate' | 'scale',
    'x' | 'y' | 'z',
  ]
  if (!values.transform[group]) {
    values.transform[group] = {}
  }
  ;(values.transform[group] as Record<string, number>)[axis] = value
}

function sampleTrack(track: SpatializedMotionTrack, timeSec: number): number {
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
      const eased = applyEasing(linear, track.easing ?? 'easeInOut')
      return a.value + (b.value - a.value) * eased
    }
  }

  return last.value
}

/** Evaluate all tracks at `timeSec` (seconds from timeline start, before delay). */
export function evaluateMotionTimeline(
  config: SpatializedMotionConfig,
  timeSec: number,
): SpatializedVisualValues {
  const t = Math.max(0, Math.min(config.duration, timeSec))
  const values: SpatializedVisualValues = {}
  for (const track of config.tracks) {
    setScalar(values, track.property, sampleTrack(track, t))
  }
  return values
}
