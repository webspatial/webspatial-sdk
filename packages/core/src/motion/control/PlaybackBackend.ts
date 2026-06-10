import type {
  SpatializedMotionConfig,
  SpatializedMotionPlayState,
  SpatializedMotionPropertyKeys,
} from '../../types/spatializedMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'

/**
 * Collaboration surface a playback backend needs from its owning controller.
 *
 * Injected so backends never reference the Controller directly (no back-edge).
 * Both {@link WebPlaybackBackend} and {@link NativePlaybackBackend} are
 * constructed with one of these.
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
 * Common abstraction for the two interchangeable playback strategies (Strategy
 * pattern). The controller (Facade) holds a single `PlaybackBackend` reference
 * for the six shared playback verbs plus aggregated `playState`, satisfying the
 * Dependency Inversion Principle.
 *
 * Backend-specific capabilities (raf `frame`/`sampleAt` vs native `detach`/
 * command queue) intentionally stay off this interface to avoid a leaky
 * abstraction; the controller reaches for them through the concrete type only
 * where genuinely needed.
 */
export interface PlaybackBackend {
  readonly playState: SpatializedMotionPlayState
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  /** Whether a native session is currently animating (always false for web). */
  readonly sessionAnimating: boolean
  play(): void
  pause(keys?: SpatializedMotionPropertyKeys): void
  resume(keys?: SpatializedMotionPropertyKeys): void
  stop(): void
  reset(): void
  finish(): void
  /** Fields to suppress on the Portal while this backend drives playback. */
  getSuppressedFields(): Set<string> | null
  /** Release all resources (raf loop / native session). */
  destroy(): void
}
