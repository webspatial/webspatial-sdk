import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import {
  SpatialDivMotionController,
  evaluateMotionTimeline,
  segmentConfigToMotionConfig,
  supports,
  validateSpatialDivMotionConfig,
  type SpatialDivVisualValues,
  type SpatialDivPlaybackApi,
  type SpatialDivMotionConfig,
  type SpatialDivSegmentConfig,
} from '@webspatial/core-sdk'
import { valuesToMotionStyle } from './style'
import type { SpatialDivMotionBindingInternal } from './motionBindingTypes'

export type UseSpatialDivMotionResult = {
  style: CSSProperties
  api: SpatialDivPlaybackApi
  /** Present when `supports('useAnimation', ['element'])`; pass to `motion` on SpatialDiv. */
  motion?: SpatialDivMotionBindingInternal
  /** Core runtime controller (imperative playback + selective pause). */
  controller: SpatialDivMotionController
}

function useSpatialDivMotionInternal(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  validateSpatialDivMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)

  const initialValues = useMemo(
    () => evaluateMotionTimeline(config, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount snapshot
    [],
  )
  const [style, setStyle] = useState<CSSProperties>(() =>
    valuesToMotionStyle(initialValues),
  )

  const applyStyleFromValues = useCallback((values: SpatialDivVisualValues) => {
    setStyle(valuesToMotionStyle(values))
  }, [])

  const controllerRef = useRef<SpatialDivMotionController | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new SpatialDivMotionController(config, {
      forceNativePlayback: supports('useAnimation', ['element']),
      onValuesChange: applyStyleFromValues,
      onStateChange: () => tick(),
    })
  }
  const controller = controllerRef.current

  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
    controller.updateDefinition(config)
  }, [config, controller])

  useEffect(() => {
    const active = controller
    return () => {
      active.destroy()
    }
  }, [controller])

  const nativeCapable = supports('useAnimation', ['element'])

  const motionBinding = useMemo(():
    | SpatialDivMotionBindingInternal
    | undefined => {
    if (!nativeCapable) return undefined

    const binding: SpatialDivMotionBindingInternal = {
      __kind: 'spatialDivMotion',
      __motionObjectId: controller.id,
      get __animating() {
        return controller.nativeSessionAnimating
      },
      __getSuppressedFields() {
        return controller.getSuppressedFields()
      },
      __setElement: element => {
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

  return {
    style,
    api,
    motion: motionBinding,
    controller,
  }
}

export function useSpatialDivMotion(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  return useSpatialDivMotionInternal(config)
}

function useSpatialDivMotionSimple(
  simple: SpatialDivSegmentConfig,
): UseSpatialDivMotionResult {
  const simpleKey = useMemo(
    () =>
      JSON.stringify({
        from: simple.from,
        to: simple.to,
        duration: simple.duration,
        delay: simple.delay,
        autoStart: simple.autoStart,
        loop: simple.loop,
        playbackRate: simple.playbackRate,
        timingFunction: simple.timingFunction,
      }),
    [
      simple.from,
      simple.to,
      simple.duration,
      simple.delay,
      simple.autoStart,
      simple.loop,
      simple.playbackRate,
      simple.timingFunction,
    ],
  )
  const motionConfig = useMemo(
    () => segmentConfigToMotionConfig(simple),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simpleKey],
  )
  return useSpatialDivMotionInternal(motionConfig)
}

useSpatialDivMotion.simple = useSpatialDivMotionSimple
