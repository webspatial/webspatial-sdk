import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SpatialEntity, supports, composeSRT } from '@webspatial/core-sdk'
import type {
  AnimationConfig,
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

type SessionState = 'idle' | 'queued' | 'delaying' | 'running' | 'paused'

interface AnimationSession {
  animationId: string
  state: SessionState
  /** Transform fields controlled by this session. */
  fields: readonly ('position' | 'rotation' | 'scale')[]
  /** The config snapshot used for this session. */
  config: AnimationConfig
  /** Result from core animateTransform (play). */
  result?: AnimateTransformResult & { failed?: Promise<AnimationError> }
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
 * `useAnimation` hook — the primary public API for entity transform animation.
 *
 * Returns `[AnimatedProps, AnimationApi]`. Pass `AnimatedProps` to the
 * entity's `animation` prop. Use `AnimationApi` to control playback.
 */
export function useAnimation(
  config: AnimationConfig,
): [AnimatedProps, AnimationApi] {
  // Validate config eagerly (throws on invalid)
  validateAnimationConfig(config)

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
  const warnedRef = useRef(false)

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
      console.error('[useAnimation] Animation error:', error)
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
      const animatedFields = session.fields

      // Build the command
      const cmd: AnimateTransformCommand = {
        animationId: session.animationId,
        type: 'play',
        entityId: entity.id,
        duration: cfg.duration ?? 0.3,
        timingFunction: cfg.timingFunction ?? 'easeInOut',
        delay: cfg.delay ?? 0,
        loop: cfg.loop,
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
        session.result = result as AnimateTransformResult & {
          failed?: Promise<AnimationError>
        }

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
          session.state = 'idle'
          sessionRef.current = null
          if (!session.unmounted && cfg.onComplete) {
            cfg.onComplete(values)
          }
        })

        result.stopped.then((values: TransformValues) => {
          if (sessionRef.current !== session || session.unmounted) return
          session.state = 'idle'
          sessionRef.current = null
          if (!session.unmounted && cfg.onStop) {
            cfg.onStop(values)
          }
        })

        // Listen for failed event
        if ((result as any).failed) {
          ;(result as any).failed.then((error: AnimationError) => {
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

  // ---- Core: stop session ----
  const doStop = useCallback(
    async (session: AnimationSession, entity: SpatialEntity) => {
      if (session.state === 'queued') {
        // Not yet sent to native, just cancel
        session.state = 'idle'
        return
      }

      try {
        await entity.animateTransform({
          animationId: session.animationId,
          type: 'stop',
        })
      } catch (err: any) {
        reportError({
          animationId: session.animationId,
          command: 'stop',
          reason: err?.message ?? String(err),
        })
        throw err // propagate to block start-new
      }
    },
    [reportError],
  )

  // ---- AnimationApi methods ----

  const play = useCallback(() => {
    // Unsupported runtime check
    if (!supports('useAnimation')) {
      if (!warnedRef.current) {
        warnedRef.current = true
        console.warn(
          '[useAnimation] Entity transform animation is not supported in the current runtime.',
        )
      }
      return
    }

    const cfg = configRef.current
    const entity = entityRef.current
    const prevSession = sessionRef.current

    const newSession: AnimationSession = {
      animationId: nextAnimationId(),
      state: entity ? 'running' : 'queued',
      fields: getAnimatedFields(cfg),
      config: { ...cfg },
    }

    enqueueCommand(async () => {
      if (unmountedRef.current) return

      // Stop previous session first
      if (prevSession && prevSession.state !== 'idle') {
        try {
          if (entity) {
            await doStop(prevSession, entity)
          }
          prevSession.state = 'idle'
          if (!prevSession.unmounted && prevSession.config.onStop) {
            // For stop-before-play, we don't have native transform values
            // The spec says onStop fires with current transform state
            prevSession.config.onStop({
              position: entity?.position,
              rotation: entity?.rotation,
              scale: entity?.scale,
            })
          }
        } catch {
          // stop-old failure blocks start-new
          return
        }
      }

      sessionRef.current = newSession

      if (entity) {
        await doPlay(newSession, entity)
      }
      // else: stays queued, will play on bind
    })
  }, [enqueueCommand, doStop, doPlay])

  const pause = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.state === 'idle') return
    const entity = entityRef.current

    if (session.state === 'queued') {
      session.queuedPause = true
      session.state = 'paused'
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
      } catch (err: any) {
        reportError({
          animationId: session.animationId,
          command: 'pause',
          reason: err?.message ?? String(err),
        })
      }
    })
  }, [enqueueCommand, reportError])

  const resume = useCallback(() => {
    const session = sessionRef.current
    if (!session || session.state !== 'paused') return
    const entity = entityRef.current

    if (session.queuedPause) {
      // Was paused while queued — undo the queued pause
      session.queuedPause = false
      session.state = 'queued'
      return
    }

    enqueueCommand(async () => {
      if (!entity || session !== sessionRef.current || session.unmounted) return
      if (session.state !== 'paused') return

      try {
        await entity.animateTransform({
          animationId: session.animationId,
          type: 'resume',
        })
        session.state = 'running'
      } catch (err: any) {
        reportError({
          animationId: session.animationId,
          command: 'resume',
          reason: err?.message ?? String(err),
        })
      }
    })
  }, [enqueueCommand, reportError])

  const stop = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.state === 'idle') return
    const entity = entityRef.current

    if (session.state === 'queued') {
      session.state = 'idle'
      sessionRef.current = null
      if (session.config.onStop) {
        session.config.onStop({
          position: entity?.position,
          rotation: entity?.rotation,
          scale: entity?.scale,
        })
      }
      return
    }

    enqueueCommand(async () => {
      if (!entity || session !== sessionRef.current || session.unmounted) return
      if (session.state === 'idle') return

      try {
        await doStop(session, entity)
        session.state = 'idle'
        sessionRef.current = null
        // onStop will be triggered by the stopped promise in doPlay
      } catch {
        // error already reported in doStop
      }
    })
  }, [enqueueCommand, doStop])

  // ---- Build AnimationApi ----
  const api: AnimationApi = useMemo(
    () => ({
      play,
      pause,
      resume,
      stop,
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
    }),
    [play, pause, resume, stop],
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
  ;(animatedProps as any).__bind = (entity: SpatialEntity) => {
    entityRef.current = entity

    // Check for multi-entity binding
    const existingId = _boundAnimations.get(animatedProps)
    if (existingId && existingId !== entity.id) {
      throw new Error(
        '[useAnimation] The same animation object must not be bound to multiple entities.',
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
  ;(animatedProps as any).__unbind = () => {
    const entity = entityRef.current
    const session = sessionRef.current

    if (session && entity) {
      session.unmounted = true
      if (session.state !== 'idle' && session.state !== 'queued') {
        // Fire and forget stop to native
        entity
          .animateTransform({
            animationId: session.animationId,
            type: 'stop',
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
  ;(animatedProps as any).__getSuppressedFields = ():
    | readonly ('position' | 'rotation' | 'scale')[]
    | null => {
    const session = sessionRef.current
    if (!session || session.state === 'idle') return null
    return session.fields
  }

  // ---- Cleanup on unmount ----
  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      const session = sessionRef.current
      if (session) {
        session.unmounted = true
      }
    }
  }, [])

  // ---- Auto-start logic ----
  useEffect(() => {
    const autoStart = config.autoStart !== false
    if (autoStart && !sessionRef.current) {
      play()
    }
  }, []) // only on mount

  return [animatedProps, api]
}
