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

export function useSpatializedMotion(
  config: SpatializedMotionConfig,
): UseSpatializedMotionResult {
  switch (config.kind) {
    case 'spatialized2d': {
      const { kind: _k, ...motionConfig } = config
      return { kind: 'spatialized2d', ...useSpatialDivMotion(motionConfig) }
    }
    case 'static3d': {
      const { kind: _k, ...motionConfig } = config
      return { kind: 'static3d', ...useStatic3DMotion(motionConfig) }
    }
    case 'dynamic3d': {
      const { kind: _k, ...motionConfig } = config
      return { kind: 'dynamic3d', ...useDynamic3DMotion(motionConfig) }
    }
    default: {
      const _exhaustive: never = config
      throw new Error(
        `[useSpatializedMotion] Unknown kind: ${(_exhaustive as SpatializedMotionKind) ?? 'undefined'}`,
      )
    }
  }
}

function useSpatializedMotionSimple(
  config: SpatializedMotionSegmentConfig,
): UseSpatializedMotionResult {
  switch (config.kind) {
    case 'spatialized2d': {
      const { kind: _k, ...simple } = config
      return useSpatializedMotion({
        kind: 'spatialized2d',
        ...segmentConfigToMotionConfig(simple),
      })
    }
    case 'static3d': {
      const { kind: _k, ...simple } = config
      return useSpatializedMotion({
        kind: 'static3d',
        ...segmentConfigToMotionConfig(simple),
      })
    }
    case 'dynamic3d': {
      const { kind: _k, ...simple } = config
      return useSpatializedMotion({
        kind: 'dynamic3d',
        ...segmentConfigToMotionConfig(simple),
      })
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
