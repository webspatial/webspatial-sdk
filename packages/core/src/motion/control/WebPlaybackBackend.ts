import type { SpatializedMotionPlayState } from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../compute/sample'
import { motionTimeSec } from '../compute/timing'
import type { PlaybackBackend, PlaybackBackendContext } from './PlaybackBackend'
import type { Sampler } from './Sampler'

/**
 * requestAnimationFrame-driven playback strategy.
 *
 * Owns the entire Web raf state machine that previously lived inside
 * {@link SpatializedMotionController}: clock fields and the frame loop. The
 * visual sampling is delegated to the shared {@link Sampler}, so this backend
 * never borrows from the native backend.
 */
export class WebPlaybackBackend implements PlaybackBackend {
  private webState: SpatializedMotionPlayState = 'idle'
  private webFinished = false
  private webStarted = false
  private rafId: number | null = null
  private startWallMs = 0
  private pausedElapsedMs = 0

  constructor(
    private readonly ctx: PlaybackBackendContext,
    private readonly sampler: Sampler,
  ) {}

  get playState(): SpatializedMotionPlayState {
    return this.webState
  }

  get isAnimating(): boolean {
    return this.webState === 'running' || this.webState === 'queued'
  }

  get isPaused(): boolean {
    return this.webState === 'paused'
  }

  get finished(): boolean {
    return this.webFinished
  }

  /** Web playback never owns a native session. */
  get sessionAnimating(): boolean {
    return false
  }

  /** Web playback drives the Portal directly, so it never suppresses fields. */
  getSuppressedFields(): Set<string> | null {
    return null
  }

  /** Release the raf loop (reusable: a later play() can restart the clock). */
  destroy(): void {
    this.stopRaf()
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  play(): void {
    const cfg = this.ctx.getConfig()
    if (this.webState === 'running') return

    if (this.webState === 'paused') {
      this.startWallMs = performance.now() - this.pausedElapsedMs
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
    this.webState = 'running'
    this.ctx.notifyStateChange()
    this.stopRaf()
    this.scheduleFrame()
  }

  pause(): void {
    const cfg = this.ctx.getConfig()
    if (this.webState !== 'running') return
    this.pausedElapsedMs = performance.now() - this.startWallMs
    this.webState = 'paused'
    this.stopRaf()
    this.ctx.emitValues(
      this.sampler.sampleAt(motionTimeSec(this.pausedElapsedMs, cfg)),
    )
    this.ctx.notifyStateChange()
  }

  resume(): void {
    if (this.webState !== 'paused') return
    this.play()
  }

  reset(): void {
    const cfg = this.ctx.getConfig()
    this.stopRaf()
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
    const elapsedAtStop =
      this.webState === 'queued'
        ? 0
        : this.pausedElapsedMs > 0
          ? this.pausedElapsedMs
          : performance.now() - this.startWallMs
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
