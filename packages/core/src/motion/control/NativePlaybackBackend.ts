import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from '../../types/spatializedElementMotion'
import type {
  SpatializedMotionConfig,
  SpatializedMotionKind,
  SpatializedMotionPlayState,
  SpatializedMotionProperty,
  SpatializedMotionPropertyKeys,
  SpatializedMotionTimeline,
} from '../../types/spatializedMotion'
import type { SpatializedPlaybackError } from '../../types/spatializedPlayback'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'
import { motionConfigToNativeTimeline } from '../compute/nativeTimeline'
import { motionTimeSec } from '../compute/timing'
import { normalizeMotionPropertyKeys } from '../compute/propertyKeys'
import { MOTION_KIND_POLICIES } from './motionKindPolicy'
import { removeMotionEventReceivers } from '../native/motionEventReceivers'
import type { MotionHost } from './MotionHost'
import type { PlaybackBackend } from './PlaybackBackend'
import type { Sampler } from './Sampler'

type MotionAnimatePlayResult = AnimateSpatializedElementMotionResult

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

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
 * The `stopWeb` / `jsReset` / `jsFinish` callbacks let the controller route the
 * JS-side fallback (no active native session) without the native backend
 * depending on {@link WebPlaybackBackend}.
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
  /** Stop any in-flight web raf playback before native takes over. */
  stopWeb(): void
  /** JS-side reset fallback when no native session is active. */
  jsReset(): void
  /** JS-side finish fallback when no native session is active. */
  jsFinish(): void
}

const CONTROLLER_LABEL = 'SpatializedMotionController'

let _sessionCounter = 0
function nextAnimationId(prefix: string): string {
  return `${prefix}${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

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
 * {@link SpatializedMotionController}. Visual sampling for stop is delegated to
 * the shared {@link Sampler}, so this backend never borrows from the web one.
 */
export class NativePlaybackBackend implements PlaybackBackend {
  private session: NativeSession | null = null
  private nativeControlling = false
  private nativePlayToken = 0
  private playStartWallMs = 0
  private nativePausedElapsedMs = 0
  private commandQueue: Promise<void> = Promise.resolve()
  private warnedNative = false
  private warnedQueued = false

  constructor(
    private readonly ctx: NativeBackendContext,
    private readonly sampler: Sampler,
  ) {}

  get playState(): SpatializedMotionPlayState {
    const s = this.session?.state
    if (s === 'queued') return 'running'
    if (s && s !== 'idle') return s
    return 'idle'
  }

  get sessionState(): SessionState | undefined {
    return this.session?.state
  }

  get controlling(): boolean {
    return this.nativeControlling
  }

  get sessionAnimating(): boolean {
    const s = this.session?.state
    return s ? ['running', 'paused', 'queued'].includes(s) : false
  }

  /** Bump the play token without starting playback (used by idle stop). */
  bumpToken(): void {
    this.nativePlayToken++
  }

  play(): void {
    this.ctx.stopWeb()
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

  pause(keys?: SpatializedMotionPropertyKeys): void {
    const ns = this.session?.state
    if (ns === 'running' || ns === 'queued') {
      this.enqueue(() => this.nativePause(keys))
    }
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    const normalized = normalizeMotionPropertyKeys(keys)
    if (this.session?.state === 'paused') {
      this.enqueue(() => this.nativeResume(normalized))
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
    const ns = this.session?.state
    if (ns && ns !== 'idle') {
      this.enqueue(() => this.nativeReset())
      return
    }
    this.nativePlayToken++
    this.ctx.jsReset()
  }

  finish(): void {
    const ns = this.session?.state
    if (ns && ns !== 'idle' && ns !== 'finished') {
      this.enqueue(() => this.nativeFinish())
      return
    }
    if (!ns || ns === 'idle') {
      this.nativePlayToken++
      this.ctx.jsFinish()
    }
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
    this.nativeControlling = false
    this.nativePlayToken++
    this.ctx.clearPendingPlay()
    this.ctx.notifyStateChange()
  }

  private enqueue(fn: () => Promise<void>): void {
    this.commandQueue = this.commandQueue.then(fn, fn)
  }

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
      this.nativeControlling = true

      result.finished.then(finalValues => {
        if (this.ctx.isDestroyed() || session.unmounted) return
        if (this.session !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'finished'
        this.nativeControlling = false
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
        this.nativeControlling = false
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
        this.nativeControlling = false
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
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      this.reportNativeError({
        animationId: session.animationId,
        command: 'play',
        reason: e instanceof Error ? e.message : 'Play failed',
      })
    }
  }

  private syncNativeStyleAtElapsed(elapsedMs: number): void {
    const cfg = this.ctx.getConfig()
    const t = motionTimeSec(elapsedMs, cfg)
    this.ctx.emitValues(evaluateMotionTimeline(cfg, t))
  }

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
        this.nativeControlling = true
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

  private async nativePause(
    keys?: SpatializedMotionPropertyKeys,
  ): Promise<void> {
    if (!this.ctx.getKind()) return
    const properties = normalizeMotionPropertyKeys(keys)
    if (properties && properties.length > 0) {
      console.warn(
        `[${CONTROLLER_LABEL}] Selective native pause is not yet supported; pausing entire session.`,
      )
    }

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
        properties: properties ?? undefined,
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

  private async nativeResume(
    _keys: SpatializedMotionProperty[] | null,
  ): Promise<void> {
    await this.nativePlay()
  }

  private async nativeReset(): Promise<void> {
    if (!this.ctx.getKind()) return
    const session = this.session
    if (!session || session.state === 'idle') return

    if (session.state === 'finished') {
      const values = evaluateMotionTimeline(session.config, 0)
      session.state = 'idle'
      this.session = null
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      this.ctx.emitValues(values)
      this.ctx.getConfig().onReset?.(values)
      return
    }

    const element = this.ctx.getElement()
    if (!element) {
      session.state = 'idle'
      this.session = null
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      const values = evaluateMotionTimeline(session.config, 0)
      this.ctx.getConfig().onReset?.(values)
      this.ctx.emitValues(values)
      return
    }

    try {
      const values = await this.nativeElementCommand(element, {
        animationId: session.animationId,
        type: 'reset',
      })
      session.state = 'idle'
      this.session = null
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      if (values) {
        this.ctx.emitValues(values)
        this.ctx.getConfig().onReset?.(values)
      } else {
        const fallback = evaluateMotionTimeline(session.config, 0)
        this.ctx.emitValues(fallback)
        this.ctx.getConfig().onReset?.(fallback)
      }
    } catch {
      session.state = 'idle'
      this.session = null
      this.nativeControlling = false
      this.ctx.notifyStateChange()
    }
  }

  private async nativeStop(): Promise<void> {
    if (!this.ctx.getKind()) return
    const session = this.session
    if (!session || session.state === 'idle' || session.state === 'finished')
      return

    const currentValues = this.sampler.sampleAt(
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
      this.nativeControlling = false
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
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      const output = values ?? currentValues
      this.ctx.emitValues(output)
      this.ctx.getConfig().onStop?.(output)
    } catch {
      session.state = 'idle'
      this.session = null
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      this.ctx.emitValues(currentValues)
      this.ctx.getConfig().onStop?.(currentValues)
    }
  }

  private async nativeFinish(): Promise<void> {
    if (!this.ctx.getKind()) return
    const session = this.session
    if (!session || session.state === 'idle' || session.state === 'finished')
      return

    const element = this.ctx.getElement()
    if (!element) {
      session.state = 'finished'
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      const values = evaluateMotionTimeline(
        session.config,
        session.config.duration,
      )
      this.ctx.emitValues(values)
      this.ctx.getConfig().onComplete?.(values)
      return
    }

    try {
      const values = await this.nativeElementCommand(element, {
        animationId: session.animationId,
        type: 'finish',
      })
      session.state = 'finished'
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      const output =
        values ??
        evaluateMotionTimeline(session.config, session.config.duration)
      this.ctx.emitValues(output)
      this.ctx.getConfig().onComplete?.(output)
    } catch {
      session.state = 'finished'
      this.nativeControlling = false
      this.ctx.notifyStateChange()
      const fallback = evaluateMotionTimeline(
        session.config,
        session.config.duration,
      )
      this.ctx.emitValues(fallback)
      this.ctx.getConfig().onComplete?.(fallback)
    }
  }
}
