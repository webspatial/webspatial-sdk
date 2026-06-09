import type {
  SpatializedMotionConfig,
  SpatializedMotionProperty,
} from '../../types/spatializedMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'
import { applyFrozenProperties } from '../compute/scalarValues'

/**
 * Shared visual sampler / freeze registry used by both playback backends.
 *
 * Extracting this collaborator removes the cross-backend borrowing where the
 * native path used to call back into the web backend's `sampleAt` to compute
 * final/visual values. Both {@link WebPlaybackBackend} and
 * {@link NativePlaybackBackend} sample through this single object, so neither
 * depends on the other.
 */
export class Sampler {
  /** Per-property freeze while clock may still run (Web selective pause). */
  private readonly frozen = new Map<
    SpatializedMotionProperty,
    SpatializedVisualValues
  >()

  constructor(private readonly getConfig: () => SpatializedMotionConfig) {}

  get hasFrozen(): boolean {
    return this.frozen.size > 0
  }

  getActiveProperties(): SpatializedMotionProperty[] {
    const all = this.getConfig().tracks.map(t => t.property)
    if (this.frozen.size === 0) return all
    return all.filter(p => !this.frozen.has(p))
  }

  sampleAt(timeSec: number): SpatializedVisualValues {
    const cfg = this.getConfig()
    let values = evaluateMotionTimeline(cfg, timeSec)
    for (const property of this.frozen.keys()) {
      const snap = this.frozen.get(property)!
      values = applyFrozenProperties(values, snap, [property])
    }
    return values
  }

  freeze(
    property: SpatializedMotionProperty,
    snap: SpatializedVisualValues,
  ): void {
    this.frozen.set(property, snap)
  }

  unfreeze(property: SpatializedMotionProperty): void {
    this.frozen.delete(property)
  }

  clearFrozen(): void {
    this.frozen.clear()
  }
}
