import type {
  SpatialDivMotionConfig,
  SpatialDivPlaybackApi,
  SpatialDivSegmentConfig,
  SpatializedMotionKind,
} from '@webspatial/core-sdk'
import { segmentConfigToMotionConfig } from '@webspatial/core-sdk'
import {
  useSpatialDivMotion,
  type UseSpatialDivMotionResult,
} from './useSpatialDivMotion'
import {
  useStatic3DMotion,
  type UseStatic3DMotionResult,
} from './useStatic3DMotion'
import {
  useDynamic3DMotion,
  type UseDynamic3DMotionResult,
} from './useDynamic3DMotion'

export type SpatializedMotionConfig =
  | ({ kind: 'spatialized2d' } & SpatialDivMotionConfig)
  | ({ kind: 'static3d' } & SpatialDivMotionConfig)
  | ({ kind: 'dynamic3d' } & SpatialDivMotionConfig)

export type SpatializedMotionSegmentConfig =
  | ({ kind: 'spatialized2d' } & SpatialDivSegmentConfig)
  | ({ kind: 'static3d' } & SpatialDivSegmentConfig)
  | ({ kind: 'dynamic3d' } & SpatialDivSegmentConfig)

export type UseSpatializedMotionResult =
  | (UseSpatialDivMotionResult & { kind: 'spatialized2d' })
  | (UseStatic3DMotionResult & { kind: 'static3d' })
  | (UseDynamic3DMotionResult & { kind: 'dynamic3d' })

function useSpatializedMotionTimeline(
  config: SpatializedMotionConfig,
): UseSpatializedMotionResult {
  switch (config.kind) {
    case 'spatialized2d': {
      const { kind: _k, ...motionConfig } = config
      const result = useSpatialDivMotion(motionConfig)
      return { kind: 'spatialized2d', ...result }
    }
    case 'static3d': {
      const { kind: _k, ...motionConfig } = config
      const result = useStatic3DMotion(motionConfig)
      return { kind: 'static3d', ...result }
    }
    case 'dynamic3d': {
      const { kind: _k, ...motionConfig } = config
      const result = useDynamic3DMotion(motionConfig)
      return { kind: 'dynamic3d', ...result }
    }
    default: {
      const _exhaustive: never = config
      throw new Error(
        `[useSpatializedMotion] Unknown kind: ${(_exhaustive as SpatializedMotionKind) ?? 'undefined'}`,
      )
    }
  }
}

export function useSpatializedMotion(
  config: SpatializedMotionConfig,
): UseSpatializedMotionResult {
  return useSpatializedMotionTimeline(config)
}

function useSpatializedMotionSimple(
  config: SpatializedMotionSegmentConfig,
): UseSpatializedMotionResult {
  switch (config.kind) {
    case 'spatialized2d': {
      const { kind: _k, ...simple } = config
      const motionConfig = segmentConfigToMotionConfig(simple)
      return useSpatializedMotion({ kind: 'spatialized2d', ...motionConfig })
    }
    case 'static3d': {
      const { kind: _k, ...simple } = config
      const motionConfig = segmentConfigToMotionConfig(simple)
      return useSpatializedMotion({ kind: 'static3d', ...motionConfig })
    }
    case 'dynamic3d': {
      const { kind: _k, ...simple } = config
      const motionConfig = segmentConfigToMotionConfig(simple)
      return useSpatializedMotion({ kind: 'dynamic3d', ...motionConfig })
    }
    default: {
      const _exhaustive: never = config
      throw new Error(
        `[useSpatializedMotion.simple] Unknown kind: ${(_exhaustive as SpatializedMotionKind) ?? 'undefined'}`,
      )
    }
  }
}

useSpatializedMotion.simple = useSpatializedMotionSimple

export type { SpatialDivPlaybackApi as Spatialized2DPlaybackApi }
