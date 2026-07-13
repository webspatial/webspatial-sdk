import type {
  NormalizedSpatializedMotionConfig,
  SpatializedMotionTimeline,
} from '../../types/motion/spatializedMotion'

/** Full timeline payload for native Phase 2b. */
export function motionConfigToNativeTimeline(
  config: NormalizedSpatializedMotionConfig,
): SpatializedMotionTimeline {
  return {
    duration: config.duration,
    delay: config.delay,
    playbackRate: config.playbackRate,
    loop: config.loop,
    tracks: config.tracks.map(track => ({
      property: track.property,
      keyframes: track.keyframes.map(k => ({
        at: k.at,
        value: k.value,
        ...(k.timingFunction !== undefined
          ? { timingFunction: k.timingFunction }
          : {}),
      })),
      timingFunction: track.timingFunction ?? config.timingFunction ?? 'linear',
    })),
  }
}
