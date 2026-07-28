'use client'

// Opt-in surface for APIs whose names or parameters are still allowed to
// change before they graduate into the default entry. Keep this module small:
// only export APIs that are intentionally available to npm consumers via
// `@webspatial/react-sdk/experimental`.
export { useAnimation } from './hooks-web/useAnimation'
export { useEntityAnimation } from './hooks-web/useEntityAnimation'
export type {
  UseAnimationResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './spatialized-container/motion'
