import { useEffect, useMemo, useReducer, useRef } from 'react'
import {
  Dynamic3DMotionController,
  supports,
  validateSpatialDivMotionConfig,
  type SpatialDivMotionConfig,
  type SpatialDivPlaybackApi,
  type SpatializedDynamic3DElement,
} from '@webspatial/core-sdk'
import type { Dynamic3DMotionBindingInternal } from './dynamic3dMotionBindingTypes'

export type UseDynamic3DMotionResult = {
  api: SpatialDivPlaybackApi
  motion?: Dynamic3DMotionBindingInternal
  controller: Dynamic3DMotionController
}

export function useDynamic3DMotion(
  config: SpatialDivMotionConfig,
): UseDynamic3DMotionResult {
  validateSpatialDivMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)

  const controllerRef = useRef<Dynamic3DMotionController | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new Dynamic3DMotionController(config, {
      forceNativePlayback: supports('useAnimation', ['dynamic3d']),
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

  const nativeCapable = supports('useAnimation', ['dynamic3d'])

  const motionBinding = useMemo(():
    | Dynamic3DMotionBindingInternal
    | undefined => {
    if (!nativeCapable) return undefined

    const binding: Dynamic3DMotionBindingInternal = {
      __kind: 'dynamic3dMotion',
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
      __setElement: (element: SpatializedDynamic3DElement) => {
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
