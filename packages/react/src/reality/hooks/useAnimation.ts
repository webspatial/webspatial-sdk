import { useCallback, useEffect, useMemo, useRef, useReducer } from 'react'
import { SpatialEntity, composeSRT } from '@webspatial/core-sdk'
import type {
  AnimatedPropsInternal,
  AnimationConfig,
  AnimationPlayState,
  AnimationApi,
  AnimatedProps,
  AnimateTransformCommand,
  AnimateTransformResult,
  AnimationError,
  TransformValues,
  Vec3,
} from '@webspatial/core-sdk'
import {
  validateAnimationConfig,
  getAnimatedFields,
} from './animationValidator'

// ---- Internal types ----

type SessionState =
  | 'idle'
  | 'queued'
  | 'delaying'
  | 'running'
  | 'paused'
  | 'finished'

interface AnimationSession {
  animationId: string
  state: SessionState
  /** Transform fields controlled by this session. */
  fields: readonly ('position' | 'rotation' | 'scale')[]
  /** The config snapshot used for this session. */
  config: AnimationConfig
  /** Result from core animateTransform (play). */
  result?: AnimateTransformResult
  /** Whether a queued pause was requested before bind. */
  queuedPause?: boolean
  /** Whether unmounted — suppress callbacks after unmount. */
  unmounted?: boolean
}

let _animObjectCounter = 0
function nextAnimObjectId(): string {
  return `__anim_${++_animObjectCounter}_${Date.now()}`
}

let _sessionCounter = 0
function nextAnimationId(): string {
  return `anim_${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---- Track bound animation objects per entity ----
const _boundAnimations = new WeakMap<object, string>()

/**
 * Internal entity animation hook.
 * Called unconditionally by the dispatch layer; `active` controls whether effects run.
 * When `active` is false, all hooks still execute but effects short-circuit.
 */
export function useEntityAnimation(
  config: AnimationConfig,
  active: boolean = true,
): [AnimatedProps, AnimationApi] {
  // Validate config eagerly (throws on invalid) — only when active
  if (active) {
    validateAnimationConfig(config)
  }

  const animatedFields = useMemo(
    () => getAnimatedFields(config),
    [
      config.to.position !== undefined,
      config.to.rotation !== undefined,
      config.to.scale !== undefined,
    ],
  )

  // Stable animation object ID for the lifetime of this hook instance
  const animObjectId = useRef(nextAnimObjectId()).current

  // Mutable refs
  const configRef = useRef<AnimationConfig>(config)
  configRef.current = config

  const sessionRef = useRef<AnimationSession | null>(null)
  const entityRef = useRef<SpatialEntity | null>(null)
  const unmountedRef = useRef(false)
  const finishedRef = useRef(false)

  // Trigger a re-render when a session ends so that useEntityTransform
  // re-runs and syncs the React-declared transform back to native.
  const [, bumpSyncVersion] = useReducer((x: number) => x + 1, 0)

  // ---- Command queue for serializing bridge calls ----
  const commandQueueRef = useRef<Promise<void>>(Promise.resolve())

  const enqueueCommand = useCallback((fn: () => Promise<void>) => {
    commandQueueRef.current = commandQueueRef.current.then(fn, fn)
  }, [])

  // ---- Helper: fire onError or console.error ----
  const reportError = useCallback((error: AnimationError) => {
    if (unmountedRef.current) return
    const cfg = configRef.current
    if (cfg.onError) {
      cfg.onError(error)
    } else {
      console.error('[useEntityAnimation] Animation error:', error)
    }
  }, [])

  // ---- Helper: convert TransformValues to Float4x4 ----
  const toMatrix = useCallback(
    (values: TransformValues, entity: SpatialEntity): Float64Array => {
      const pos: Vec3 = values.position ?? entity.position
      const rot: Vec3 = values.rotation ?? entity.rotation
      const scl: Vec3 = values.scale ?? entity.scale
      return composeSRT(pos, rot, scl).toFloat64Array()
    },
    [],
  )

  // ---- Core: send play to native ----
  const doPlay = useCallback(
    async (session: AnimationSession, entity: SpatialEntity) => {
      const cfg = session.config

      // Build the command
      const cmd: AnimateTransformCommand = {
        animationId: session.animationId,
        type: 'play',
        entityId: entity.id,
        duration: cfg.duration ?? 0.3,
        timingFunction: cfg.timingFunction ?? 'easeInOut',
        delay: cfg.delay ?? 0,
        loop: cfg.loop,
        playbackRate: cfg.playbackRate,
      }

      // Build toTransform from the fields in to
      const toValues: TransformValues = {}
      if (cfg.to.position) toValues.position = cfg.to.position
      if (cfg.to.rotation) toValues.rotation = cfg.to.rotation
      if (cfg.to.scale) toValues.scale = cfg.to.scale
      cmd.toTransform = toMatrix(toValues, entity)

      // Build fromTransform if from is specified
      if (cfg.from) {
        const fromValues: TransformValues = {}
        if (cfg.from.position) fromValues.position = cfg.from.position
        if (cfg.from.rotation) fromValues.rotation = cfg.from.rotation
        if (cfg.from.scale) fromValues.scale = cfg.from.scale
        cmd.fromTransform = toMatrix(fromValues, entity)
      }

      try {
        const result = await entity.animateTransform(
          cmd as AnimateTransformCommand & { type: 'play' },
        )
        session.result = result

        // If session was stopped or replaced while waiting for bridge ack, skip
        if (sessionRef.current !== session || session.unmounted) return

        // Transition state
        if (session.queuedPause) {
          session.state = 'paused'
        } else if ((cfg.delay ?? 0) > 0) {
          session.state = 'delaying'
        } else {
          session.state = 'running'
        }

        // Fire onStart
        if (!session.unmounted && cfg.onStart) {
          cfg.onStart()
        }

        // Listen for terminal events
        result.finished.then((values: TransformValues) => {
          if (sessionRef.current !== session || session.unmounted) return
          session.state = 'finished'
          finishedRef.current = true
          sessionRef.current = null
          if (!session.unmounted && cfg.onComplete) {
            cfg.onComplete(values)
          }
          bumpSyncVersion()
        })

        result.canceled.then((values: TransformValues) => {
          if (session.unmounted) return
          // sessionRef may already be null if doCancel's enqueueCommand resolved
          // before this event arrived — that's fine, proceed with cleanup.
          if (sessionRef.current === session) {
            session.state = 'idle'
            sessionRef.current = null
          }
          finishedRef.current = false
          if (cfg.onCancel) {
            cfg.onCancel(values)
          }
          bumpSyncVersion()
        })

        // Listen for failed event
        if (result.failed) {
          result.failed.then((error: AnimationError) => {
            if (sessionRef.current !== session || session.unmounted) return
            session.state = 'idle'
            sessionRef.current = null
            reportError(error)
          })
        }
      } catch (err: any) {
        if (sessionRef.current !== session || session.unmounted) return
        session.state = 'idle'
        sessionRef.current = null
        reportError({
          animationId: session.animationId,
          command: 'play',
          reason: err?.message ?? String(err),
        })
      }
    },
    [toMatrix, reportError],
  )

  // ---- Core: cancel session ----
  const doCancel = useCallback(
    async (session: AnimationSession, entity: SpatialEntity) => {
      if (session.state === 'queued') {
        // Not yet sent to native, just cancel locally
        session.state = 'idle'
        return
      }

      try {
        await entity.animateTransform({
          animationId: session.animationId,
          type: 'cancel',
        })
      } catch (err: any) {
        reportError({
          animationId: session.animationId,
          command: 'cancel',
          reason: err?.message ?? String(err),
        })
        throw err // propagate to block start-new
      }
    },
    [reportError],
  )

  // ---- AnimationApi methods ----

  const play = useCallback(() => {
    const currentSession = sessionRef.current
    const entity = entityRef.current

    // Already playing or queued — calling play() again is a no-op (Web Animation API semantics).
    if (
      currentSession &&
      (currentSession.state === 'running' ||
        currentSession.state === 'delaying' ||
        currentSession.state === 'queued')
    ) {
      return
    }

    // If paused, resume the same session instead of creating a new one
    if (currentSession && currentSession.state === 'paused') {
      if (currentSession.queuedPause) {
        // Was paused while queued — undo the queued pause
        currentSession.queuedPause = false
        currentSession.state = 'queued'
        return
      }

      enqueueCommand(async () => {
        if (
          !entity ||
          currentSession !== sessionRef.current ||
          currentSession.unmounted
        )
          return
        if (currentSession.state !== 'paused') return

        try {
          await entity.animateTransform({
            animationId: currentSession.animationId,
            type: 'resume',
          })
          currentSession.state = 'running'
          bumpSyncVersion()
        } catch (err: any) {
          reportError({
            animationId: currentSession.animationId,
            command: 'resume',
            reason: err?.message ?? String(err),
          })
        }
      })
      return
    }

    // Start a new session
    const cfg = configRef.current
    const prevSession = currentSession

    const newSession: AnimationSession = {
      animationId: nextAnimationId(),
      state: entity ? 'running' : 'queued',
      fields: getAnimatedFields(cfg),
      config: { ...cfg },
    }

    // Reset finished flag on new play
    finishedRef.current = false

    enqueueCommand(async () => {
      if (unmountedRef.current) return

      // Cancel previous session first
      if (
        prevSession &&
        prevSession.state !== 'idle' &&
        prevSession.state !== 'finished'
      ) {
        try {
          if (entity) {
            await doCancel(prevSession, entity)
          }
          prevSession.state = 'idle'
          if (!prevSession.unmounted && prevSession.config.onCancel) {
            prevSession.config.onCancel({
              position: entity?.position,
              rotation: entity?.rotation,
              scale: entity?.scale,
            })
          }
        } catch {
          // cancel-old failure blocks start-new
          return
        }
      }

      sessionRef.current = newSession
      bumpSyncVersion()

      if (entity) {
        await doPlay(newSession, entity)
      }
      // else: stays queued, will play on bind
    })
  }, [enqueueCommand, doCancel, doPlay, reportError])

  const pause = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.state === 'idle') return
    const entity = entityRef.current

    if (session.state === 'queued') {
      session.queuedPause = true
      session.state = 'paused'
      bumpSyncVersion()
      return
    }

    enqueueCommand(async () => {
      if (!entity || session !== sessionRef.current || session.unmounted) return
      if (session.state !== 'delaying' && session.state !== 'running') return

      try {
        await entity.animateTransform({
          animationId: session.animationId,
          type: 'pause',
        })
        session.state = 'paused'
        bumpSyncVersion()
      } catch (err: any) {
        reportError({
          animationId: session.animationId,
          command: 'pause',
          reason: err?.message ?? String(err),
        })
      }
    })
  }, [enqueueCommand, reportError])

  const cancel = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.state === 'idle' || session.state === 'finished') return
    const entity = entityRef.current

    if (session.state === 'queued') {
      session.state = 'idle'
      sessionRef.current = null
      if (session.config.onCancel) {
        session.config.onCancel({
          position: entity?.position,
          rotation: entity?.rotation,
          scale: entity?.scale,
        })
      }
      bumpSyncVersion()
      return
    }

    enqueueCommand(async () => {
      if (!entity || session !== sessionRef.current || session.unmounted) return
      if (session.state === 'idle' || session.state === 'finished') return

      try {
        await doCancel(session, entity)
        session.state = 'idle'
        sessionRef.current = null

        // Eagerly restore entity to the from-transform on the JS side.
        // This guarantees visual restoration even if the native cancel event
        // is delayed or the native layer does not restore the transform.
        const cfg = session.config
        const restoreValues: TransformValues = {}
        if (cfg.from) {
          if (cfg.from.position) restoreValues.position = cfg.from.position
          if (cfg.from.rotation) restoreValues.rotation = cfg.from.rotation
          if (cfg.from.scale) restoreValues.scale = cfg.from.scale
        }
        if (Object.keys(restoreValues).length > 0) {
          await entity.updateTransform(restoreValues)
        }

        // onCancel will also be triggered by the canceled promise in doPlay
      } catch {
        // error already reported in doCancel
      }
    })
  }, [enqueueCommand, doCancel])

  // ---- Build AnimationApi ----
  const api: AnimationApi = useMemo(
    () => ({
      play,
      pause,
      cancel,
      get isAnimating() {
        const s = sessionRef.current
        if (!s) return false
        return (
          s.state === 'queued' ||
          s.state === 'delaying' ||
          s.state === 'running'
        )
      },
      get isPaused() {
        const s = sessionRef.current
        if (!s) return false
        return s.state === 'paused'
      },
      get playState(): AnimationPlayState {
        const s = sessionRef.current
        if (!s) return finishedRef.current ? 'finished' : 'idle'
        switch (s.state) {
          case 'queued':
            return 'queued'
          case 'delaying':
          case 'running':
            return 'running'
          case 'paused':
            return 'paused'
          case 'finished':
            return 'finished'
          case 'idle':
          default:
            return 'idle'
        }
      },
      get finished() {
        return finishedRef.current
      },
    }),
    [play, pause, cancel],
  )

  // ---- Build AnimatedProps ----
  const animatedProps: AnimatedProps = useMemo(
    () => ({
      __animationObjectId: animObjectId,
      __animatedFields: animatedFields,
      get __animating() {
        const s = sessionRef.current
        return s !== null && s.state !== 'idle'
      },
    }),
    [animObjectId, animatedFields],
  )

  // ---- Bind / unbind lifecycle (called by useEntity) ----
  // Store bind/unbind functions on the animatedProps object for the entity layer to call.
  ;(animatedProps as AnimatedPropsInternal).__bind = (
    entity: SpatialEntity,
  ) => {
    entityRef.current = entity

    // Check for multi-entity binding
    const existingId = _boundAnimations.get(animatedProps)
    if (existingId && existingId !== entity.id) {
      throw new Error(
        '[useEntityAnimation] The same animation object must not be bound to multiple entities.',
      )
    }
    _boundAnimations.set(animatedProps, entity.id)

    // If there's a queued session, execute it now
    const session = sessionRef.current
    if (session && session.state === 'queued') {
      enqueueCommand(async () => {
        if (session !== sessionRef.current || session.unmounted) return
        await doPlay(session, entity)
      })
    }
  }
  ;(animatedProps as AnimatedPropsInternal).__unbind = () => {
    const entity = entityRef.current
    const session = sessionRef.current

    if (session && entity) {
      session.unmounted = true
      if (session.state !== 'idle' && session.state !== 'queued') {
        // Fire and forget stop to native
        entity
          .animateTransform({
            animationId: session.animationId,
            type: 'cancel',
          })
          .catch(() => {})
        entity.cleanupAnimationListeners(session.animationId)
      }
      sessionRef.current = null
    }

    _boundAnimations.delete(animatedProps)
    entityRef.current = null
  }

  // Expose a getter for the entity layer to read suppressed fields
  ;(animatedProps as AnimatedPropsInternal).__getSuppressedFields = ():
    | readonly ('position' | 'rotation' | 'scale')[]
    | null => {
    const session = sessionRef.current
    if (!session || session.state === 'idle') return null
    return session.fields
  }

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

  // ---- Auto-start logic ----
  useEffect(() => {
    if (!active) return
    const autoStart = config.autoStart !== false
    if (autoStart && !sessionRef.current) {
      play()
    }
  }, [active]) // only on mount

  return [animatedProps, api]
}
