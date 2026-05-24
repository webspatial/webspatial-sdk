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

function motionTimeSec(
  elapsedMs: number,
  config: SpatialDivMotionConfig,
): number {
  const delayMs = (config.delay ?? 0) * 1000
  const rate = config.playbackRate ?? 1
  if (elapsedMs <= delayMs) return 0
  return ((elapsedMs - delayMs) / 1000) * rate
}

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
  const useWebBackendRef = useRef(true)

  const native = useNativeMotionSession(config, tick)
  const nativeCapable = !!native.motionBinding

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

  const applyAt = useCallback((timeSec: number) => {
    const values = evaluateMotionTimeline(configRef.current, timeSec)
    setStyle(valuesToMotionStyle(values))
    return values
  }, [])

  const finishNaturally = useCallback(
    (values: ReturnType<typeof evaluateMotionTimeline>) => {
      stopRaf()
      playStateRef.current = 'finished'
      finishedRef.current = true
      tick()
      configRef.current.onComplete?.(values)
    },
    [stopRaf],
  )

  const runFrame = useCallback(() => {
    if (!useWebBackendRef.current) return

    const cfg = configRef.current
    const elapsed =
      playStateRef.current === 'paused'
        ? pausedElapsedRef.current
        : performance.now() - startWallRef.current
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
      finishNaturally(values)
      return
    }

    applyAt(t)
    rafRef.current = requestAnimationFrame(runFrame)
  }, [applyAt, finishNaturally])

  const webPlay = useCallback(() => {
    useWebBackendRef.current = true
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
    if (!useWebBackendRef.current) return
    if (playStateRef.current !== 'running') return
    pausedElapsedRef.current = performance.now() - startWallRef.current
    playStateRef.current = 'paused'
    stopRaf()
    tick()
  }, [stopRaf])

  const webCancel = useCallback(() => {
    if (!useWebBackendRef.current) return
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
    if (nativeCapable && supports('useAnimation', ['element'])) {
      useWebBackendRef.current = false
      stopRaf()
      native.nativePlay()
      return
    }
    webPlay()
  }, [nativeCapable, native, stopRaf, webPlay])

  const pause = useCallback(() => {
    if (nativeCapable && !useWebBackendRef.current) {
      native.nativePause()
      return
    }
    webPause()
  }, [nativeCapable, native, webPause])

  const cancel = useCallback(() => {
    if (nativeCapable && !useWebBackendRef.current) {
      native.nativeCancel()
      useWebBackendRef.current = true
      applyAt(0)
      return
    }
    webCancel()
  }, [nativeCapable, native, webCancel, applyAt])

  useEffect(() => {
    return () => {
      stopRaf()
      playStateRef.current = 'idle'
      finishedRef.current = false
      startedRef.current = false
      pausedElapsedRef.current = 0
      useWebBackendRef.current = true
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
          if (s !== 'idle') return s
        }
        return playStateRef.current
      },
    }),
    [play, pause, cancel, nativeCapable, native],
  )

  const displayStyle =
    nativeCapable && native.motionBinding?.__animating
      ? valuesToMotionStyle(initialValues)
      : style

  return {
    style: displayStyle,
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
