import { useEffect, useMemo, useReducer, useRef } from 'react'
import {
  Static3DMotionController,
  supports,
  validateSpatialDivMotionConfig,
  type SpatialDivMotionConfig,
  type SpatialDivPlaybackApi,
  type SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { Static3DMotionBindingInternal } from './static3dMotionBindingTypes'

export type UseStatic3DMotionResult = {
  api: SpatialDivPlaybackApi
  motion?: Static3DMotionBindingInternal
  controller: Static3DMotionController
}

export function useStatic3DMotion(
  config: SpatialDivMotionConfig,
): UseStatic3DMotionResult {
  validateSpatialDivMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)

  const controllerRef = useRef<Static3DMotionController | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new Static3DMotionController(config, {
      forceNativePlayback: supports('useAnimation', ['static3d']),
      onStateChange: () => tick(),
    })
  }
  const controller = controllerRef.current

  useEffect(() => {
    controller.updateDefinition(config)
  }, [config, controller])

  useEffect(() => {
    const active = controller
    return () => {
      active.destroy()
    }
  }, [controller])

  const nativeCapable = supports('useAnimation', ['static3d'])

  const motionBinding = useMemo(():
    | Static3DMotionBindingInternal
    | undefined => {
    if (!nativeCapable) return undefined

    const binding: Static3DMotionBindingInternal = {
      __kind: 'static3dMotion',
      __motionObjectId: controller.id,
      get __animating() {
        return controller.nativeSessionAnimating
      },
      get __suppressedFields() {
        return controller.getSuppressedFields()
      },
      __getSuppressedFields() {
        return controller.getSuppressedFields()
      },
      __setElement: (element: SpatializedStatic3DElement) => {
        controller.attachElement(element)
      },
      __onUnbind: () => {
        controller.handleMotionUnbind()
      },
    }
    return binding
  }, [controller, nativeCapable])

  const api: SpatialDivPlaybackApi = useMemo(
    () => ({
      play: () => controller.play(),
      pause: keys => controller.pause(keys),
      resume: keys => controller.resume(keys),
      cancel: keys => controller.cancel(keys),
      get isAnimating() {
        return controller.isAnimating
      },
      get isPaused() {
        return controller.isPaused
      },
      get finished() {
        return controller.finished
      },
      get playState() {
        return controller.playState
      },
    }),
    [controller],
  )

  useEffect(() => {
    if (config.autoStart === false) return
    controller.play()
  }, [controller, config.autoStart])

  return { api, motion: motionBinding, controller }
}
