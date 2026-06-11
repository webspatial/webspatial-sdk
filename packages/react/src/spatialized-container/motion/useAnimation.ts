import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatializedMotionConfig as CoreSpatializedMotionConfig,
  SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  SpatializedMotionTimelineConfig as CoreSpatializedMotionTimelineConfig,
  SpatializedPlaybackApi,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import {
  evaluateMotionTimeline,
  normalizeMotionConfig,
  supports,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { getMotionConfigSignature } from './motionConfigSignature'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'
import { resolveMotionStyle } from './resolveMotionStyle'
import { useMotionController } from './useMotionController'

export type SpatializedMotionConfig =
  | CoreSpatializedMotionSegmentConfig
  | CoreSpatializedMotionConfig
  | CoreSpatializedMotionTimelineConfig

export type SpatializedMotionSegmentConfig = CoreSpatializedMotionSegmentConfig

export type UseAnimationResult = readonly [
  animation: SpatializedMotionBindingInternal,
  api: SpatializedPlaybackApi,
  style: CSSProperties,
]

export function useAnimation(
  config: SpatializedMotionConfig,
): UseAnimationResult {
  const dataSignature = getMotionConfigSignature(config)

  // Keep timeline normalization stable across callback-only renders.
  const normalizedTimelineConfig = useMemo(
    () => normalizeMotionConfig(config),
    [dataSignature],
  )
  const controllerConfig = useMemo(
    () => ({
      ...normalizedTimelineConfig,
      onStart: config.onStart,
      onComplete: config.onComplete,
      onStop: config.onStop,
      onReset: config.onReset,
      onError: config.onError,
    }),
    [
      normalizedTimelineConfig,
      config.onStart,
      config.onComplete,
      config.onStop,
      config.onReset,
      config.onError,
    ],
  )

  const [values, setValues] = useState<SpatializedVisualValues>(() =>
    evaluateMotionTimeline(normalizedTimelineConfig, 0),
  )

  useEffect(() => {
    setValues(evaluateMotionTimeline(normalizedTimelineConfig, 0))
  }, [normalizedTimelineConfig])

  const controller = useMotionController(controllerConfig, setValues)
  const animation = useMemo(() => createMotionBinding(controller), [controller])
  const api = useMemo(() => createPlaybackApi(controller), [controller])

  const style = resolveMotionStyle({
    values,
    targetKind: controller.targetKind,
    suppressedFields: controller.getSuppressedFields(),
    nativeElementSupported: supports('useAnimation', ['element']),
  })

  return [animation, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
