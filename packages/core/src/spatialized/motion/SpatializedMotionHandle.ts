import type { SpatialDivMotionConfig } from '../../types/spatialDivMotion'
import type { SpatialDivPlaybackApi } from '../../types/spatialDivMotion'

/** Shared imperative surface for all SpatializedElement motion controllers. */
export interface SpatializedMotionHandle extends SpatialDivPlaybackApi {
  readonly id: string
  readonly isDestroyed: boolean
  readonly nativeSessionAnimating: boolean
  updateDefinition(config: SpatialDivMotionConfig): void
  attachElement(element: unknown): void
  destroy(): void
  getSuppressedFields(): Set<string> | null
  handleMotionUnbind(): void
}
