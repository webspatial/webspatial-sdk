import { useCallback, useEffect, useMemo, useRef, useReducer } from 'react'
import { Spatialized2DElement, supports } from '@webspatial/core-sdk'
import type {
  SpatialDivAnimationConfig,
  SpatialDivAnimationApi,
  SpatialDivAnimationPlayState,
  SpatialDivAnimatedProps,
  SpatialDivAnimatedPropsInternal,
  SpatialDivAnimatedValues,
  SpatialDivAnimationError,
  AnimateSpatialDivCommand,
  AnimateSpatialDivResult,
} from '@webspatial/core-sdk'
import { validateSpatialDivAnimationConfig } from './spatialDivAnimationValidator'

// ---- Internal types ----

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

interface SpatialDivAnimationSession {
  animationId: string
  state: SessionState
  config: SpatialDivAnimationConfig
  result?: AnimateSpatialDivResult
  queuedPause?: boolean
  unmounted?: boolean
}

let _animObjectCounter = 0
function nextAnimObjectId(): string {
  return `__sdanim_${++_animObjectCounter}_${Date.now()}`
}

let _sessionCounter = 0
function nextAnimationId(): string {
  return `sdanim_${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
/**
 * Computes the set of field names that will be suppressed during animation.
 * Per spec, only transform and opacity are animatable.
 * When transform is animated, the entire transform sync is suppressed.
 */
function getSuppressedFieldNames(
  config: SpatialDivAnimationConfig,
): Set<string> {
  const fields = new Set<string>()
  const to = config.to
  if (to.opacity !== undefined) fields.add('opacity')
  if (to.transform) {
    // Suppress the entire transform during any transform sub-field animation
    fields.add('transform')
  }
  return fields
}

/**
 * Internal hook for SpatialDiv animation.
 * Called unconditionally by the dispatcher; `active` controls whether effects run.
 */
export function useSpatialDivAnimation(
  config: SpatialDivAnimationConfig,
  active: boolean,
): [SpatialDivAnimatedProps, SpatialDivAnimationApi] {
  // Validate config eagerly when active
  if (active) {
    validateSpatialDivAnimationConfig(config)
  }

  const animObjectId = useRef(nextAnimObjectId()).current
  const configRef = useRef<SpatialDivAnimationConfig>(config)
  configRef.current = config

  const sessionRef = useRef<SpatialDivAnimationSession | null>(null)
  const elementRef = useRef<Spatialized2DElement | null>(null)
  const elementIdRef = useRef<string | null>(null)
  const unmountedRef = useRef(false)
  const warnedRef = useRef(false)

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  // Command queue for serialization
  const commandQueueRef = useRef<Promise<void>>(Promise.resolve())
  const enqueueCommand = useCallback((fn: () => Promise<void>) => {
    commandQueueRef.current = commandQueueRef.current.then(fn, fn)
  }, [])

  // ---- Helper: report error ----
  const reportError = useCallback((error: SpatialDivAnimationError) => {
    if (unmountedRef.current) return
    const cfg = configRef.current
    if (cfg.onError) {
      cfg.onError(error)
    } else {
      console.error('[useSpatialDivAnimation] Animation error:', error)
    }
  }, [])

  // ---- Core: send play to native ----
  const doPlay = useCallback(
    async (
      session: SpatialDivAnimationSession,
      element: Spatialized2DElement,
    ) => {
      const cfg = session.config

      const cmd: AnimateSpatialDivCommand = {
        animationId: session.animationId,
        type: 'play',
        elementId: element.id,
        to: cfg.to,
        from: cfg.from,
        duration: cfg.duration ?? 0.3,
        timingFunction: cfg.timingFunction ?? 'easeInOut',
        delay: cfg.delay ?? 0,
        loop: cfg.loop,
        playbackRate: cfg.playbackRate,
      }

      try {
        const result = await element.animateSpatialDiv(
          cmd as AnimateSpatialDivCommand & { type: 'play' },
        )
        if (unmountedRef.current || session.unmounted) return

        session.result = result

        // Listen for completion
        result.finished.then(finalValues => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          session.state = 'finished'
          forceUpdate()
          configRef.current.onComplete?.(finalValues)
        })

        // Listen for cancellation
        result.canceled.then(currentValues => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          session.state = 'idle'
          sessionRef.current = null
          forceUpdate()
          configRef.current.onCancel?.(currentValues)
        })

        // Listen for async native failure
        result.failed.then(error => {
          if (unmountedRef.current || session.unmounted) return
          if (sessionRef.current !== session) return
          session.state = 'idle'
          sessionRef.current = null
          forceUpdate()
          reportError(error)
        })

        // Transition to running (or paused if queued pause)
        if (session.queuedPause) {
          session.state = 'paused'
          session.queuedPause = false
          // Immediately send pause
          await element.animateSpatialDiv({
            animationId: session.animationId,
            type: 'pause',
          })
        } else {
          session.state = 'running'
        }

        forceUpdate()
        configRef.current.onStart?.()
      } catch (e: any) {
        if (unmountedRef.current || session.unmounted) return
        session.state = 'idle'
        sessionRef.current = null
        forceUpdate()
        reportError({
          animationId: session.animationId,
          command: 'play',
          reason: e?.message ?? 'Play failed',
        })
      }
    },
    [reportError],
  )

  // ---- API ----
  const play = useCallback(() => {
    if (!active) return

    // Unsupported runtime check
    if (!supports('useAnimation', ['element'])) {
      if (!warnedRef.current) {
        warnedRef.current = true
        console.warn(
          '[useAnimation] SpatialDiv animation is not supported in the current runtime.',
        )
      }
      return
    }

    enqueueCommand(async () => {
      const currentSession = sessionRef.current

      // If paused, resume
      if (currentSession && currentSession.state === 'paused') {
        const element = elementRef.current
        if (!element) return
        try {
          await element.animateSpatialDiv({
            animationId: currentSession.animationId,
            type: 'resume',
          })
          currentSession.state = 'running'
          forceUpdate()
        } catch (e: any) {
          reportError({
            animationId: currentSession.animationId,
            command: 'resume',
            reason: e?.message ?? 'Resume failed',
          })
        }
        return
      }

      // Cancel any existing session
      if (
        currentSession &&
        currentSession.state !== 'idle' &&
        currentSession.state !== 'finished'
      ) {
        const element = elementRef.current
        if (element) {
          try {
            await element.animateSpatialDiv({
              animationId: currentSession.animationId,
              type: 'cancel',
            })
          } catch {}
          element.cleanupSpatialDivAnimationListeners(
            currentSession.animationId,
          )
        }
      }

      // Create new session
      const session: SpatialDivAnimationSession = {
        animationId: nextAnimationId(),
        state: 'idle',
        config: configRef.current,
      }
      sessionRef.current = session

      const element = elementRef.current
      if (!element) {
        // Element not bound yet — queue
        session.state = 'queued'
        forceUpdate()
        return
      }

      await doPlay(session, element)
    })
  }, [active, enqueueCommand, doPlay, reportError])

  const pause = useCallback(() => {
    if (!active) return
    enqueueCommand(async () => {
      const session = sessionRef.current
      if (!session) return

      if (session.state === 'queued') {
        session.queuedPause = true
        session.state = 'paused'
        forceUpdate()
        return
      }

      if (session.state !== 'running') return

      const element = elementRef.current
      if (!element) return
      try {
        await element.animateSpatialDiv({
          animationId: session.animationId,
          type: 'pause',
        })
        session.state = 'paused'
        forceUpdate()
      } catch (e: any) {
        reportError({
          animationId: session.animationId,
          command: 'pause',
          reason: e?.message ?? 'Pause failed',
        })
      }
    })
  }, [active, enqueueCommand, reportError])

  const cancel = useCallback(() => {
    if (!active) return
    enqueueCommand(async () => {
      const session = sessionRef.current
      if (!session || session.state === 'idle') return

      // If already finished, just reset state without sending cancel to native
      if (session.state === 'finished') {
        sessionRef.current = null
        forceUpdate()
        return
      }

      const element = elementRef.current
      if (!element) {
        // Not yet bound; just reset
        sessionRef.current = null
        forceUpdate()
        return
      }

      try {
        await element.animateSpatialDiv({
          animationId: session.animationId,
          type: 'cancel',
        })
        // The canceled promise handler will update state
      } catch {
        // Session may already be terminal
        session.state = 'idle'
        sessionRef.current = null
        forceUpdate()
      }
    })
  }, [active, enqueueCommand])

  // ---- Build API object ----
  const api: SpatialDivAnimationApi = useMemo(
    () => ({
      play,
      pause,
      cancel,
      get isAnimating() {
        const s = sessionRef.current
        return s ? ['queued', 'running'].includes(s.state) : false
      },
      get isPaused() {
        return sessionRef.current?.state === 'paused'
      },
      get playState(): SpatialDivAnimationPlayState {
        return (sessionRef.current?.state ??
          'idle') as SpatialDivAnimationPlayState
      },
      get finished() {
        return sessionRef.current?.state === 'finished'
      },
    }),
    [play, pause, cancel],
  )

  // ---- Build animated props ----
  const animatedProps: SpatialDivAnimatedPropsInternal = useMemo(() => {
    const props: SpatialDivAnimatedPropsInternal = {
      __animationObjectId: animObjectId,
      __kind: 'spatialDiv',
      get __animating() {
        const s = sessionRef.current
        return s ? !['idle', 'finished'].includes(s.state) : false
      },
      get __suppressedFields() {
        const s = sessionRef.current
        if (!s || s.state === 'idle' || s.state === 'finished') return null
        return getSuppressedFieldNames(s.config)
      },
      __getSuppressedFields() {
        return this.__suppressedFields
      },
      __onBind: undefined,
      __onUnbind: undefined,
    }
    return props
  }, [animObjectId])

  // Set up bind/unbind handlers
  animatedProps.__onBind = (elementId: string) => {
    if (!active) return
    // Look up the element from the session's context
    // The element reference is provided externally via the binding mechanism
  }

  animatedProps.__onUnbind = () => {
    if (!active) return
    const session = sessionRef.current
    if (session && elementRef.current) {
      if (session.state !== 'idle' && session.state !== 'finished') {
        elementRef.current
          .animateSpatialDiv({
            animationId: session.animationId,
            type: 'cancel',
          })
          .catch(() => {})
        elementRef.current.cleanupSpatialDivAnimationListeners(
          session.animationId,
        )
      }
    }
    sessionRef.current = null
    elementRef.current = null
    elementIdRef.current = null
  }

  // ---- Bind element when it becomes available ----
  // This is called from the spatialized container layer when animation prop is set
  const setElement = useCallback(
    (element: Spatialized2DElement | null) => {
      if (!active) return
      elementRef.current = element
      if (element) {
        elementIdRef.current = element.id
        // If there's a queued session, start it
        const session = sessionRef.current
        if (session && session.state === 'queued') {
          doPlay(session, element)
        }
      }
    },
    [active, doPlay],
  )

  // Expose setElement on the animatedProps for the binding layer to call
  ;(animatedProps as any).__setElement = setElement

  // ---- Cleanup on unmount ----
  useEffect(() => {
    if (!active) return
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      const session = sessionRef.current
      if (session) {
        session.unmounted = true
      }
    }
  }, [active])

  // ---- Auto-start ----
  useEffect(() => {
    if (!active) return
    const autoStart = config.autoStart !== false
    if (autoStart && !sessionRef.current) {
      play()
    }
  }, [active]) // only on mount

  return [animatedProps, api]
}
