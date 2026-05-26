import { useCallback, useMemo, useReducer, useRef } from 'react'
import {
  Spatialized2DElement,
  supports,
  type AnimateSpatialDivCommand,
  type AnimateSpatialDivResult,
  type SpatialDivAnimatedValues,
  type SpatialDivMotionConfig,
  type SpatialDivMotionPlayState,
  type SpatialDivMotionTimeline,
} from '@webspatial/core-sdk'
import type { SpatialDivMotionBindingInternal } from './motionBindingTypes'
import { getMotionSuppressedFields } from './getMotionSuppressedFields'
import {
  motionConfigToNativeSegment,
  motionConfigToNativeTimeline,
  type NativeSegmentPlayPayload,
} from './nativeCompile'
import { evaluateMotionTimeline } from './evaluate'
import { motionTimeSec } from './motionTiming'

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

interface MotionNativeSession {
  animationId: string
  state: SessionState
  config: SpatialDivMotionConfig
  result?: AnimateSpatialDivResult
  queuedPause?: boolean
  unmounted?: boolean
}

let _motionObjectCounter = 0
function nextMotionObjectId(): string {
  return `__sdmotion_${++_motionObjectCounter}_${Date.now()}`
}

let _sessionCounter = 0
function nextAnimationId(): string {
  return `sdmotion_${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useNativeMotionSession(
  config: SpatialDivMotionConfig,
  onNativeStateChange?: () => void,
  /** Sync React `style` from sampled or native-reported animated values. */
  syncStyleFromValues?: (values: SpatialDivAnimatedValues) => void,
): {
  motionBinding: SpatialDivMotionBindingInternal | undefined
  getNativePlayState: () => SpatialDivMotionPlayState | 'queued'
  nativePlay: () => void
  nativePause: () => void
  nativeCancel: () => void
  readonly nativeIsAnimating: boolean
} {
  const configRef = useRef(config)
  configRef.current = config

  const motionObjectId = useRef(nextMotionObjectId()).current
  const sessionRef = useRef<MotionNativeSession | null>(null)
  const elementRef = useRef<Spatialized2DElement | null>(null)
  const unmountedRef = useRef(false)
  const warnedRef = useRef(false)
  const warnedQueuedRef = useRef(false)
  const nativeControllingRef = useRef(false)
  const playStartWallMsRef = useRef(0)
  const pausedElapsedMsRef = useRef(0)

  const syncStyleFromValuesRef = useRef(syncStyleFromValues)
  syncStyleFromValuesRef.current = syncStyleFromValues

  const syncStyleAtElapsedMs = useCallback((elapsedMs: number) => {
    const t = motionTimeSec(elapsedMs, configRef.current)
    const values = evaluateMotionTimeline(configRef.current, t)
    syncStyleFromValuesRef.current?.(values)
  }, [])

  const markPlayStart = useCallback(() => {
    playStartWallMsRef.current = performance.now()
  }, [])

  const markResumeFromPause = useCallback(() => {
    playStartWallMsRef.current = performance.now() - pausedElapsedMsRef.current
  }, [])

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  const bump = useCallback(() => {
    forceUpdate()
    onNativeStateChange?.()
  }, [onNativeStateChange])

  const commandQueueRef = useRef<Promise<void>>(Promise.resolve())
  const enqueueCommand = useCallback((fn: () => Promise<void>) => {
    commandQueueRef.current = commandQueueRef.current.then(fn, fn)
  }, [])

  const reportError = useCallback(
    (error: { animationId: string; command: string; reason: string }) => {
      if (unmountedRef.current) return
      const cfg = configRef.current
      if (cfg.onError) {
        cfg.onError(error as any)
      } else {
        console.error('[useSpatialDivMotion] Native error:', error)
      }
    },
    [],
  )

  const buildPlayCommand = useCallback(
    (
      session: MotionNativeSession,
      elementId: string,
    ): (AnimateSpatialDivCommand & { type: 'play' }) | null => {
      const cfg = session.config
      const segment: NativeSegmentPlayPayload | null =
        motionConfigToNativeSegment(cfg)
      const base = {
        animationId: session.animationId,
        type: 'play' as const,
        elementId,
        delay: cfg.delay ?? 0,
        loop: cfg.loop,
        playbackRate: cfg.playbackRate,
      }

      if (segment) {
        return {
          ...base,
          from: segment.from,
          to: segment.to,
          duration: segment.duration,
          timingFunction: segment.timingFunction,
        }
      }

      const timeline: SpatialDivMotionTimeline =
        motionConfigToNativeTimeline(cfg)
      return {
        ...base,
        timeline,
        duration: timeline.duration,
        timingFunction: 'linear',
      }
    },
    [],
  )

  const doPlay = useCallback(
    async (session: MotionNativeSession, element: Spatialized2DElement) => {
      const cmd = buildPlayCommand(session, element.id)
      if (!cmd) return

      try {
        const result = await element.animateSpatialDiv(cmd)
        if (unmountedRef.current || session.unmounted) return

        session.result = result
        nativeControllingRef.current = true

        result.finished.then(finalValues => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          if (session.state === 'finished' || session.state === 'idle') return
          session.state = 'finished'
          nativeControllingRef.current = false
          bump()
          configRef.current.onComplete?.(finalValues)
        })

        result.canceled.then(currentValues => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          if (session.state === 'finished' || session.state === 'idle') return
          session.state = 'idle'
          sessionRef.current = null
          nativeControllingRef.current = false
          bump()
          configRef.current.onCancel?.(currentValues)
        })

        result.failed.then(error => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          if (session.state === 'finished' || session.state === 'idle') return
          session.state = 'idle'
          sessionRef.current = null
          nativeControllingRef.current = false
          bump()
          reportError(error)
        })

        if (session.queuedPause) {
          session.state = 'paused'
          session.queuedPause = false
          await element.animateSpatialDiv({
            animationId: session.animationId,
            type: 'pause',
          })
          pausedElapsedMsRef.current = 0
          syncStyleAtElapsedMs(0)
        } else {
          session.state = 'running'
          markPlayStart()
        }

        bump()
        configRef.current.onStart?.()
      } catch (e: any) {
        if (unmountedRef.current || session.unmounted) return
        session.state = 'idle'
        sessionRef.current = null
        nativeControllingRef.current = false
        bump()
        reportError({
          animationId: session.animationId,
          command: 'play',
          reason: e?.message ?? 'Play failed',
        })
      }
    },
    [buildPlayCommand, bump, markPlayStart, reportError, syncStyleAtElapsedMs],
  )

  const nativePlay = useCallback(() => {
    if (!supports('useAnimation', ['element'])) {
      if (!warnedRef.current) {
        warnedRef.current = true
        console.warn(
          '[useSpatialDivMotion] Native motion requires supports(useAnimation, [element]).',
        )
      }
      return
    }

    enqueueCommand(async () => {
      const currentSession = sessionRef.current

      if (currentSession && currentSession.state === 'paused') {
        const element = elementRef.current
        if (!element) return
        try {
          await element.animateSpatialDiv({
            animationId: currentSession.animationId,
            type: 'resume',
          })
          currentSession.state = 'running'
          nativeControllingRef.current = true
          markResumeFromPause()
          bump()
        } catch (e: any) {
          reportError({
            animationId: currentSession.animationId,
            command: 'resume',
            reason: e?.message ?? 'Resume failed',
          })
        }
        return
      }

      if (
        currentSession &&
        (currentSession.state === 'running' ||
          currentSession.state === 'queued')
      ) {
        return
      }

      const session: MotionNativeSession = {
        animationId: nextAnimationId(),
        state: 'idle',
        config: configRef.current,
      }
      sessionRef.current = session

      const element = elementRef.current
      if (!element) {
        session.state = 'queued'
        if (!warnedQueuedRef.current) {
          warnedQueuedRef.current = true
          console.warn(
            '[useSpatialDivMotion] Native play is queued: pass motion={motion} on the same enable-xr node. WebSpatial uses native playback only (no Web RAF fallback).',
          )
        }
        bump()
        return
      }

      await doPlay(session, element)
    })
  }, [enqueueCommand, doPlay, bump, markResumeFromPause, reportError])

  const nativePause = useCallback(() => {
    enqueueCommand(async () => {
      const session = sessionRef.current
      if (!session) return

      if (session.state === 'queued') {
        session.queuedPause = true
        session.state = 'paused'
        pausedElapsedMsRef.current = 0
        syncStyleAtElapsedMs(0)
        bump()
        return
      }

      if (session.state !== 'running') return

      const element = elementRef.current
      if (!element) return
      try {
        const values = await element.animateSpatialDiv({
          animationId: session.animationId,
          type: 'pause',
        })
        pausedElapsedMsRef.current =
          performance.now() - playStartWallMsRef.current
        session.state = 'paused'
        if (values) {
          syncStyleFromValuesRef.current?.(values)
        } else {
          syncStyleAtElapsedMs(pausedElapsedMsRef.current)
        }
        bump()
      } catch (e: any) {
        reportError({
          animationId: session.animationId,
          command: 'pause',
          reason: e?.message ?? 'Pause failed',
        })
      }
    })
  }, [enqueueCommand, bump, reportError, syncStyleAtElapsedMs])

  const nativeCancel = useCallback(() => {
    enqueueCommand(async () => {
      const session = sessionRef.current
      if (!session || session.state === 'idle') return

      if (session.state === 'finished') {
        sessionRef.current = null
        nativeControllingRef.current = false
        bump()
        return
      }

      const element = elementRef.current
      if (!element) {
        session.state = 'idle'
        sessionRef.current = null
        nativeControllingRef.current = false
        bump()
        configRef.current.onCancel?.(evaluateMotionTimeline(session.config, 0))
        return
      }

      try {
        await element.animateSpatialDiv({
          animationId: session.animationId,
          type: 'cancel',
        })
      } catch {
        session.state = 'idle'
        sessionRef.current = null
        nativeControllingRef.current = false
        bump()
      }
    })
  }, [enqueueCommand, bump])

  const setElement = useCallback(
    (element: Spatialized2DElement | null) => {
      elementRef.current = element
      if (element) {
        const session = sessionRef.current
        if (
          session &&
          (session.state === 'queued' ||
            (session.state === 'paused' && session.queuedPause))
        ) {
          void doPlay(session, element)
          return
        }
        const cfg = configRef.current
        if (cfg.autoStart !== false && !sessionRef.current) {
          void nativePlay()
        }
      }
    },
    [doPlay, nativePlay],
  )

  const motionBinding = useMemo(():
    | SpatialDivMotionBindingInternal
    | undefined => {
    if (!supports('useAnimation', ['element'])) return undefined

    const binding: SpatialDivMotionBindingInternal = {
      __kind: 'spatialDivMotion',
      __motionObjectId: motionObjectId,
      get __animating() {
        const s = sessionRef.current
        return s ? ['running', 'paused', 'queued'].includes(s.state) : false
      },
      __getSuppressedFields() {
        const s = sessionRef.current
        // Suppress only while native is driving (running/paused). `queued` waits
        // for motion bind — playback is still native-only; do not fall back to Web RAF.
        if (!s || (s.state !== 'running' && s.state !== 'paused')) return null
        return getMotionSuppressedFields(s.config)
      },
      __setElement: setElement,
      __onUnbind: () => {
        const session = sessionRef.current
        const element = elementRef.current
        if (session && element) {
          if (session.state !== 'idle' && session.state !== 'finished') {
            element
              .animateSpatialDiv({
                animationId: session.animationId,
                type: 'cancel',
              })
              .catch(() => {})
            element.cleanupSpatialDivAnimationListeners(session.animationId)
            session.unmounted = true
            session.state = 'idle'
          }
        }
        sessionRef.current = null
        elementRef.current = null
        nativeControllingRef.current = false
        bump()
      },
    }
    return binding
  }, [motionObjectId, setElement])

  const getNativePlayState = (): SpatialDivMotionPlayState | 'queued' =>
    sessionRef.current?.state ?? 'idle'

  return {
    motionBinding,
    getNativePlayState,
    nativePlay,
    nativePause,
    nativeCancel,
    get nativeIsAnimating() {
      return motionBinding?.__animating ?? false
    },
  }
}
