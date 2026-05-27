import type { Spatialized2DElement } from '@webspatial/core-sdk'

/** Internal binding surface for Portal (2D `motion` / legacy `animation` prop). */
export interface SpatializedMotionBindingInternal {
  readonly __kind: 'spatializedMotion'
  readonly __motionObjectId: string
  get __animating(): boolean
  __getSuppressedFields(): Set<string> | null
  __setElement?: (element: Spatialized2DElement | null) => void
  __onUnbind?: () => void
}
