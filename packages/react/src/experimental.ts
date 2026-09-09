'use client'

// Opt-in surface for APIs whose names or parameters are still allowed to
// change before they graduate into the default entry. Keep this module small:
// only export APIs that are intentionally available to npm consumers via
// `@webspatial/react-sdk/experimental`.
import { registerReactSdkEntry } from './runtime/entryRegistry'

registerReactSdkEntry('lazy')

export { Ornament } from './facades/Ornament'
export type {
  OrnamentPoint3D,
  OrnamentProps,
  OrnamentVisibility,
} from './facades/Ornament'
export { useAnimation } from './hooks-web/useAnimation'
export { useEntityAnimation } from './hooks-web/useEntityAnimation'
export type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
  EntityPlaybackError,
} from '@webspatial/core-sdk'
export type {
  EntityMotionAnimation,
  UseEntityAnimationResult,
} from './reality/hooks/useEntityAnimation'
export type {
  UseAnimationResult,
  SpatializedMotionConfig,
  SpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
} from './spatialized-container/motion'
