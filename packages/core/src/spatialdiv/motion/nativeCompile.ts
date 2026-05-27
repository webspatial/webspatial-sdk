import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { TimingFunction } from '../../types/animation'
import type {
  SpatializedMotionConfig,
  SpatializedMotionProperty,
  SpatializedMotionTimeline,
  SpatializedMotionTrack,
} from '../../types/spatializedMotion'

const EPS = 1e-6

export interface NativeSegmentPlayPayload {
  from: SpatializedVisualValues
  to: SpatializedVisualValues
  duration: number
  timingFunction: TimingFunction
  delay?: number
  loop?: SpatializedMotionConfig['loop']
  playbackRate?: number
}

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

export function tracksToFromTo(tracks: SpatializedMotionTrack[]): {
  from: SpatializedVisualValues
  to: SpatializedVisualValues
} {
  const from: SpatializedVisualValues = {}
  const to: SpatializedVisualValues = {}
  for (const track of tracks) {
    const first = track.keyframes[0]
    const last = track.keyframes[track.keyframes.length - 1]
    setScalar(from, track.property, first.value)
    setScalar(to, track.property, last.value)
  }
  return { from, to }
}

/**
 * Plan A-compatible segment when every track is exactly [0, duration] with one easing.
 */
export function motionConfigToNativeSegment(
  config: SpatializedMotionConfig,
): NativeSegmentPlayPayload | null {
  const { duration, tracks } = config
  if (tracks.length === 0) return null

  const easings = new Set(tracks.map(t => t.easing ?? 'easeInOut'))
  if (easings.size > 1) return null

  for (const track of tracks) {
    const kf = track.keyframes
    if (kf.length !== 2) return null
    if (Math.abs(kf[0].at) > EPS) return null
    if (Math.abs(kf[1].at - duration) > EPS) return null
  }

  const { from, to } = tracksToFromTo(tracks)
  return {
    from,
    to,
    duration,
    timingFunction: tracks[0]?.easing ?? 'easeInOut',
    delay: config.delay,
    loop: config.loop,
    playbackRate: config.playbackRate,
  }
}

/** Full timeline payload for native Phase 2b. */
export function motionConfigToNativeTimeline(
  config: SpatializedMotionConfig,
): SpatializedMotionTimeline {
  return {
    duration: config.duration,
    delay: config.delay,
    playbackRate: config.playbackRate,
    loop: config.loop,
    tracks: config.tracks.map(track => ({
      property: track.property,
      keyframes: track.keyframes.map(k => ({ at: k.at, value: k.value })),
      easing: track.easing ?? 'easeInOut',
    })),
  }
}
