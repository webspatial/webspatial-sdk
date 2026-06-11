import type {
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedMotionTimelineConfig,
} from '@webspatial/core-sdk'

type MotionConfigInput =
  | SpatializedMotionSegmentConfig
  | SpatializedMotionConfig
  | SpatializedMotionTimelineConfig

// Ignore callback identity so visual state does not reset on every render.
export function getMotionConfigSignature(config: MotionConfigInput): string {
  return JSON.stringify(config, (_key, value) =>
    typeof value === 'function' ? undefined : value,
  )
}
