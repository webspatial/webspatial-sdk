import { useEffect, useMemo } from 'react'
import type {
  SpatialDivMotionConfig,
  SpatializedMotionHandle,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { useMotionController } from './useMotionController'
import type { Dynamic3DMotionBindingInternal } from './dynamic3dMotionBindingTypes'

export type UseDynamic3DMotionResult = {
  api: ReturnType<typeof createPlaybackApi>
  motion?: Dynamic3DMotionBindingInternal
  controller: SpatializedMotionHandle
}

/** @deprecated Prefer {@link useSpatializedMotion} with `kind: 'dynamic3d'`. */
export function useDynamic3DMotion(
  config: SpatialDivMotionConfig,
): UseDynamic3DMotionResult {
  const { controller, nativeCapable } = useMotionController('dynamic3d', config)

  const motionBinding = useMemo(
    () =>
      createMotionBinding('dynamic3d', controller, nativeCapable) as
        | Dynamic3DMotionBindingInternal
        | undefined,
    [controller, nativeCapable],
  )

  const api = useMemo(() => createPlaybackApi(controller), [controller])

  useEffect(() => {
    if (config.autoStart === false) return
    controller.play()
  }, [controller, config.autoStart])

  return { api, motion: motionBinding, controller }
}
