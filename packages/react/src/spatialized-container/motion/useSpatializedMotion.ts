import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  evaluateMotionTimeline,
  segmentConfigToMotionConfig,
  type SpatializedMotionConfig as CoreSpatializedMotionConfig,
  type SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  type SpatializedPlaybackApi,
  type SpatializedVisualValues,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { useMotionController } from './useMotionController'
import { valuesToMotionStyle } from './style'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'

export type SpatializedMotionConfig =
  | CoreSpatializedMotionSegmentConfig
  | CoreSpatializedMotionConfig

export type SpatializedMotionSegmentConfig = CoreSpatializedMotionSegmentConfig

export type UseSpatializedMotionResult = readonly [
  SpatializedMotionBindingInternal,
  SpatializedPlaybackApi,
  CSSProperties,
]

const EMPTY_STYLE: CSSProperties = {}

function normalizeMotionConfig(
  config: SpatializedMotionConfig,
): CoreSpatializedMotionConfig {
  if ('tracks' in config) return config
  return segmentConfigToMotionConfig(config)
}

export function useSpatializedMotion(
  config: SpatializedMotionConfig,
): UseSpatializedMotionResult {
  const dataSignature = JSON.stringify(config, (_key, value) =>
    typeof value === 'function' ? undefined : value,
  )
  const normalizedConfig = normalizeMotionConfig(config)

  const [values, setValues] = useState<SpatializedVisualValues>(() =>
    evaluateMotionTimeline(normalizedConfig, 0),
  )

  useEffect(() => {
    setValues(evaluateMotionTimeline(normalizedConfig, 0))
  }, [dataSignature])

  const controller = useMotionController(normalizedConfig, setValues)
  const animation = useMemo(() => createMotionBinding(controller), [controller])
  const api = useMemo(() => createPlaybackApi(controller), [controller])

  useEffect(() => {
    if (normalizedConfig.autoStart === false) return
    controller.play()
  }, [controller, normalizedConfig.autoStart])

  const style =
    controller.targetKind === 'static3d' ||
    controller.targetKind === 'dynamic3d'
      ? EMPTY_STYLE
      : valuesToMotionStyle(values)

  return [animation, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
