import type {
  SpatializedMotionConfig,
  SpatializedMotionPlayState,
  SpatializedMotionProperty,
  SpatializedMotionPropertyKeys,
} from '../../types/spatializedMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'
import { applyFrozenProperties, snapshotScalars } from '../compute/scalarValues'
import { motionTimeSec } from '../compute/timing'
import { normalizeMotionPropertyKeys } from '../compute/propertyKeys'

/**
 * Collaboration surface a playback backend needs from its owning controller.
 * Injected so backends never reference the Controller directly (no back-edge).
 */
export interface PlaybackBackendContext {
  getConfig(): SpatializedMotionConfig
  emitValues(values: SpatializedVisualValues): void
  notifyStateChange(): void
  isDestroyed(): boolean
  isPendingPlay(): boolean
  clearPendingPlay(): void
}

/**
 * requestAnimationFrame-driven playback strategy.
 *
 * Owns the entire Web raf state machine that previously lived inside
 * {@link SpatializedMotionController}: clock fields, per-property freeze map and
 * the frame loop. The controller delegates the six playback verbs here and reads
 * back state through the public getters.
 */
export class WebPlaybackBackend {
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

  constructor(private readonly ctx: PlaybackBackendContext) {}

  get state(): SpatializedMotionPlayState {
    return this.webState
  }

  get finished(): boolean {
    return this.webFinished
  }

  get hasFrozen(): boolean {
    return this.frozenByProperty.size > 0
  }

  getActiveProperties(): SpatializedMotionProperty[] {
    const all = this.ctx.getConfig().tracks.map(t => t.property)
    if (this.frozenByProperty.size === 0) return all
    return all.filter(p => !this.frozenByProperty.has(p))
  }

  sampleAt(timeSec: number): SpatializedVisualValues {
    const cfg = this.ctx.getConfig()
    let values = evaluateMotionTimeline(cfg, timeSec)
    for (const property of this.frozenByProperty.keys()) {
      const snap = this.frozenByProperty.get(property)!
      values = applyFrozenProperties(values, snap, [property])
    }
    return values
  }

  /** Mark backend queued (e.g. kind not yet resolved, or native-only awaiting runtime). */
  markQueued(resetFinished = false): void {
    this.webState = 'queued'
    if (resetFinished) this.webFinished = false
    this.ctx.notifyStateChange()
  }

  stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  play(): void {
    const cfg = this.ctx.getConfig()
    if (this.webState === 'running' && !this.fullPause) return

    if (this.webState === 'paused' || this.fullPause) {
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.fullPause = false
      this.webState = 'running'
      this.ctx.notifyStateChange()
      this.scheduleFrame()
      return
    }

    if (this.webState === 'finished') {
      this.webFinished = false
    }

    if (!this.webStarted) {
      this.webStarted = true
      cfg.onStart?.()
    }

    this.startWallMs = performance.now()
    this.pausedElapsedMs = 0
    this.fullPause = false
    this.webState = 'running'
    this.ctx.notifyStateChange()
    this.stopRaf()
    this.scheduleFrame()
  }

  pause(keys?: SpatializedMotionPropertyKeys): void {
    const cfg = this.ctx.getConfig()
    const normalized = normalizeMotionPropertyKeys(keys)

    if (normalized === null) {
      if (this.webState !== 'running') return
      this.pausedElapsedMs = performance.now() - this.startWallMs
      this.fullPause = true
      this.webState = 'paused'
      this.stopRaf()
      this.ctx.emitValues(
        this.sampleAt(motionTimeSec(this.pausedElapsedMs, cfg)),
      )
      this.ctx.notifyStateChange()
      return
    }

    if (this.webState !== 'running' && this.webState !== 'paused') return
    const t =
      this.webState === 'paused' && this.fullPause
        ? motionTimeSec(this.pausedElapsedMs, cfg)
        : motionTimeSec(performance.now() - this.startWallMs, cfg)
    const current = this.sampleAt(t)
    for (const property of normalized) {
      this.frozenByProperty.set(property, snapshotScalars(current, [property]))
    }
    if (this.webState === 'paused' && this.fullPause) {
      this.fullPause = false
      this.webState = 'running'
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.scheduleFrame()
    }
    this.ctx.emitValues(this.sampleAt(t))
    this.ctx.notifyStateChange()
  }

  resume(keys: SpatializedMotionProperty[] | null): void {
    if (keys === null) {
      if (this.webState === 'paused' && this.fullPause) {
        this.play()
        return
      }
      if (this.frozenByProperty.size > 0) {
        this.frozenByProperty.clear()
        this.ctx.notifyStateChange()
        if (this.webState === 'running') this.scheduleFrame()
      }
      return
    }

    for (const property of keys) {
      this.frozenByProperty.delete(property)
    }
    this.ctx.notifyStateChange()
    if (this.webState === 'running') this.scheduleFrame()
    else if (this.webState === 'paused' && this.fullPause) this.play()
  }

  reset(): void {
    const cfg = this.ctx.getConfig()
    this.stopRaf()
    this.frozenByProperty.clear()
    this.fullPause = false
    this.ctx.clearPendingPlay()
    const values = evaluateMotionTimeline(cfg, 0)
    this.ctx.emitValues(values)
    this.webState = 'idle'
    this.webFinished = false
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.ctx.notifyStateChange()
    cfg.onReset?.(values)
  }

  stop(): void {
    const cfg = this.ctx.getConfig()
    if (this.webState === 'idle' && !this.ctx.isPendingPlay()) return
    this.stopRaf()
    const wasRunning = this.webState === 'running' || this.webState === 'paused'
    const wasQueued = this.webState === 'queued' || this.ctx.isPendingPlay()
    if (!wasRunning && wasQueued) {
      this.frozenByProperty.clear()
      this.fullPause = false
      this.ctx.clearPendingPlay()
      this.webState = 'idle'
      this.webFinished = false
      this.webStarted = false
      this.pausedElapsedMs = 0
      this.ctx.notifyStateChange()
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
    this.ctx.clearPendingPlay()
    const values = this.sampleAt(motionTimeSec(elapsedAtStop, cfg))
    this.ctx.emitValues(values)
    this.webState = 'idle'
    this.webFinished = false
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.ctx.notifyStateChange()
    cfg.onStop?.(values)
  }

  finish(): void {
    const cfg = this.ctx.getConfig()
    this.stopRaf()
    this.frozenByProperty.clear()
    this.fullPause = false
    this.ctx.clearPendingPlay()
    const values = evaluateMotionTimeline(cfg, cfg.duration)
    this.ctx.emitValues(values)
    this.webState = 'finished'
    this.webFinished = true
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.ctx.notifyStateChange()
    cfg.onComplete?.(values)
  }

  private scheduleFrame(): void {
    this.stopRaf()
    this.rafId = requestAnimationFrame(() => this.frame())
  }

  private frame(): void {
    const cfg = this.ctx.getConfig()
    if (this.webState !== 'running' || this.ctx.isDestroyed()) return

    const elapsed = performance.now() - this.startWallMs
    const t = motionTimeSec(elapsed, cfg)

    if (t >= cfg.duration) {
      const values = this.sampleAt(cfg.duration)
      this.ctx.emitValues(values)
      if (cfg.loop) {
        this.startWallMs = performance.now()
        this.pausedElapsedMs = 0
        this.ctx.emitValues(this.sampleAt(0))
        this.scheduleFrame()
        return
      }
      this.stopRaf()
      this.webState = 'finished'
      this.webFinished = true
      this.webStarted = false
      this.ctx.notifyStateChange()
      cfg.onComplete?.(values)
      return
    }

    this.ctx.emitValues(this.sampleAt(t))
    this.scheduleFrame()
  }
}
