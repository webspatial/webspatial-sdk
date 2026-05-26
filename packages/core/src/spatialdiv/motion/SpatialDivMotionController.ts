import type { Spatialized2DElement } from '../../Spatialized2DElement'
import { supports } from '../../runtime/supports'
import type {
  AnimateSpatialDivCommand,
  AnimateSpatialDivResult,
} from '../../types/spatialDivAnimation'
import type { SpatialDivPlaybackError } from '../../types/spatialDivPlayback'
import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type {
  SpatialDivMotionConfig,
  SpatialDivPlaybackApi,
  SpatialDivPlayState,
  SpatialDivMotionProperty,
  SpatialDivMotionPropertyKeys,
  SpatialDivMotionTimeline,
} from '../../types/spatialDivMotion'
import { evaluateMotionTimeline } from './evaluate'
import { getMotionSuppressedFields } from './getMotionSuppressedFields'
import { applyFrozenProperties, snapshotScalars } from './mergeValues'
import {
  motionConfigToNativeSegment,
  motionConfigToNativeTimeline,
  type NativeSegmentPlayPayload,
} from './nativeCompile'
import { motionTimeSec } from './motionTiming'
import { normalizeMotionPropertyKeys } from './propertyKeys'
import { validateSpatialDivMotionConfig } from './validate'

export interface SpatialDivMotionControllerOptions {
  /** Initial element; may be set later via {@link attachElement}. */
  element?: Spatialized2DElement | null
  /**
   * When set, overrides `supports('useAnimation', ['element'])` for backend selection.
   * React passes the SDK `supports()` result so test mocks apply.
   */
  forceNativePlayback?: boolean
  /** Fired when sampled values should update a style outlet. */
  onValuesChange?: (values: SpatialDivVisualValues) => void
  /** Fired when {@link playState} changes (e.g. React re-render). */
  onStateChange?: () => void
}

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

interface NativeSession {
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

/**
 * Runtime controller for a SpatialDiv motion timeline on one element.
 * Implements react-spring-style selective `pause(['opacity'])` on the Web backend.
 */
export class SpatialDivMotionController implements SpatialDivPlaybackApi {
  readonly id: string

  private config: SpatialDivMotionConfig
  private element: Spatialized2DElement | null
  private readonly onValuesChange?: (values: SpatialDivVisualValues) => void
  private readonly onStateChange?: () => void

  private webState: SpatialDivPlayState = 'idle'
  private webFinished = false
  private webStarted = false
  private rafId: number | null = null
  private startWallMs = 0
  private pausedElapsedMs = 0
  /** Full timeline pause (clock stopped). */
  private fullPause = false
  /** Per-property freeze while clock may still run. */
  private readonly frozenByProperty = new Map<
    SpatialDivMotionProperty,
    SpatialDivVisualValues
  >()

  private nativeSession: NativeSession | null = null
  private nativeControlling = false
  private playStartWallMs = 0
  private nativePausedElapsedMs = 0
  private commandQueue: Promise<void> = Promise.resolve()
  private warnedNative = false
  private warnedQueued = false
  private destroyed = false
  private readonly forceNativePlayback?: boolean

  constructor(
    config: SpatialDivMotionConfig,
    options: SpatialDivMotionControllerOptions = {},
  ) {
    validateSpatialDivMotionConfig(config)
    this.config = config
    this.id = nextMotionObjectId()
    this.element = options.element ?? null
    this.forceNativePlayback = options.forceNativePlayback
    this.onValuesChange = options.onValuesChange
    this.onStateChange = options.onStateChange
    this.emitValues(evaluateMotionTimeline(config, 0))
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  get definition(): SpatialDivMotionConfig {
    return this.config
  }

  updateDefinition(config: SpatialDivMotionConfig): void {
    validateSpatialDivMotionConfig(config)
    this.config = config
  }

  attachElement(element: Spatialized2DElement | null): void {
    this.element = element
    if (!element) return

    const session = this.nativeSession
    if (
      session &&
      (session.state === 'queued' ||
        (session.state === 'paused' && session.queuedPause))
    ) {
      void this.doNativePlay(session, element)
      return
    }

    if (this.config.autoStart !== false && !this.nativeSession) {
      this.play()
    }
  }

  destroy(): void {
    this.destroyed = true
    this.stopWebRaf()
    this.detachNative({ cancelSession: true })
  }

  get playState(): SpatialDivPlayState {
    if (this.nativeCapable) {
      const s = this.nativeSession?.state
      if (s === 'queued') return 'running'
      if (s && s !== 'idle') return s
    }
    return this.webState
  }

  get isAnimating(): boolean {
    if (this.nativeCapable) {
      const s = this.nativeSession?.state
      if (s === 'running' || s === 'queued') return true
    }
    return this.webState === 'running'
  }

  get isPaused(): boolean {
    if (this.nativeCapable && this.nativeSession?.state === 'paused') {
      return true
    }
    return (
      this.webState === 'paused' ||
      (this.webState === 'running' && this.frozenByProperty.size > 0)
    )
  }

  get finished(): boolean {
    if (this.nativeCapable && this.nativeSession?.state === 'finished') {
      return true
    }
    return this.webFinished
  }

  /** Fields to suppress on the Portal while native drives playback. */
  getSuppressedFields(): Set<string> | null {
    const s = this.nativeSession?.state
    if (!s || (s !== 'running' && s !== 'paused')) return null
    const active = this.getActiveProperties()
    const subset = this.config.tracks.filter(t => active.includes(t.property))
    if (subset.length === 0) return null
    return getMotionSuppressedFields({ ...this.config, tracks: subset })
  }

  play(): void {
    if (this.nativeCapable) {
      this.stopWebRaf()
      this.enqueueNative(() => this.nativePlay())
      return
    }
    this.webPlay()
  }

  pause(keys?: SpatialDivMotionPropertyKeys): void {
    if (this.nativeCapable) {
      const ns = this.nativeSession?.state
      if (ns === 'running' || ns === 'queued') {
        this.enqueueNative(() => this.nativePause(keys))
        return
      }
    }
    this.webPause(keys)
  }

  resume(keys?: SpatialDivMotionPropertyKeys): void {
    const normalized = normalizeMotionPropertyKeys(keys)
    if (this.nativeCapable) {
      if (this.nativeSession?.state === 'paused') {
        this.enqueueNative(() => this.nativeResume(normalized))
        return
      }
    }
    this.webResume(normalized)
  }

  cancel(keys?: SpatialDivMotionPropertyKeys): void {
    const normalized = normalizeMotionPropertyKeys(keys)
    if (normalized && normalized.length > 0) {
      console.warn(
        '[SpatialDivMotionController] cancel(keys) is not supported; canceling entire session.',
      )
    }
    if (this.nativeCapable) {
      const ns = this.nativeSession?.state
      if (ns && ns !== 'idle' && ns !== 'finished') {
        this.enqueueNative(() => this.nativeCancel())
        return
      }
    }
    this.webCancel()
  }

  private get nativeCapable(): boolean {
    if (this.forceNativePlayback !== undefined) {
      return this.forceNativePlayback
    }
    return supports('useAnimation', ['element'])
  }

  private bump(): void {
    this.onStateChange?.()
  }

  private emitValues(values: SpatialDivVisualValues): void {
    this.onValuesChange?.(values)
  }

  private getActiveProperties(): SpatialDivMotionProperty[] {
    const all = this.config.tracks.map(t => t.property)
    if (this.frozenByProperty.size === 0) return all
    return all.filter(p => !this.frozenByProperty.has(p))
  }

  private sampleAt(timeSec: number): SpatialDivVisualValues {
    let values = evaluateMotionTimeline(this.config, timeSec)
    for (const property of this.frozenByProperty.keys()) {
      const snap = this.frozenByProperty.get(property)!
      values = applyFrozenProperties(values, snap, [property])
    }
    return values
  }

  private stopWebRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private webPlay(): void {
    if (this.webState === 'running' && !this.fullPause) return

    if (this.webState === 'paused' || this.fullPause) {
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.fullPause = false
      this.webState = 'running'
      this.bump()
      this.scheduleWebFrame()
      return
    }

    if (this.webState === 'finished') {
      this.webFinished = false
    }

    if (!this.webStarted) {
      this.webStarted = true
      this.config.onStart?.()
    }

    this.startWallMs = performance.now()
    this.pausedElapsedMs = 0
    this.fullPause = false
    this.webState = 'running'
    this.bump()
    this.stopWebRaf()
    this.scheduleWebFrame()
  }

  private webPause(keys?: SpatialDivMotionPropertyKeys): void {
    const normalized = normalizeMotionPropertyKeys(keys)

    if (normalized === null) {
      if (this.webState !== 'running') return
      this.pausedElapsedMs = performance.now() - this.startWallMs
      this.fullPause = true
      this.webState = 'paused'
      this.stopWebRaf()
      this.emitValues(
        this.sampleAt(motionTimeSec(this.pausedElapsedMs, this.config)),
      )
      this.bump()
      return
    }

    if (this.webState !== 'running' && this.webState !== 'paused') return
    const t =
      this.webState === 'paused' && this.fullPause
        ? motionTimeSec(this.pausedElapsedMs, this.config)
        : motionTimeSec(performance.now() - this.startWallMs, this.config)
    const current = this.sampleAt(t)
    for (const property of normalized) {
      this.frozenByProperty.set(property, snapshotScalars(current, [property]))
    }
    if (this.webState === 'paused' && this.fullPause) {
      this.fullPause = false
      this.webState = 'running'
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.scheduleWebFrame()
    }
    this.emitValues(this.sampleAt(t))
    this.bump()
  }

  private webResume(keys: SpatialDivMotionProperty[] | null): void {
    if (keys === null) {
      if (this.webState === 'paused' && this.fullPause) {
        this.webPlay()
        return
      }
      if (this.frozenByProperty.size > 0) {
        this.frozenByProperty.clear()
        this.bump()
        if (this.webState === 'running') this.scheduleWebFrame()
      }
      return
    }

    for (const property of keys) {
      this.frozenByProperty.delete(property)
    }
    this.bump()
    if (this.webState === 'running') this.scheduleWebFrame()
    else if (this.webState === 'paused' && this.fullPause) this.webPlay()
  }

  private webCancel(): void {
    if (this.webState === 'idle') return
    this.stopWebRaf()
    this.frozenByProperty.clear()
    this.fullPause = false
    const values = evaluateMotionTimeline(this.config, 0)
    this.emitValues(values)
    this.webState = 'idle'
    this.webFinished = false
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.bump()
    this.config.onCancel?.(values)
  }

  private scheduleWebFrame(): void {
    this.stopWebRaf()
    this.rafId = requestAnimationFrame(() => this.webFrame())
  }

  private webFrame(): void {
    if (this.webState !== 'running' || this.destroyed) return

    const elapsed = performance.now() - this.startWallMs
    const t = motionTimeSec(elapsed, this.config)

    if (t >= this.config.duration) {
      const values = this.sampleAt(this.config.duration)
      this.emitValues(values)
      if (this.config.loop) {
        this.startWallMs = performance.now()
        this.pausedElapsedMs = 0
        this.emitValues(this.sampleAt(0))
        this.scheduleWebFrame()
        return
      }
      this.stopWebRaf()
      this.webState = 'finished'
      this.webFinished = true
      this.bump()
      this.config.onComplete?.(values)
      return
    }

    this.emitValues(this.sampleAt(t))
    this.scheduleWebFrame()
  }

  private enqueueNative(fn: () => Promise<void>): void {
    this.commandQueue = this.commandQueue.then(fn, fn)
  }

  private buildPlayCommand(
    session: NativeSession,
    elementId: string,
  ): (AnimateSpatialDivCommand & { type: 'play' }) | null {
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

    const timeline: SpatialDivMotionTimeline = motionConfigToNativeTimeline(cfg)
    return {
      ...base,
      timeline,
      duration: timeline.duration,
      timingFunction: 'linear',
    }
  }

  private reportNativeError(error: {
    animationId: string
    command: string
    reason: string
  }): void {
    if (this.destroyed) return
    const cfg = this.config
    if (cfg.onError) {
      cfg.onError(error as SpatialDivPlaybackError)
    } else {
      console.error('[SpatialDivMotionController] Native error:', error)
    }
  }

  private async doNativePlay(
    session: NativeSession,
    element: Spatialized2DElement,
  ): Promise<void> {
    const cmd = this.buildPlayCommand(session, element.id)
    if (!cmd) return

    try {
      const result = await element.animateSpatialDiv(cmd)
      if (this.destroyed || session.unmounted) return

      session.result = result
      this.nativeControlling = true

      result.finished.then(finalValues => {
        if (this.destroyed || session.unmounted) return
        if (this.nativeSession !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'finished'
        this.nativeControlling = false
        this.bump()
        this.config.onComplete?.(finalValues)
        this.emitValues(finalValues)
      })

      result.canceled.then(currentValues => {
        if (this.destroyed || session.unmounted) return
        if (this.nativeSession !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'idle'
        this.nativeSession = null
        this.nativeControlling = false
        this.bump()
        this.config.onCancel?.(currentValues)
        this.emitValues(currentValues)
      })

      result.failed.then(error => {
        if (this.destroyed || session.unmounted) return
        if (this.nativeSession !== session) return
        if (session.state === 'finished' || session.state === 'idle') return
        session.state = 'idle'
        this.nativeSession = null
        this.nativeControlling = false
        this.bump()
        this.reportNativeError(error)
      })

      if (session.queuedPause) {
        session.state = 'paused'
        session.queuedPause = false
        await element.animateSpatialDiv({
          animationId: session.animationId,
          type: 'pause',
        })
        this.nativePausedElapsedMs = 0
        this.syncNativeStyleAtElapsed(0)
      } else {
        session.state = 'running'
        this.playStartWallMs = performance.now()
      }

      this.bump()
      this.config.onStart?.()
    } catch (e: unknown) {
      if (this.destroyed || session.unmounted) return
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      this.reportNativeError({
        animationId: session.animationId,
        command: 'play',
        reason: e instanceof Error ? e.message : 'Play failed',
      })
    }
  }

  private syncNativeStyleAtElapsed(elapsedMs: number): void {
    const t = motionTimeSec(elapsedMs, this.config)
    this.emitValues(evaluateMotionTimeline(this.config, t))
  }

  private async nativePlay(): Promise<void> {
    if (!this.nativeCapable) {
      if (!this.warnedNative) {
        this.warnedNative = true
        console.warn(
          '[SpatialDivMotionController] Native motion requires supports(useAnimation, [element]).',
        )
      }
      return
    }

    const current = this.nativeSession
    if (current && current.state === 'paused') {
      const element = this.element
      if (!element) return
      try {
        await element.animateSpatialDiv({
          animationId: current.animationId,
          type: 'resume',
        })
        current.state = 'running'
        this.nativeControlling = true
        this.playStartWallMs = performance.now() - this.nativePausedElapsedMs
        this.bump()
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
      animationId: nextAnimationId(),
      state: 'idle',
      config: this.config,
    }
    this.nativeSession = session

    const element = this.element
    if (!element) {
      session.state = 'queued'
      if (!this.warnedQueued) {
        this.warnedQueued = true
        console.warn(
          '[SpatialDivMotionController] Native play is queued until attachElement / motion bind.',
        )
      }
      this.bump()
      return
    }

    await this.doNativePlay(session, element)
  }

  private async nativePause(
    keys?: SpatialDivMotionPropertyKeys,
  ): Promise<void> {
    const properties = normalizeMotionPropertyKeys(keys)
    if (properties && properties.length > 0) {
      console.warn(
        '[SpatialDivMotionController] Selective native pause is not yet supported; pausing entire session.',
      )
    }

    const session = this.nativeSession
    if (!session) return

    if (session.state === 'queued') {
      session.queuedPause = true
      session.state = 'paused'
      this.nativePausedElapsedMs = 0
      this.syncNativeStyleAtElapsed(0)
      this.bump()
      return
    }

    if (session.state !== 'running') return

    const element = this.element
    if (!element) return
    try {
      const values = await element.animateSpatialDiv({
        animationId: session.animationId,
        type: 'pause',
        properties: properties ?? undefined,
      })
      this.nativePausedElapsedMs = performance.now() - this.playStartWallMs
      session.state = 'paused'
      if (values) {
        this.emitValues(values)
      } else {
        this.syncNativeStyleAtElapsed(this.nativePausedElapsedMs)
      }
      this.bump()
    } catch (e: unknown) {
      this.reportNativeError({
        animationId: session.animationId,
        command: 'pause',
        reason: e instanceof Error ? e.message : 'Pause failed',
      })
    }
  }

  private async nativeResume(
    _keys: SpatialDivMotionProperty[] | null,
  ): Promise<void> {
    await this.nativePlay()
  }

  private async nativeCancel(): Promise<void> {
    const session = this.nativeSession
    if (!session || session.state === 'idle') return

    if (session.state === 'finished') {
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      return
    }

    const element = this.element
    if (!element) {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      this.config.onCancel?.(evaluateMotionTimeline(session.config, 0))
      return
    }

    try {
      await element.animateSpatialDiv({
        animationId: session.animationId,
        type: 'cancel',
      })
    } catch {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
    }
  }

  private detachNative(opts: { cancelSession: boolean }): void {
    const session = this.nativeSession
    const element = this.element
    if (opts.cancelSession && session && element) {
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
    this.nativeSession = null
    this.nativeControlling = false
    this.bump()
  }

  /** Called when React Portal unbinds motion wiring. */
  handleMotionUnbind(): void {
    this.detachNative({ cancelSession: true })
    this.element = null
  }

  get nativeSessionAnimating(): boolean {
    const s = this.nativeSession?.state
    return s ? ['running', 'paused', 'queued'].includes(s) : false
  }
}
