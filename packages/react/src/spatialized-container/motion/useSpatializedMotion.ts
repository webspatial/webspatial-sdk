import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  evaluateMotionTimeline,
  segmentConfigToMotionConfig,
  type SpatializedMotionConfig as CoreSpatializedMotionConfig,
  type SpatializedPlaybackApi,
  type SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  type SpatializedVisualValues,
  type SpatializedMotionHandle,
  type SpatializedMotionKind,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { useMotionController } from './useMotionController'
import { valuesToMotionStyle } from './style'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'
import type { Static3DMotionBindingInternal } from './static3dMotionBindingTypes'
import type { Dynamic3DMotionBindingInternal } from './dynamic3dMotionBindingTypes'

export type SpatializedMotionConfig =
  | ({ kind: 'spatialized2d' } & CoreSpatializedMotionConfig)
  | ({ kind: 'static3d' } & CoreSpatializedMotionConfig)
  | ({ kind: 'dynamic3d' } & CoreSpatializedMotionConfig)

export type SpatializedMotionSegmentConfig =
  | ({ kind: 'spatialized2d' } & CoreSpatializedMotionSegmentConfig)
  | ({ kind: 'static3d' } & CoreSpatializedMotionSegmentConfig)
  | ({ kind: 'dynamic3d' } & CoreSpatializedMotionSegmentConfig)

type Spatialized2DMotionBody = {
  style: CSSProperties
  api: ReturnType<typeof createPlaybackApi>
  motion?: SpatializedMotionBindingInternal
  controller: SpatializedMotionHandle
}

type SpatializedNativeMotionBody = {
  api: ReturnType<typeof createPlaybackApi>
  controller: SpatializedMotionHandle
}

export type UseSpatializedMotionResult =
  | ({ kind: 'spatialized2d' } & Spatialized2DMotionBody)
  | ({ kind: 'static3d' } & SpatializedNativeMotionBody & {
        motion?: Static3DMotionBindingInternal
      })
  | ({ kind: 'dynamic3d' } & SpatializedNativeMotionBody & {
        motion?: Dynamic3DMotionBindingInternal
      })

function useSpatialized2DMotion(
  config: CoreSpatializedMotionConfig,
): Spatialized2DMotionBody {
  const initialValues = useMemo(() => evaluateMotionTimeline(config, 0), [])
  const [style, setStyle] = useState<CSSProperties>(() =>
    valuesToMotionStyle(initialValues),
  )

  const applyStyleFromValues = useCallback(
    (values: SpatializedVisualValues) => {
      setStyle(valuesToMotionStyle(values))
    },
    [],
  )

  const { controller, nativeCapable } = useMotionController(
    'spatialized2d',
    config,
    applyStyleFromValues,
  )

  const motionBinding = useMemo(
    () =>
      createMotionBinding('spatialized2d', controller, nativeCapable) as
        | SpatializedMotionBindingInternal
        | undefined,
    [controller, nativeCapable],
  )

  const api = useMemo(() => createPlaybackApi(controller), [controller])

  useEffect(() => {
    if (config.autoStart === false) return
    controller.play()
  }, [controller, config.autoStart])

  return {
    style,
    api,
    motion: motionBinding,
    controller,
  }
}

function useSpatializedNativeMotion(
  kind: 'static3d' | 'dynamic3d',
  config: CoreSpatializedMotionConfig,
): SpatializedNativeMotionBody & {
  motionBinding?: Static3DMotionBindingInternal | Dynamic3DMotionBindingInternal
} {
  const { controller, nativeCapable } = useMotionController(kind, config)

  const motionBinding = useMemo(
    () =>
      createMotionBinding(kind, controller, nativeCapable) as
        | Static3DMotionBindingInternal
        | Dynamic3DMotionBindingInternal
        | undefined,
    [kind, controller, nativeCapable],
  )

  const api = useMemo(() => createPlaybackApi(controller), [controller])

  useEffect(() => {
    if (config.autoStart === false) return
    controller.play()
  }, [controller, config.autoStart])

  return { api, motionBinding, controller }
}

export function useSpatializedMotion(
  config: SpatializedMotionConfig,
): UseSpatializedMotionResult {
  switch (config.kind) {
    case 'spatialized2d': {
      const { kind: _k, ...motionConfig } = config
      return { kind: 'spatialized2d', ...useSpatialized2DMotion(motionConfig) }
    }
    case 'static3d': {
      const { kind: _k, ...motionConfig } = config
      const { api, motionBinding, controller } = useSpatializedNativeMotion(
        'static3d',
        motionConfig,
      )
      return {
        kind: 'static3d',
        api,
        motion: motionBinding as Static3DMotionBindingInternal | undefined,
        controller,
      }
    }
    case 'dynamic3d': {
      const { kind: _k, ...motionConfig } = config
      const { api, motionBinding, controller } = useSpatializedNativeMotion(
        'dynamic3d',
        motionConfig,
      )
      return {
        kind: 'dynamic3d',
        api,
        motion: motionBinding as Dynamic3DMotionBindingInternal | undefined,
        controller,
      }
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

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
