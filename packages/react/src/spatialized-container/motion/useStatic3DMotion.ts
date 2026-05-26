import { useEffect, useMemo } from 'react'
import type {
  SpatialDivMotionConfig,
  SpatializedMotionHandle,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { createPlaybackApi } from './createPlaybackApi'
import { useMotionController } from './useMotionController'
import type { Static3DMotionBindingInternal } from './static3dMotionBindingTypes'

export type UseStatic3DMotionResult = {
  api: ReturnType<typeof createPlaybackApi>
  motion?: Static3DMotionBindingInternal
  controller: SpatializedMotionHandle
}

/** @deprecated Prefer {@link useSpatializedMotion} with `kind: 'static3d'`. */
export function useStatic3DMotion(
  config: SpatialDivMotionConfig,
): UseStatic3DMotionResult {
  const { controller, nativeCapable } = useMotionController('static3d', config)

  const motionBinding = useMemo(
    () =>
      createMotionBinding('static3d', controller, nativeCapable) as
        | Static3DMotionBindingInternal
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
