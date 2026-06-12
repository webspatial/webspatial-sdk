import type {
  SpatializedMotionConfig,
  SpatializedMotionPlayState,
} from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../compute/sample'
import { motionTimeSec } from '../compute/timing'
import type { PlaybackBackend, PlaybackBackendContext } from './PlaybackBackend'

/**
 * requestAnimationFrame-driven playback strategy.
 *
 * Owns the entire Web raf state machine that previously lived inside
 * {@link SpatializedMotionController}: clock fields, the frame loop, and
 * direct timeline sampling for web-driven visual updates.
 */
export class WebPlaybackBackend implements PlaybackBackend {
  private webState: SpatializedMotionPlayState = 'idle'
  private webStarted = false
  private rafId: number | null = null
  private startWallMs = 0
  private pausedElapsedMs = 0
  private sessionConfig: SpatializedMotionConfig | null = null
  private loopDirection: 1 | -1 = 1

  constructor(private readonly ctx: PlaybackBackendContext) {}

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
    return this.webState === 'finished'
  }

  /** Web playback drives the Portal directly, so it never suppresses fields. */
  getSuppressedFields(): Set<string> | null {
    return null
  }

  /** Release the raf loop (reusable: a later play() can restart the clock). */
  destroy(): void {
    this.stopRaf()
    this.sessionConfig = null
  }

  /** Freeze config per web session so re-renders only affect the next play(). */
  private getCurrentSessionConfig(): SpatializedMotionConfig {
    return this.sessionConfig ?? this.ctx.getConfig()
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private resetLoopDirection(): void {
    this.loopDirection = 1
  }

  private evaluateTime(rawTimeSec: number, durationSec: number): number {
    return this.loopDirection === 1 ? rawTimeSec : durationSec - rawTimeSec
  }

  play(): void {
    if (this.webState === 'running') return

    if (this.webState === 'paused') {
      this.startWallMs = performance.now() - this.pausedElapsedMs
      this.webState = 'running'
      this.ctx.notifyStateChange()
      this.scheduleFrame()
      return
    }

    this.sessionConfig = this.ctx.getConfig()
    const cfg = this.getCurrentSessionConfig()
    this.resetLoopDirection()
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
    const cfg = this.getCurrentSessionConfig()
    if (this.webState !== 'running') return
    this.pausedElapsedMs = performance.now() - this.startWallMs
    this.webState = 'paused'
    this.stopRaf()
    this.ctx.emitValues(
      evaluateMotionTimeline(
        cfg,
        this.evaluateTime(
          motionTimeSec(this.pausedElapsedMs, cfg),
          cfg.duration,
        ),
      ),
    )
    this.ctx.notifyStateChange()
  }

  resume(): void {
    if (this.webState !== 'paused') return
    this.play()
  }

  reset(): void {
    const cfg = this.getCurrentSessionConfig()
    this.stopRaf()
    this.ctx.clearPendingPlay()
    const values = evaluateMotionTimeline(cfg, 0)
    this.ctx.emitValues(values)
    this.webState = 'idle'
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.sessionConfig = null
    this.resetLoopDirection()
    this.ctx.notifyStateChange()
    cfg.onReset?.(values)
  }

  stop(): void {
    const cfg = this.getCurrentSessionConfig()
    if (this.webState === 'idle' && !this.ctx.isPendingPlay()) return
    this.stopRaf()
    const wasRunning = this.webState === 'running' || this.webState === 'paused'
    const wasQueued = this.webState === 'queued' || this.ctx.isPendingPlay()
    if (!wasRunning && wasQueued) {
      this.ctx.clearPendingPlay()
      this.webState = 'idle'
      this.webStarted = false
      this.pausedElapsedMs = 0
      this.sessionConfig = null
      this.resetLoopDirection()
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
    const values = evaluateMotionTimeline(
      cfg,
      this.evaluateTime(motionTimeSec(elapsedAtStop, cfg), cfg.duration),
    )
    this.ctx.emitValues(values)
    this.webState = 'idle'
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.resetLoopDirection()
    this.ctx.notifyStateChange()
    cfg.onStop?.(values)
  }

  finish(): void {
    if (this.webState === 'idle' && !this.sessionConfig) {
      this.sessionConfig = this.ctx.getConfig()
    }
    const cfg = this.getCurrentSessionConfig()
    this.stopRaf()
    this.ctx.clearPendingPlay()
    const values = evaluateMotionTimeline(cfg, cfg.duration)
    this.ctx.emitValues(values)
    this.webState = 'finished'
    this.webStarted = false
    this.pausedElapsedMs = 0
    this.resetLoopDirection()
    this.ctx.notifyStateChange()
    cfg.onComplete?.(values)
  }

  private scheduleFrame(): void {
    this.stopRaf()
    this.rafId = requestAnimationFrame(() => this.frame())
  }

  private frame(): void {
    const cfg = this.getCurrentSessionConfig()
    if (this.webState !== 'running' || this.ctx.isDestroyed()) return

    const elapsed = performance.now() - this.startWallMs
    const rawTimeSec = motionTimeSec(elapsed, cfg)
    const t = this.evaluateTime(rawTimeSec, cfg.duration)

    if (rawTimeSec >= cfg.duration) {
      const loopEndpoint = this.loopDirection === 1 ? cfg.duration : 0
      const values = evaluateMotionTimeline(cfg, loopEndpoint)
      this.ctx.emitValues(values)
      if (cfg.loop) {
        if (typeof cfg.loop === 'object' && cfg.loop.reverse) {
          this.loopDirection = this.loopDirection === 1 ? -1 : 1
          this.startWallMs = performance.now()
          this.pausedElapsedMs = 0
          this.scheduleFrame()
          return
        }
        this.startWallMs = performance.now()
        this.pausedElapsedMs = 0
        this.ctx.emitValues(evaluateMotionTimeline(cfg, 0))
        this.scheduleFrame()
        return
      }
      this.stopRaf()
      this.webState = 'finished'
      this.webStarted = false
      this.ctx.notifyStateChange()
      cfg.onComplete?.(values)
      return
    }

    this.ctx.emitValues(evaluateMotionTimeline(cfg, t))
    this.scheduleFrame()
  }
}
