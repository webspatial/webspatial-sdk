import type { Spatialized2DElement } from '@webspatial/core-sdk'

/** Internal binding surface for Portal (parallel to SpatialDivAnimatedPropsInternal). */
export interface SpatialDivMotionBindingInternal {
  readonly __kind: 'spatialDivMotion'
  readonly __motionObjectId: string
  get __animating(): boolean
  __getSuppressedFields(): Set<string> | null
  __setElement?: (element: Spatialized2DElement | null) => void
  __onUnbind?: () => void
}
