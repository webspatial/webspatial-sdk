import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  evaluateMotionTimeline,
  segmentConfigToMotionConfig,
  type SpatialDivMotionConfig,
  type SpatialDivSegmentConfig,
  type SpatialDivVisualValues,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { useMotionController } from './useMotionController'
import { valuesToMotionStyle } from './style'
import type { SpatialDivMotionBindingInternal } from './motionBindingTypes'
import type { SpatializedMotionHandle } from '@webspatial/core-sdk'

export type UseSpatialDivMotionResult = {
  style: CSSProperties
  api: ReturnType<typeof createPlaybackApi>
  motion?: SpatialDivMotionBindingInternal
  controller: SpatializedMotionHandle
}

function useSpatialDivMotionInternal(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  const initialValues = useMemo(() => evaluateMotionTimeline(config, 0), [])
  const [style, setStyle] = useState<CSSProperties>(() =>
    valuesToMotionStyle(initialValues),
  )

  const applyStyleFromValues = useCallback((values: SpatialDivVisualValues) => {
    setStyle(valuesToMotionStyle(values))
  }, [])

  const { controller, nativeCapable } = useMotionController(
    'spatialized2d',
    config,
    applyStyleFromValues,
  )

  const motionBinding = useMemo(
    () =>
      createMotionBinding('spatialized2d', controller, nativeCapable) as
        | SpatialDivMotionBindingInternal
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

/** @deprecated Prefer {@link useSpatializedMotion} with `kind: 'spatialized2d'`. */
export function useSpatialDivMotion(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  return useSpatialDivMotionInternal(config)
}

function useSpatialDivMotionSimple(
  config: SpatialDivSegmentConfig,
): UseSpatialDivMotionResult {
  return useSpatialDivMotionInternal(segmentConfigToMotionConfig(config))
}

useSpatialDivMotion.simple = useSpatialDivMotionSimple
