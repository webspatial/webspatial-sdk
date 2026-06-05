import { supports } from '../../runtime/supports'
import type { ElementMotionCommand } from '../../types/spatializedElementMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import type { SpatializedMotionHandle } from './SpatializedMotionHandle'
import {
  motionElementCleanupListeners,
  motionElementPlay,
  motionElementSessionCommand,
  type MotionAnimatePlayResult,
  type MotionHostElement,
} from './motionElementBridge'
import { MOTION_KIND_POLICIES, type MotionKindPolicy } from './motionKindPolicy'
import { warnNativeOnlyMotion } from './nativeOnlyMotion'
import type { SpatializedPlaybackError } from '../../types/spatializedPlayback'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type {
  SpatializedMotionConfig,
  SpatializedPlaybackApi,
  SpatializedMotionPlayState,
  SpatializedMotionProperty,
  SpatializedMotionPropertyKeys,
  SpatializedMotionTimeline,
} from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../../spatialdiv/motion/evaluate'
import {
  applyFrozenProperties,
  snapshotScalars,
} from '../../spatialdiv/motion/mergeValues'
import { motionConfigToNativeTimeline } from '../../spatialdiv/motion/nativeCompile'
import { motionTimeSec } from '../../spatialdiv/motion/motionTiming'
import { normalizeMotionPropertyKeys } from '../../spatialdiv/motion/propertyKeys'
import { validateSpatializedMotionConfig } from '../../spatialdiv/motion/validate'

export interface SpatializedMotionControllerOptions {
  /** Initial element; may be set later via {@link attachElement}. */
  element?: MotionHostElement | null
  /**
   * When set, overrides `supports('useAnimation', [kind])` for backend selection.
   * Existing native element controllers can keep using this for tests.
   */
  forceNativePlayback?: boolean
  /** Fired when sampled values should update a style outlet. */
  onValuesChange?: (values: SpatializedVisualValues) => void
  /** Fired when {@link playState} changes (e.g. React re-render). */
  onStateChange?: () => void
  /** Optional backend capability resolver, used by React tests to mock support checks. */
  supportsMotionKind?: (kind: SpatializedMotionKind) => boolean
}

type SessionState = 'idle' | 'queued' | 'running' | 'paused' | 'finished'

interface NativeSession {
  animationId: string
  state: SessionState
  config: SpatializedMotionConfig
  result?: MotionAnimatePlayResult
  queuedPause?: boolean
  unmounted?: boolean
}

let _motionObjectCounter = 0
function nextMotionObjectId(prefix: string): string {
  return `${prefix}${++_motionObjectCounter}_${Date.now()}`
}

let _sessionCounter = 0
function nextAnimationId(prefix: string): string {
  return `${prefix}${++_sessionCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getPolicy(kind: SpatializedMotionKind | null): MotionKindPolicy {
  switch (kind) {
    case 'static3d':
      return MOTION_KIND_POLICIES.static3d
    case 'dynamic3d':
      return MOTION_KIND_POLICIES.dynamic3d
    case 'spatialized2d':
    default:
      return MOTION_KIND_POLICIES.spatialized2d
  }
}

/**
 * Runtime controller for a spatialized element motion timeline.
 * Implements react-spring-style selective `pause(['opacity'])` on the Web backend.
 */
export class SpatializedMotionController
  implements SpatializedPlaybackApi, SpatializedMotionHandle
{
  readonly id: string

  private kind: SpatializedMotionKind | null
  private config: SpatializedMotionConfig
  private element: MotionHostElement | null
  private readonly onValuesChange?: (values: SpatializedVisualValues) => void
  private readonly onStateChange?: () => void

  private webState: SpatializedMotionPlayState = 'idle'
  private webFinished = false
  private webStarted = false
  private rafId: number | null = null
  private startWallMs = 0
  private pausedElapsedMs = 0
  /** Full timeline pause (clock stopped). */
  private fullPause = false
  /** Per-property freeze while clock may still run. */
  private readonly frozenByProperty = new Map<
    SpatializedMotionProperty,
    SpatializedVisualValues
  >()

  private nativeSession: NativeSession | null = null
  private nativeControlling = false
  private nativePlayToken = 0
  private playStartWallMs = 0
  private nativePausedElapsedMs = 0
  private commandQueue: Promise<void> = Promise.resolve()
  private warnedNative = false
  private warnedQueued = false
  private warnedNativeOnly = false
  private destroyed = false
  private pendingPlay = false
  private readonly forceNativePlayback?: boolean
  private readonly supportsMotionKind?: (kind: SpatializedMotionKind) => boolean

  constructor(
    config: SpatializedMotionConfig,
    kindOrOptions?: SpatializedMotionKind | SpatializedMotionControllerOptions,
    options: SpatializedMotionControllerOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    const kind = typeof kindOrOptions === 'string' ? kindOrOptions : undefined
    const resolvedOptions =
      typeof kindOrOptions === 'string' ? options : (kindOrOptions ?? {})

    this.kind = kind ?? null
    this.config = config
    this.id = nextMotionObjectId(
      this.kind === 'static3d'
        ? MOTION_KIND_POLICIES.static3d.motionObjectIdPrefix
        : this.kind === 'dynamic3d'
          ? MOTION_KIND_POLICIES.dynamic3d.motionObjectIdPrefix
          : MOTION_KIND_POLICIES.spatialized2d.motionObjectIdPrefix,
    )
    this.element = resolvedOptions.element ?? null
    this.forceNativePlayback = resolvedOptions.forceNativePlayback
    this.supportsMotionKind = resolvedOptions.supportsMotionKind
    this.onValuesChange = resolvedOptions.onValuesChange
    this.onStateChange = resolvedOptions.onStateChange
    this.emitValues(evaluateMotionTimeline(config, 0))
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  get definition(): SpatializedMotionConfig {
    return this.config
  }

  get targetKind(): SpatializedMotionKind | null {
    return this.kind
  }

  updateDefinition(config: SpatializedMotionConfig): void {
    validateSpatializedMotionConfig(config)
    this.config = config
  }

  attachElement(
    element: MotionHostElement | null,
    targetKind?: SpatializedMotionKind,
  ): void {
    const previousKind = this.kind
    const previousElement = this.element

    if (targetKind) {
      if (this.kind && this.kind !== targetKind) {
        console.warn(
          `[${getPolicy(this.kind).controllerLabel}] motion binding already resolved to ${this.kind}; ignoring ${targetKind}.`,
        )
        return
      }
      if (!this.kind) {
        this.kind = targetKind
      }
    }

    if (element && this.element && this.element !== element) {
      console.warn(
        `[${getPolicy(this.kind).controllerLabel}] motion binding already attached to another component; ignoring subsequent bind.`,
      )
      return
    }

    this.element = element
    if (previousKind !== this.kind || previousElement !== this.element) {
      this.bump()
    }
    if (!element) return

    if (this.pendingPlay || this.config.autoStart !== false) {
      this.play()
    }
  }

  destroy(): void {
    this.destroyed = true
    this.pendingPlay = false
    this.stopWebRaf()
    this.detachNative({ cancelSession: true })
  }

  get playState(): SpatializedMotionPlayState {
    if (!this.kind) {
      if (this.pendingPlay) return 'queued'
      return this.webState
    }

    const s = this.nativeSession?.state
    if (s === 'queued') return 'running'
    if (s && s !== 'idle') return s
    return this.webState
  }

  get isAnimating(): boolean {
    if (!this.kind) {
      return this.pendingPlay || this.webState === 'running'
    }
    const s = this.nativeSession?.state
    if (s === 'running' || s === 'queued') return true
    return this.webState === 'running' || this.webState === 'queued'
  }

  get isPaused(): boolean {
    if (this.kind && this.nativeSession?.state === 'paused') {
      return true
    }
    return (
      this.webState === 'paused' ||
      (this.webState === 'running' && this.frozenByProperty.size > 0)
    )
  }

  get finished(): boolean {
    if (this.kind && this.nativeSession?.state === 'finished') {
      return true
    }
    return this.webFinished
  }

  /** Fields to suppress on the Portal while native drives playback. */
  getSuppressedFields(): Set<string> | null {
    if (!this.kind) return null
    if (this.kind === 'spatialized2d') {
      const nativeState = this.nativeSession?.state
      const nativeSuppressionReleased =
        this.nativeCapable &&
        !this.pendingPlay &&
        !this.nativeControlling &&
        (!nativeState || nativeState === 'idle' || nativeState === 'finished')

      if (nativeSuppressionReleased) {
        return null
      }
      if (nativeState !== 'running' && nativeState !== 'paused') {
        return null
      }
      const active = this.getActiveProperties()
      const subset = this.config.tracks.filter(t => active.includes(t.property))
      if (subset.length === 0) return null
      return getPolicy(this.kind).getSuppressedFields({
        ...this.config,
        tracks: subset,
      })
    }
    const s = this.nativeSession?.state
    if (!s || (s !== 'running' && s !== 'paused')) return null
    const active = this.getActiveProperties()
    const subset = this.config.tracks.filter(t => active.includes(t.property))
    if (subset.length === 0) return null
    return getPolicy(this.kind).getSuppressedFields({
      ...this.config,
      tracks: subset,
    })
  }

  play(): void {
    if (this.destroyed) return
    if (!this.kind) {
      if (!this.pendingPlay) {
        this.pendingPlay = true
        this.webState = 'queued'
        this.webFinished = false
        this.bump()
      }
      return
    }

    this.pendingPlay = false

    const policy = getPolicy(this.kind)
    if (!this.nativeCapable) {
      if (policy.webPlayback === 'none') {
        if (!this.warnedNativeOnly) {
          this.warnedNativeOnly = true
          warnNativeOnlyMotion(policy.controllerLabel, this.kind)
        }
        this.webState = 'queued'
        this.bump()
        return
      }
      this.webPlay()
      return
    }

    this.stopWebRaf()
    const sessionState = this.nativeSession?.state
    if (
      !sessionState ||
      sessionState === 'idle' ||
      sessionState === 'finished'
    ) {
      const token = ++this.nativePlayToken
      this.enqueueNative(() => this.nativePlay(token))
      return
    }

    this.enqueueNative(() => this.nativePlay())
  }

  pause(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') this.webPause(keys)
      return
    }
    const ns = this.nativeSession?.state
    if (ns === 'running' || ns === 'queued') {
      this.enqueueNative(() => this.nativePause(keys))
    }
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') {
        this.webResume(normalizeMotionPropertyKeys(keys))
      }
      return
    }
    const normalized = normalizeMotionPropertyKeys(keys)
    if (this.nativeSession?.state === 'paused') {
      this.enqueueNative(() => this.nativeResume(normalized))
    }
  }

  stop(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.webStop()
      return
    }

    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') {
        this.webStop()
        return
      }
      if (this.webState === 'queued' || this.pendingPlay) {
        this.webStop()
      }
      return
    }

    const ns = this.nativeSession?.state
    if (ns && ns !== 'idle' && ns !== 'finished') {
      this.enqueueNative(() => this.nativeStop())
      return
    }
    this.nativePlayToken++
  }

  reset(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.webReset()
      return
    }

    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') {
        this.webReset()
        return
      }
      this.webReset()
      return
    }

    const ns = this.nativeSession?.state
    if (ns && ns !== 'idle') {
      this.enqueueNative(() => this.nativeReset())
      return
    }
    this.nativePlayToken++
    this.webReset()
  }

  finish(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.webFinish()
      return
    }

    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') {
        this.webFinish()
        return
      }
      this.webFinish()
      return
    }

    const ns = this.nativeSession?.state
    if (ns && ns !== 'idle' && ns !== 'finished') {
      this.enqueueNative(() => this.nativeFinish())
      return
    }
    if (!ns || ns === 'idle') {
      this.nativePlayToken++
      this.webFinish()
    }
  }

  private get nativeCapable(): boolean {
    if (!this.kind) return false
    if (this.forceNativePlayback !== undefined) {
      return this.forceNativePlayback
    }
    if (this.supportsMotionKind) {
      return this.supportsMotionKind(this.kind)
    }
    const token = this.kind === 'spatialized2d' ? 'element' : this.kind
    return supports('useAnimation', [token])
  }

  private bump(): void {
    this.onStateChange?.()
  }

  private emitValues(values: SpatializedVisualValues): void {
    this.onValuesChange?.(values)
  }

  private getActiveProperties(): SpatializedMotionProperty[] {
    const all = this.config.tracks.map(t => t.property)
    if (this.frozenByProperty.size === 0) return all
    return all.filter(p => !this.frozenByProperty.has(p))
  }

  private sampleAt(timeSec: number): SpatializedVisualValues {
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

  private webPause(keys?: SpatializedMotionPropertyKeys): void {
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

  private webResume(keys: SpatializedMotionProperty[] | null): void {
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

  private webReset(): void {
    this.stopWebRaf()
    this.frozenByProperty.clear()
    this.fullPause = false
    this.pendingPlay = false
    const values = evaluateMotionTimeline(this.config, 0)
    this.emitValues(values)
    this.webState = 'idle'
    this.webFinished = false
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.bump()
    this.config.onReset?.(values)
  }

  private webStop(): void {
    if (this.webState === 'idle' && !this.pendingPlay) return
    this.stopWebRaf()
    const wasRunning = this.webState === 'running' || this.webState === 'paused'
    const wasQueued = this.webState === 'queued' || this.pendingPlay
    if (!wasRunning && wasQueued) {
      this.frozenByProperty.clear()
      this.fullPause = false
      this.pendingPlay = false
      this.webState = 'idle'
      this.webFinished = false
      this.webStarted = false
      this.pausedElapsedMs = 0
      this.bump()
      return
    }
    if (!wasRunning) {
      return
    }
    const wasFullPause = this.fullPause
    const elapsedAtStop =
      this.webState === 'queued'
        ? 0
        : wasFullPause
          ? this.pausedElapsedMs
          : this.pausedElapsedMs > 0
            ? this.pausedElapsedMs
            : performance.now() - this.startWallMs
    this.frozenByProperty.clear()
    this.fullPause = false
    this.pendingPlay = false
    const values = this.sampleAt(motionTimeSec(elapsedAtStop, this.config))
    this.emitValues(values)
    this.webState = 'idle'
    this.webFinished = false
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.bump()
    this.config.onStop?.(values)
  }

  private webFinish(): void {
    this.stopWebRaf()
    this.frozenByProperty.clear()
    this.fullPause = false
    this.pendingPlay = false
    const values = evaluateMotionTimeline(this.config, this.config.duration)
    this.emitValues(values)
    this.webState = 'finished'
    this.webFinished = true
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.bump()
    this.config.onComplete?.(values)
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
      this.webStarted = false
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
    if (this.destroyed) return
    const cfg = this.config
    if (cfg.onError) {
      cfg.onError(error as SpatializedPlaybackError)
    } else {
      console.error(
        `[${getPolicy(this.kind).controllerLabel}] Native error:`,
        error,
      )
    }
  }

  private async doNativePlay(
    session: NativeSession,
    element: MotionHostElement,
  ): Promise<void> {
    if (!this.kind) return
    const cmd = this.buildPlayCommand(session, element.id)
    if (!cmd) return

    try {
      const result = await motionElementPlay(this.kind, element, cmd)
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
        this.config.onReset?.(currentValues)
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
        await motionElementSessionCommand(this.kind, element, {
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

  private async nativePlay(expectedToken?: number): Promise<void> {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (!this.warnedNative) {
        this.warnedNative = true
        console.warn(
          `[${getPolicy(this.kind).controllerLabel}] Native motion requires supports(useAnimation, ['${this.kind === 'spatialized2d' ? 'element' : this.kind}']).`,
        )
      }
      return
    }

    if (expectedToken !== undefined && expectedToken !== this.nativePlayToken) {
      return
    }

    const current = this.nativeSession
    if (current && current.state === 'paused') {
      const element = this.element
      if (!element) return
      try {
        await motionElementSessionCommand(this.kind, element, {
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
      animationId: nextAnimationId(getPolicy(this.kind).sessionIdPrefix),
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
          `[${getPolicy(this.kind).controllerLabel}] Native play is queued until attachElement / motion bind.`,
        )
      }
      this.bump()
      return
    }

    await this.doNativePlay(session, element)
  }

  private async nativePause(
    keys?: SpatializedMotionPropertyKeys,
  ): Promise<void> {
    if (!this.kind) return
    const properties = normalizeMotionPropertyKeys(keys)
    if (properties && properties.length > 0) {
      console.warn(
        `[${getPolicy(this.kind).controllerLabel}] Selective native pause is not yet supported; pausing entire session.`,
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
      const values = await motionElementSessionCommand(this.kind, element, {
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
    _keys: SpatializedMotionProperty[] | null,
  ): Promise<void> {
    await this.nativePlay()
  }

  private async nativeReset(): Promise<void> {
    if (!this.kind) return
    const session = this.nativeSession
    if (!session || session.state === 'idle') return

    if (session.state === 'finished') {
      const values = evaluateMotionTimeline(session.config, 0)
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      this.emitValues(values)
      this.config.onReset?.(values)
      return
    }

    const element = this.element
    if (!element) {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      const values = evaluateMotionTimeline(session.config, 0)
      this.config.onReset?.(values)
      this.emitValues(values)
      return
    }

    try {
      const values = await motionElementSessionCommand(this.kind, element, {
        animationId: session.animationId,
        type: 'reset',
      })
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      if (values) {
        this.emitValues(values)
        this.config.onReset?.(values)
      } else {
        const fallback = evaluateMotionTimeline(session.config, 0)
        this.emitValues(fallback)
        this.config.onReset?.(fallback)
      }
    } catch {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
    }
  }

  private async nativeStop(): Promise<void> {
    if (!this.kind) return
    const session = this.nativeSession
    if (!session || session.state === 'idle' || session.state === 'finished')
      return

    const currentValues = this.sampleAt(
      motionTimeSec(
        session.state === 'queued'
          ? 0
          : this.nativePausedElapsedMs > 0
            ? this.nativePausedElapsedMs
            : performance.now() - this.playStartWallMs,
        session.config,
      ),
    )

    const element = this.element
    if (!element) {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      this.emitValues(currentValues)
      this.config.onStop?.(currentValues)
      return
    }

    try {
      const values = await motionElementSessionCommand(this.kind, element, {
        animationId: session.animationId,
        type: 'stop',
      })
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      const output = values ?? currentValues
      this.emitValues(output)
      this.config.onStop?.(output)
    } catch {
      session.state = 'idle'
      this.nativeSession = null
      this.nativeControlling = false
      this.bump()
      this.emitValues(currentValues)
      this.config.onStop?.(currentValues)
    }
  }

  private async nativeFinish(): Promise<void> {
    if (!this.kind) return
    const session = this.nativeSession
    if (!session || session.state === 'idle' || session.state === 'finished')
      return

    const element = this.element
    if (!element) {
      session.state = 'finished'
      this.nativeControlling = false
      this.bump()
      const values = evaluateMotionTimeline(
        session.config,
        session.config.duration,
      )
      this.emitValues(values)
      this.config.onComplete?.(values)
      return
    }

    try {
      const values = await motionElementSessionCommand(this.kind, element, {
        animationId: session.animationId,
        type: 'finish',
      })
      session.state = 'finished'
      this.nativeControlling = false
      this.bump()
      const output =
        values ??
        evaluateMotionTimeline(session.config, session.config.duration)
      this.emitValues(output)
      this.config.onComplete?.(output)
    } catch {
      session.state = 'finished'
      this.nativeControlling = false
      this.bump()
      const fallback = evaluateMotionTimeline(
        session.config,
        session.config.duration,
      )
      this.emitValues(fallback)
      this.config.onComplete?.(fallback)
    }
  }

  private detachNative(opts: { cancelSession: boolean }): void {
    const session = this.nativeSession
    const element = this.element
    if (this.kind && opts.cancelSession && session && element) {
      if (session.state !== 'idle' && session.state !== 'finished') {
        ;(
          motionElementSessionCommand(this.kind, element, {
            animationId: session.animationId,
            type: 'cancel',
          } as any) as Promise<void>
        ).catch(() => {})
        motionElementCleanupListeners(this.kind, element, session.animationId)
        session.unmounted = true
        session.state = 'idle'
      }
    }
    this.nativeSession = null
    this.nativeControlling = false
    this.nativePlayToken++
    this.pendingPlay = false
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
