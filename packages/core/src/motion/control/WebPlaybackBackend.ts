import type {
  SpatializedMotionPlayState,
  SpatializedMotionPropertyKeys,
} from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../compute/sample'
import { snapshotScalars } from '../compute/scalarValues'
import { motionTimeSec } from '../compute/timing'
import { normalizeMotionPropertyKeys } from '../compute/propertyKeys'
import type { PlaybackBackend, PlaybackBackendContext } from './PlaybackBackend'
import type { Sampler } from './Sampler'

/**
 * requestAnimationFrame-driven playback strategy.
 *
 * Owns the entire Web raf state machine that previously lived inside
 * {@link SpatializedMotionController}: clock fields and the frame loop. The
 * per-property freeze map and visual sampling are delegated to the shared
 * {@link Sampler}, so this backend never borrows from the native backend.
 */
export class WebPlaybackBackend implements PlaybackBackend {
  private webState: SpatializedMotionPlayState = 'idle'
  private webFinished = false
  private webStarted = false
  private rafId: number | null = null
  private startWallMs = 0
  private pausedElapsedMs = 0
  /** Full timeline pause (clock stopped). */
  private fullPause = false

  constructor(
    private readonly ctx: PlaybackBackendContext,
    private readonly sampler: Sampler,
  ) {}

  get playState(): SpatializedMotionPlayState {
    return this.webState
  }

  get state(): SpatializedMotionPlayState {
    return this.webState
  }

  get finished(): boolean {
    return this.webFinished
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
        this.sampler.sampleAt(motionTimeSec(this.pausedElapsedMs, cfg)),
      )
      this.ctx.notifyStateChange()
      return
    }

    if (this.webState !== 'running' && this.webState !== 'paused') return
    const t =
      this.webState === 'paused' && this.fullPause
        ? motionTimeSec(this.pausedElapsedMs, cfg)
        : motionTimeSec(performance.now() - this.startWallMs, cfg)
    const current = this.sampler.sampleAt(t)
    for (const property of normalized) {
      this.sampler.freeze(property, snapshotScalars(current, [property]))
    }
    if (this.webState === 'paused' && this.fullPause) {
      this.fullPause = false
      this.webState = 'running'
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.scheduleFrame()
    }
    this.ctx.emitValues(this.sampler.sampleAt(t))
    this.ctx.notifyStateChange()
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    const normalized = normalizeMotionPropertyKeys(keys)
    if (normalized === null) {
      if (this.webState === 'paused' && this.fullPause) {
        this.play()
        return
      }
      if (this.sampler.hasFrozen) {
        this.sampler.clearFrozen()
        this.ctx.notifyStateChange()
        if (this.webState === 'running') this.scheduleFrame()
      }
      return
    }

    for (const property of normalized) {
      this.sampler.unfreeze(property)
    }
    this.ctx.notifyStateChange()
    if (this.webState === 'running') this.scheduleFrame()
    else if (this.webState === 'paused' && this.fullPause) this.play()
  }

  reset(): void {
    const cfg = this.ctx.getConfig()
    this.stopRaf()
    this.sampler.clearFrozen()
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
      this.sampler.clearFrozen()
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
    this.sampler.clearFrozen()
    this.fullPause = false
    this.ctx.clearPendingPlay()
    const values = this.sampler.sampleAt(motionTimeSec(elapsedAtStop, cfg))
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
    this.sampler.clearFrozen()
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
      const values = this.sampler.sampleAt(cfg.duration)
      this.ctx.emitValues(values)
      if (cfg.loop) {
        this.startWallMs = performance.now()
        this.pausedElapsedMs = 0
        this.ctx.emitValues(this.sampler.sampleAt(0))
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

    this.ctx.emitValues(this.sampler.sampleAt(t))
    this.scheduleFrame()
  }
}
