import type { SpatializedMotionConfig } from '../../types/spatializedMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'

/**
 * Shared visual sampler used by both playback backends.
 *
 * Extracting this collaborator removes the cross-backend borrowing where the
 * native path used to call back into the web backend's `sampleAt` to compute
 * final/visual values. Both {@link WebPlaybackBackend} and
 * {@link NativePlaybackBackend} sample through this single object, so neither
 * depends on the other.
 */
export class Sampler {
  constructor(private readonly getConfig: () => SpatializedMotionConfig) {}

  sampleAt(timeSec: number): SpatializedVisualValues {
    return evaluateMotionTimeline(this.getConfig(), timeSec)
  }
}
