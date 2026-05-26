import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatialDivAnimatedValues,
  SpatialDivMotionApi,
  SpatialDivMotionConfig,
  SpatialDivMotionPlayState,
  SpatialDivMotionSimpleConfig,
} from '@webspatial/core-sdk'
import { supports } from '@webspatial/core-sdk'
import { evaluateMotionTimeline } from './evaluate'
import { simpleConfigToMotionConfig } from './simple'
import { valuesToMotionStyle } from './style'
import { validateSpatialDivMotionConfig } from './validate'
import { useNativeMotionSession } from './nativeSession'
import type { SpatialDivMotionBindingInternal } from './motionBindingTypes'
import { motionTimeSec } from './motionTiming'

export type UseSpatialDivMotionResult = {
  style: CSSProperties
  api: SpatialDivMotionApi
  /** Present when `supports('useAnimation', ['element'])`; pass to `motion` on SpatialDiv. */
  motion?: SpatialDivMotionBindingInternal
}

function useSpatialDivMotionInternal(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  validateSpatialDivMotionConfig(config)

  const configRef = useRef(config)
  configRef.current = config

  const [, tick] = useReducer((n: number) => n + 1, 0)
  const playStateRef = useRef<SpatialDivMotionPlayState>('idle')
  const rafRef = useRef<number | null>(null)
  const startWallRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const finishedRef = useRef(false)
  const startedRef = useRef(false)

  const initialValues = useMemo(
    () => evaluateMotionTimeline(config, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount snapshot
    [],
  )
  const [style, setStyle] = useState<CSSProperties>(() =>
    valuesToMotionStyle(initialValues),
  )

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const applyStyleFromValues = useCallback(
    (values: SpatialDivAnimatedValues) => {
      setStyle(valuesToMotionStyle(values))
    },
    [],
  )

  const applyAt = useCallback(
    (timeSec: number) => {
      const values = evaluateMotionTimeline(configRef.current, timeSec)
      applyStyleFromValues(values)
      return values
    },
    [applyStyleFromValues],
  )

  const finishNaturally = useCallback(
    (values: ReturnType<typeof evaluateMotionTimeline>) => {
      stopRaf()
      playStateRef.current = 'finished'
      finishedRef.current = true
      tick()
      configRef.current.onComplete?.(values)
    },
    [stopRaf, tick],
  )

  const nativeMotionConfig = useMemo((): SpatialDivMotionConfig => {
    const { onComplete, onCancel, onError, ...rest } = config
    return {
      ...rest,
      onComplete: values => {
        stopRaf()
        playStateRef.current = 'finished'
        finishedRef.current = true
        applyStyleFromValues(values)
        tick()
        onComplete?.(values)
      },
      onCancel: values => {
        stopRaf()
        playStateRef.current = 'idle'
        finishedRef.current = false
        startedRef.current = false
        applyStyleFromValues(values)
        tick()
        onCancel?.(values)
      },
      onError: error => {
        stopRaf()
        playStateRef.current = 'idle'
        tick()
        onError?.(error)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wrap latest user callbacks
  }, [config, stopRaf, applyStyleFromValues, tick])

  const native = useNativeMotionSession(
    nativeMotionConfig,
    tick,
    applyStyleFromValues,
  )
  const nativeCapable = !!native.motionBinding

  const runFrame = useCallback(() => {
    if (playStateRef.current !== 'running') return

    const cfg = configRef.current
    const elapsed = performance.now() - startWallRef.current
    const t = motionTimeSec(elapsed, cfg)

    if (t >= cfg.duration) {
      const values = applyAt(cfg.duration)
      if (cfg.loop) {
        startWallRef.current = performance.now()
        pausedElapsedRef.current = 0
        applyAt(0)
        rafRef.current = requestAnimationFrame(runFrame)
        return
      }
      // Native session owns completion callbacks; keep last frame on style outlet.
      if (nativeCapable && supports('useAnimation', ['element'])) {
        const ns = native.getNativePlayState()
        if (ns === 'running' || ns === 'queued') {
          rafRef.current = requestAnimationFrame(runFrame)
          return
        }
        stopRaf()
        return
      }
      finishNaturally(values)
      return
    }

    applyAt(t)
    rafRef.current = requestAnimationFrame(runFrame)
  }, [applyAt, finishNaturally, nativeCapable, native, stopRaf])

  const webPlay = useCallback(() => {
    const cfg = configRef.current
    const state = playStateRef.current

    if (state === 'running') return

    if (state === 'paused') {
      startWallRef.current = performance.now() - pausedElapsedRef.current
      playStateRef.current = 'running'
      tick()
      rafRef.current = requestAnimationFrame(runFrame)
      return
    }

    if (state === 'finished') {
      finishedRef.current = false
    }

    if (!startedRef.current) {
      startedRef.current = true
      cfg.onStart?.()
    }

    startWallRef.current = performance.now()
    pausedElapsedRef.current = 0
    playStateRef.current = 'running'
    tick()

    stopRaf()
    rafRef.current = requestAnimationFrame(runFrame)
  }, [runFrame, stopRaf])

  const webPause = useCallback(() => {
    if (playStateRef.current !== 'running') return
    pausedElapsedRef.current = performance.now() - startWallRef.current
    applyAt(motionTimeSec(pausedElapsedRef.current, configRef.current))
    playStateRef.current = 'paused'
    stopRaf()
    tick()
  }, [applyAt, stopRaf])

  const webCancel = useCallback(() => {
    if (playStateRef.current === 'idle') return
    stopRaf()
    const values = applyAt(0)
    playStateRef.current = 'idle'
    finishedRef.current = false
    startedRef.current = false
    pausedElapsedRef.current = 0
    tick()
    configRef.current.onCancel?.(values)
  }, [applyAt, stopRaf])

  const play = useCallback(() => {
    // WebSpatial: native-only playback (no Web RAF). Plain browser: webPlay only.
    if (nativeCapable && supports('useAnimation', ['element'])) {
      stopRaf()
      native.nativePlay()
      return
    }
    webPlay()
  }, [nativeCapable, native, stopRaf, webPlay])

  const pause = useCallback(() => {
    if (nativeCapable && supports('useAnimation', ['element'])) {
      const ns = native.getNativePlayState()
      if (ns === 'running' || ns === 'queued') {
        native.nativePause()
        return
      }
    }
    webPause()
  }, [nativeCapable, native, webPause])

  const cancel = useCallback(() => {
    if (nativeCapable && supports('useAnimation', ['element'])) {
      const ns = native.getNativePlayState()
      if (ns !== 'idle' && ns !== 'finished') {
        native.nativeCancel()
        return
      }
    }
    webCancel()
  }, [nativeCapable, native, webCancel])

  useEffect(() => {
    return () => {
      stopRaf()
      playStateRef.current = 'idle'
      finishedRef.current = false
      startedRef.current = false
      pausedElapsedRef.current = 0
    }
  }, [stopRaf])

  useEffect(() => {
    if (config.autoStart === false) return
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api: SpatialDivMotionApi = useMemo(
    () => ({
      play,
      pause,
      cancel,
      get isAnimating() {
        if (nativeCapable) {
          const s = native.getNativePlayState()
          if (s === 'running' || s === 'queued') return true
        }
        return playStateRef.current === 'running'
      },
      get isPaused() {
        if (nativeCapable && native.getNativePlayState() === 'paused') {
          return true
        }
        return playStateRef.current === 'paused'
      },
      get finished() {
        if (nativeCapable && native.getNativePlayState() === 'finished') {
          return true
        }
        return finishedRef.current
      },
      get playState() {
        if (nativeCapable) {
          const s = native.getNativePlayState()
          if (s === 'queued') return 'running'
          if (s !== 'idle') return s
        }
        return playStateRef.current
      },
    }),
    [play, pause, cancel, nativeCapable, native],
  )

  return {
    style,
    api,
    motion: native.motionBinding,
  }
}

export function useSpatialDivMotion(
  config: SpatialDivMotionConfig,
): UseSpatialDivMotionResult {
  return useSpatialDivMotionInternal(config)
}

function useSpatialDivMotionSimple(
  simple: SpatialDivMotionSimpleConfig,
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
    () => simpleConfigToMotionConfig(simple),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simpleKey],
  )
  return useSpatialDivMotionInternal(motionConfig)
}

useSpatialDivMotion.simple = useSpatialDivMotionSimple
