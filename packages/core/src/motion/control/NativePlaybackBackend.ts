import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from '../../types/spatializedElementMotion'
import type {
  SpatializedMotionConfig,
  SpatializedMotionKind,
  SpatializedMotionPlayState,
  SpatializedMotionTimeline,
} from '../../types/spatializedMotion'
import type { SpatializedPlaybackError } from '../../types/spatializedPlayback'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'
import { motionTimeSec } from '../compute/timing'
import { MOTION_KIND_POLICIES } from './motionKindPolicy'
import { removeMotionEventReceivers } from '../native/motionEventReceivers'
import { motionConfigToNativeTimeline } from '../native/serializeMotionTimeline'
import type { MotionHost } from './MotionHost'
import type { PlaybackBackend } from './PlaybackBackend'

type MotionAnimatePlayResult = AnimateSpatializedElementMotionResult

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

/**
 * Mutable native playback session tracked across async commands.
 */
interface NativeSession {
  animationId: string
  state: SessionState
  config: SpatializedMotionConfig
  result?: MotionAnimatePlayResult
  queuedPause?: boolean
  unmounted?: boolean
}

/**
 * Collaboration surface the native backend needs from its owning controller.
 * Injected so the backend never imports the controller or the web backend.
 */
export interface NativeBackendContext {
  getConfig(): SpatializedMotionConfig
  getKind(): SpatializedMotionKind | null
  getElement(): MotionHost | null
  isNativeCapable(): boolean
  isDestroyed(): boolean
  emitValues(values: SpatializedVisualValues): void
  notifyStateChange(): void
  clearPendingPlay(): void
}

const CONTROLLER_LABEL = 'SpatializedMotionController'

let _sessionCounter = 0
/**
 * Allocates unique ids for native animation sessions.
 *
 * @param prefix Session id prefix for the resolved motion kind.
 * @returns A unique animation session id.
 */
function nextAnimationId(prefix: string): string {
  return `${prefix}${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Maps a resolved motion kind to its native session id namespace.
 *
 * @param kind Motion kind selected by the controller.
 * @returns The session id prefix for that kind.
 */
function sessionIdPrefix(kind: SpatializedMotionKind | null): string {
  switch (kind) {
    case 'static3d':
      return MOTION_KIND_POLICIES.static3d.sessionIdPrefix
    case 'dynamic3d':
      return MOTION_KIND_POLICIES.dynamic3d.sessionIdPrefix
    case 'spatialized2d':
    default:
      return MOTION_KIND_POLICIES.spatialized2d.sessionIdPrefix
  }
}

/**
 * Native-session playback strategy.
 *
 * Owns the asynchronous native command queue and the session state machine
 * (idle/queued/running/paused/finished) that previously lived inline in
 * {@link SpatializedMotionController}, plus direct timeline sampling for
 * fallback visual updates.
 */
export class NativePlaybackBackend implements PlaybackBackend {
  private session: NativeSession | null = null
  private nativePlayToken = 0
  private playStartWallMs = 0
  private nativePausedElapsedMs = 0
  private commandQueue: Promise<void> = Promise.resolve()
  private warnedNative = false
  private warnedQueued = false
  /** Set when finish() is invoked with no active session (idle terminal). */
  private idleFinished = false

  constructor(private readonly ctx: NativeBackendContext) {}

  get playState(): SpatializedMotionPlayState {
    const s = this.session?.state
    if (s === 'queued') return 'running'
    if (s && s !== 'idle') return s
    if (this.idleFinished) return 'finished'
    return 'idle'
  }

  get isAnimating(): boolean {
    const s = this.session?.state
    return s === 'running' || s === 'queued'
  }

  get isPaused(): boolean {
    return this.session?.state === 'paused'
  }

  get finished(): boolean {
    if (this.session?.state === 'finished') return true
    return !this.session && this.idleFinished
  }

  /** Fields to suppress on the Portal while the native session drives playback. */
  getSuppressedFields(): Set<string> | null {
    const s = this.session?.state
    if (s !== 'running' && s !== 'paused') return null
    const kind = this.ctx.getKind()
    if (!kind) return null
    const cfg = this.ctx.getConfig()
    return MOTION_KIND_POLICIES[kind].getSuppressedFields(cfg)
  }

  /** Cancel any active session and release native wiring. */
  destroy(): void {
    this.detach({ cancelSession: true })
  }

  play(): void {
    this.idleFinished = false
    const sessionState = this.session?.state
    if (
      !sessionState ||
      sessionState === 'idle' ||
      sessionState === 'finished'
    ) {
      const token = ++this.nativePlayToken
      this.enqueue(() => this.nativePlay(token))
      return
    }
    this.enqueue(() => this.nativePlay())
  }

  pause(): void {
    const ns = this.session?.state
    if (ns === 'running' || ns === 'queued') {
      this.enqueue(() => this.nativePause())
    }
  }

  resume(): void {
    if (this.session?.state === 'paused') {
      this.enqueue(() => this.nativeResume())
    }
  }

  stop(): void {
    const ns = this.session?.state
    if (ns && ns !== 'idle' && ns !== 'finished') {
      this.enqueue(() => this.nativeStop())
      return
    }
    this.nativePlayToken++
  }

  reset(): void {
    this.enqueue(() => this.nativeSeekTerminal('reset'))
  }

  finish(): void {
    this.enqueue(() => this.nativeSeekTerminal('finish'))
  }

  detach(opts: { cancelSession: boolean }): void {
    const session = this.session
    const element = this.ctx.getElement()
    const kind = this.ctx.getKind()
    if (kind && opts.cancelSession && session && element) {
      if (session.state !== 'idle' && session.state !== 'finished') {
        ;(
          this.nativeElementCommand(element, {
            animationId: session.animationId,
            type: 'cancel',
          } as any) as Promise<void>
        ).catch(() => {})
        this.cleanupNativeListeners(session.animationId)
        session.unmounted = true
        session.state = 'idle'
      }
    }
    this.session = null
    this.nativePlayToken++
    this.ctx.clearPendingPlay()
    this.ctx.notifyStateChange()
  }

  /**
   * Serializes native commands so session transitions stay ordered.
   *
   * @param fn Async native command to enqueue.
   */
  private enqueue(fn: () => Promise<void>): void {
    this.commandQueue = this.commandQueue.then(fn, fn)
  }

  /**
   * Builds the canonical native play payload for a session.
   *
   * @param session Native playback session being started.
   * @param elementId Host element id for the play command.
   * @returns The native play command payload.
   */
  private buildPlayCommand(
    session: NativeSession,
    elementId: string,
  ): (ElementMotionCommand & { type: 'play' }) | null {
    const cfg = session.config
    const timeline: SpatializedMotionTimeline =
      motionConfigToNativeTimeline(cfg)
    return {
      animationId: session.animationId,
      type: 'play' as const,
      elementId,
      timeline,
    }
  }

  /**
   * Routes native playback failures into the public motion error channel.
   *
   * @param error Normalized native playback failure payload.
   */
  private reportNativeError(error: {
    animationId: string
    command: string
    reason: string
  }): void {
    if (this.ctx.isDestroyed()) return
    const cfg = this.ctx.getConfig()
    if (cfg.onError) {
      cfg.onError(error as SpatializedPlaybackError)
    } else {
      console.error(`[${CONTROLLER_LABEL}] Native error:`, error)
    }
  }

  /** Issue a native `play` command, tagging the controller's target kind. */
  private nativeElementPlay(
    element: MotionHost,
    command: ElementMotionCommand & { type: 'play' },
  ): Promise<MotionAnimatePlayResult> {
    return element.animateMotion({
      ...command,
      targetKind: this.ctx.getKind() as SpatializedMotionKind,
    } as AnimateSpatializedElementMotionCommand & {
      type: 'play'
    }) as Promise<MotionAnimatePlayResult>
  }

  /** Issue a native session command (pause/resume/reset/stop/finish/cancel). */
  private async nativeElementCommand(
    element: MotionHost,
    command: ElementMotionCommand,
  ): Promise<SpatializedVisualValues | void> {
    return (await element.animateMotion({
      ...command,
      targetKind: this.ctx.getKind() as SpatializedMotionKind,
    })) as SpatializedVisualValues | void
  }

  /** Remove native event receivers registered for a session's terminal events. */
  private cleanupNativeListeners(animationId: string): void {
    removeMotionEventReceivers(animationId)
  }

  private async doNativePlay(
    session: NativeSession,
    element: MotionHost,
  ): Promise<void> {
    if (!this.ctx.getKind()) return
    const cmd = this.buildPlayCommand(session, element.id)
    if (!cmd) return

    try {
      const result = await this.nativeElementPlay(element, cmd)
      if (this.ctx.isDestroyed() || session.unmounted) return

      session.result = result
      result.finished.then(finalValues => {
        if (this.ctx.isDestroyed() || session.unmounted) return
        if (this.session !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'finished'
        this.ctx.notifyStateChange()
        this.ctx.getConfig().onComplete?.(finalValues)
        this.ctx.emitValues(finalValues)
      })

      result.canceled.then(currentValues => {
        if (this.ctx.isDestroyed() || session.unmounted) return
        if (this.session !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'idle'
        this.session = null
        this.ctx.notifyStateChange()
        this.ctx.getConfig().onReset?.(currentValues)
        this.ctx.emitValues(currentValues)
      })

      result.failed.then(error => {
        if (this.ctx.isDestroyed() || session.unmounted) return
        if (this.session !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'idle'
        this.session = null
        this.ctx.notifyStateChange()
        this.reportNativeError(error)
      })

      if (session.queuedPause) {
        session.state = 'paused'
        session.queuedPause = false
        await this.nativeElementCommand(element, {
          animationId: session.animationId,
          type: 'pause',
        })
        this.nativePausedElapsedMs = 0
        this.syncNativeStyleAtElapsed(0)
      } else {
        session.state = 'running'
        this.playStartWallMs = performance.now()
      }

      this.ctx.notifyStateChange()
      this.ctx.getConfig().onStart?.()
    } catch (e: unknown) {
      if (this.ctx.isDestroyed() || session.unmounted) return
      session.state = 'idle'
      this.session = null
      this.ctx.notifyStateChange()
      this.reportNativeError({
        animationId: session.animationId,
        command: 'play',
        reason: e instanceof Error ? e.message : 'Play failed',
      })
    }
  }

  /**
   * Samples JS-side visual values for pause/stop/reset fallbacks.
   *
   * @param elapsedMs Elapsed wall-clock time in milliseconds.
   */
  private syncNativeStyleAtElapsed(elapsedMs: number): void {
    const cfg = this.ctx.getConfig()
    const t = motionTimeSec(elapsedMs, cfg)
    this.ctx.emitValues(evaluateMotionTimeline(cfg, t))
  }

  /**
   * Starts or resumes the current native session when possible.
   *
   * @param expectedToken Optional play token used to ignore stale queued play requests.
   */
  private async nativePlay(expectedToken?: number): Promise<void> {
    const kind = this.ctx.getKind()
    if (!kind) return
    if (!this.ctx.isNativeCapable()) {
      if (!this.warnedNative) {
        this.warnedNative = true
        console.warn(
          `[${CONTROLLER_LABEL}] Native motion requires supports(useAnimation, ['${kind === 'spatialized2d' ? 'element' : kind}']).`,
        )
      }
      return
    }

    if (expectedToken !== undefined && expectedToken !== this.nativePlayToken) {
      return
    }

    const current = this.session
    if (current && current.state === 'paused') {
      const element = this.ctx.getElement()
      if (!element) return
      try {
        await this.nativeElementCommand(element, {
          animationId: current.animationId,
          type: 'resume',
        })
        current.state = 'running'
        this.playStartWallMs = performance.now() - this.nativePausedElapsedMs
        this.ctx.notifyStateChange()
      } catch (e: unknown) {
        this.reportNativeError({
          animationId: current.animationId,
          command: 'resume',
          reason: e instanceof Error ? e.message : 'Resume failed',
        })
      }
      return
    }

    if (
      current &&
      (current.state === 'running' || current.state === 'queued')
    ) {
      return
    }

    const session: NativeSession = {
      animationId: nextAnimationId(sessionIdPrefix(kind)),
      state: 'idle',
      config: this.ctx.getConfig(),
    }
    this.session = session

    const element = this.ctx.getElement()
    if (!element) {
      session.state = 'queued'
      if (!this.warnedQueued) {
        this.warnedQueued = true
        console.warn(
          `[${CONTROLLER_LABEL}] Native play is queued until attachElement / motion bind.`,
        )
      }
      this.ctx.notifyStateChange()
      return
    }

    await this.doNativePlay(session, element)
  }

  /**
   * Pauses the native session and syncs the current sampled values.
   */
  private async nativePause(): Promise<void> {
    if (!this.ctx.getKind()) return
    const session = this.session
    if (!session) return

    if (session.state === 'queued') {
      session.queuedPause = true
      session.state = 'paused'
      this.nativePausedElapsedMs = 0
      this.syncNativeStyleAtElapsed(0)
      this.ctx.notifyStateChange()
      return
    }

    if (session.state !== 'running') return

    const element = this.ctx.getElement()
    if (!element) return
    try {
      const values = await this.nativeElementCommand(element, {
        animationId: session.animationId,
        type: 'pause',
      })
      this.nativePausedElapsedMs = performance.now() - this.playStartWallMs
      session.state = 'paused'
      if (values) {
        this.ctx.emitValues(values)
      } else {
        this.syncNativeStyleAtElapsed(this.nativePausedElapsedMs)
      }
      this.ctx.notifyStateChange()
    } catch (e: unknown) {
      this.reportNativeError({
        animationId: session.animationId,
        command: 'pause',
        reason: e instanceof Error ? e.message : 'Pause failed',
      })
    }
  }

  /**
   * Resumes the current native session via the play path.
   */
  private async nativeResume(): Promise<void> {
    await this.nativePlay()
  }

  /**
   * Stops the native session and publishes the current values.
   */
  private async nativeStop(): Promise<void> {
    if (!this.ctx.getKind()) return
    const session = this.session
    if (!session || session.state === 'idle' || session.state === 'finished')
      return

    const currentValues = evaluateMotionTimeline(
      session.config,
      motionTimeSec(
        session.state === 'queued'
          ? 0
          : this.nativePausedElapsedMs > 0
            ? this.nativePausedElapsedMs
            : performance.now() - this.playStartWallMs,
        session.config,
      ),
    )

    const element = this.ctx.getElement()
    if (!element) {
      session.state = 'idle'
      this.session = null
      this.ctx.notifyStateChange()
      this.ctx.emitValues(currentValues)
      this.ctx.getConfig().onStop?.(currentValues)
      return
    }

    try {
      const values = await this.nativeElementCommand(element, {
        animationId: session.animationId,
        type: 'stop',
      })
      session.state = 'idle'
      this.session = null
      this.ctx.notifyStateChange()
      const output = values ?? currentValues
      this.ctx.emitValues(output)
      this.ctx.getConfig().onStop?.(output)
    } catch {
      session.state = 'idle'
      this.session = null
      this.ctx.notifyStateChange()
      this.ctx.emitValues(currentValues)
      this.ctx.getConfig().onStop?.(currentValues)
    }
  }

  /**
   * Seeks the current or transient native motion state to a terminal edge.
   */
  private async nativeSeekTerminal(mode: 'reset' | 'finish'): Promise<void> {
    const kind = this.ctx.getKind()
    if (!kind) return

    const cfg = this.ctx.getConfig()
    const terminalState = mode === 'reset' ? 'idle' : 'finished'
    const session = this.session
    const activeSession =
      !!session && session.state !== 'idle' && session.state !== 'finished'
    const sessionConfig = session?.config ?? cfg
    const terminalTime = mode === 'reset' ? 0 : sessionConfig.duration
    const fallbackValues = evaluateMotionTimeline(sessionConfig, terminalTime)
    const element = this.ctx.getElement()

    this.nativePlayToken++
    this.ctx.clearPendingPlay()

    const finalize = (values: SpatializedVisualValues): void => {
      // Terminal seek short-circuits the native session, so the play listeners
      // must be removed here because no terminal event will fire to clean them up.
      if (session && activeSession) {
        this.cleanupNativeListeners(session.animationId)
      }
      this.idleFinished = mode === 'finish'
      if (session && activeSession && this.session === session) {
        session.state = terminalState
        this.session = null
      } else {
        if (session) {
          this.session = null
        }
      }
      this.ctx.notifyStateChange()
      this.ctx.emitValues(values)
      if (mode === 'reset') {
        cfg.onReset?.(values)
      } else {
        cfg.onComplete?.(values)
      }
    }

    if (activeSession && element && this.ctx.isNativeCapable()) {
      try {
        const values = await this.nativeElementCommand(element, {
          animationId: session!.animationId,
          type: mode,
        })
        finalize(values ?? fallbackValues)
        return
      } catch {
        // Fall through to the JS evaluator.
      }
    }

    if (!activeSession && element && this.ctx.isNativeCapable()) {
      try {
        const values = await this.nativeElementCommand(element, {
          animationId: nextAnimationId(sessionIdPrefix(kind)),
          type: mode,
          elementId: element.id,
          timeline: motionConfigToNativeTimeline(sessionConfig),
        })
        finalize(values ?? fallbackValues)
        return
      } catch {
        // Fall through to the JS evaluator.
      }
    }

    finalize(fallbackValues)
  }
}
