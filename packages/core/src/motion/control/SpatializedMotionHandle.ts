import type { SpatializedMotionConfig } from '../../types/spatializedMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import type { SpatializedPlaybackApi } from '../../types/spatializedMotion'

/** Shared imperative surface for all SpatializedElement motion controllers. */
export interface SpatializedMotionHandle extends SpatializedPlaybackApi {
  readonly id: string
  readonly isDestroyed: boolean
  readonly config: SpatializedMotionConfig
  readonly targetKind: SpatializedMotionKind | null
  updateConfig(config: SpatializedMotionConfig): void
  attachElement(element: unknown, targetKind?: SpatializedMotionKind): void
  destroy(): void
  getSuppressedFields(): Set<string> | null
  handleMotionUnbind(): void
}
