import type {
  SpatializedMotionConfig,
  SpatializedMotionPlayState,
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
 * Common playback strategy interface for web and native backends.
 */
export interface PlaybackBackend {
  readonly playState: SpatializedMotionPlayState
  readonly isAnimating: boolean
  readonly isPaused: boolean
  readonly finished: boolean
  play(): void
  pause(): void
  resume(): void
  stop(): void
  reset(): void
  finish(): void
  /** Fields to suppress on the Portal while this backend drives playback. */
  getSuppressedFields(): Set<string> | null
  /** Release all resources (raf loop / native session). */
  destroy(): void
}
